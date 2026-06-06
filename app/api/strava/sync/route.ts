import { apiSupabaseError, requireApiAccess } from "@/lib/api-access";
import { noStoreJson, readJsonObject } from "@/lib/api-json";
import { getBackendClubId } from "@/lib/backend";
import { fetchStravaActivities, isStravaConfigured, refreshStravaToken, StravaApiError, STRAVA_SCOPES, type StravaActivity } from "@/lib/strava";
import { isSupabaseConfigured, selectRows, updateRows, upsertRow } from "@/lib/supabase/server";
import type { Json, TableInsert, TableRow } from "@/lib/supabase/types";

const STRAVA_REFRESH_WINDOW_SECONDS = 60 * 10;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiAccess(searchParams.get("club"));
  if (access.error) return access.error;

  if (!isSupabaseConfigured() || !isUuid(access.session.user.id)) {
    return noStoreJson({ source: "mock", activities: [], count: 0 });
  }

  let clubId: string | null = null;
  try {
    clubId = await getBackendClubId(access.session.activeClub.slug);
    if (!clubId) return noStoreJson({ source: "supabase", activities: [], count: 0 });

    const rows = await selectRows(
      "strava_activities",
      `select=*&user_id=eq.${access.session.user.id}&club_id=eq.${clubId}&order=start_date.desc&limit=20`,
    );

    return noStoreJson({
      source: "supabase",
      activities: rows.map(toPublicActivity),
      count: rows.length,
    });
  } catch (error) {
    if (error instanceof StravaApiError) return stravaProviderError(error);
    return apiSupabaseError(error, { clubId });
  }
}

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiAccess(requestedClubSlug);
  if (access.error) return access.error;

  if (!isSupabaseConfigured() || !isUuid(access.session.user.id)) {
    return noStoreJson({ ok: true, source: "mock", synced: 0, activities: [] });
  }

  if (!isStravaConfigured()) {
    return noStoreJson(
      { ok: false, source: "strava", status: "not_configured", error: "Strava is not configured on this deployment yet." },
      { status: 503 },
    );
  }

  let clubId: string | null = null;
  try {
    clubId = await getBackendClubId(access.session.activeClub.slug);
    if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

    const [connection] = await selectRows("strava_connections", `select=*&user_id=eq.${access.session.user.id}&club_id=eq.${clubId}&limit=1`);
    if (!connection) {
      return noStoreJson({ ok: false, error: "Connect Strava before syncing activities." }, { status: 409 });
    }

    if (!hasRequiredScopes(connection.scopes ?? [])) {
      return noStoreJson({ ok: false, error: "Reconnect Strava and allow activity permissions before syncing." }, { status: 409 });
    }

    const currentSeconds = Math.floor(Date.now() / 1000);
    let accessToken = connection.access_token;
    let refreshed = false;
    if (connection.expires_at <= currentSeconds + STRAVA_REFRESH_WINDOW_SECONDS) {
      const token = await refreshStravaToken(connection.refresh_token);
      const [updated] = await updateRows(
        "strava_connections",
        {
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expires_at: token.expires_at,
        },
        `user_id=eq.${access.session.user.id}&club_id=eq.${clubId}`,
      );
      accessToken = updated?.access_token ?? token.access_token;
      refreshed = Boolean(updated);
    }

    const activities = await fetchStravaActivities(accessToken, 30);
    const saved: TableRow<"strava_activities">[] = [];
    for (const activity of activities) {
      const row = await upsertRow("strava_activities", toActivityInsert(activity, access.session.user.id, clubId), "user_id,club_id,activity_id");
      saved.push(row);
    }

    return noStoreJson({
      ok: true,
      source: "supabase",
      refreshed,
      synced: saved.length,
      activities: saved.map(toPublicActivity),
    });
  } catch (error) {
    if (error instanceof StravaApiError) return stravaProviderError(error);
    return apiSupabaseError(error, { clubId });
  }
}

function stravaProviderError(error: StravaApiError) {
  if (error.status === 401 || error.status === 403) {
    return noStoreJson(
      { ok: false, source: "strava", status: "needs_reconnect", error: "Reconnect Strava before syncing activities." },
      { status: 409 },
    );
  }

  if (error.status === 429) {
    return noStoreJson(
      { ok: false, source: "strava", status: "rate_limited", error: "Strava rate limit reached. Try syncing again later." },
      { status: 429 },
    );
  }

  return noStoreJson(
    { ok: false, source: "strava", status: "temporarily_unavailable", error: "Strava is temporarily unavailable. Try syncing again later." },
    { status: 502 },
  );
}

function toActivityInsert(activity: StravaActivity, userId: string, clubId: string): TableInsert<"strava_activities"> {
  return {
    user_id: userId,
    club_id: clubId,
    activity_id: String(activity.id),
    name: requiredActivityText(activity.name, "Untitled activity"),
    sport_type: requiredActivityText(activity.sport_type ?? activity.type, "Workout"),
    start_date: activity.start_date,
    distance_meters: finiteNumber(activity.distance),
    moving_time_seconds: finiteInteger(activity.moving_time),
    elapsed_time_seconds: finiteInteger(activity.elapsed_time),
    elevation_gain_meters: finiteNumber(activity.total_elevation_gain),
    average_heartrate: finiteNumber(activity.average_heartrate),
    suffer_score: finiteNumber(activity.suffer_score),
    raw: activity as Json,
    synced_at: new Date().toISOString(),
  };
}

function toPublicActivity(row: TableRow<"strava_activities">) {
  return {
    id: row.id,
    activityId: row.activity_id,
    name: row.name,
    sportType: row.sport_type,
    startDate: row.start_date,
    distanceMeters: row.distance_meters,
    movingTimeSeconds: row.moving_time_seconds,
    elapsedTimeSeconds: row.elapsed_time_seconds,
    elevationGainMeters: row.elevation_gain_meters,
    averageHeartrate: row.average_heartrate,
    sufferScore: row.suffer_score,
    syncedAt: row.synced_at,
  };
}

function requiredActivityText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 240) : fallback;
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function finiteInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function hasRequiredScopes(scopes: string[]) {
  return STRAVA_SCOPES.every((scope) => scopes.includes(scope));
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
