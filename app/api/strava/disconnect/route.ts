import { apiSupabaseError, requireApiAccess, requireSupabasePersistence } from "@/lib/api-access";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getBackendClubId } from "@/lib/backend";
import { deleteRows, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  return disconnectStrava(request);
}

export async function DELETE(request: Request) {
  return disconnectStrava(request);
}

async function disconnectStrava(request: Request) {
  const url = new URL(request.url);
  const payload = request.method === "POST" ? await readJsonObject(request) : {};
  const forbidden = getForbiddenDisconnectField(payload);
  if (forbidden) return validationError(`${forbidden} is assigned by the server.`);

  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : url.searchParams.get("club");
  const access = await requireApiAccess(requestedClubSlug);
  if (access.error) return access.error;

  if (!isSupabaseConfigured()) {
    const persistenceError = requireSupabasePersistence("Strava connections");
    if (persistenceError) return persistenceError;

    return noStoreJson({ ok: true, source: "mock", status: "not_connected" });
  }

  let clubId: string | null = null;
  try {
    if (!isUuid(access.session.user.id)) {
      const persistenceError = requireSupabasePersistence("Strava connections");
      if (persistenceError) return persistenceError;

      return noStoreJson({ ok: true, source: "mock", status: "not_connected" });
    }

    clubId = await getBackendClubId(access.session.activeClub.slug);
    if (!clubId) {
      return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
    }

    const [removedConnections, removedActivities] = await Promise.all([
      deleteRows("strava_connections", `user_id=eq.${access.session.user.id}&club_id=eq.${clubId}`),
      deleteRows("strava_activities", `user_id=eq.${access.session.user.id}&club_id=eq.${clubId}`),
    ]);

    return noStoreJson({
      ok: true,
      source: "supabase",
      status: "not_connected",
      removedConnections: removedConnections.length,
      removedActivities: removedActivities.length,
    });
  } catch (error) {
    return apiSupabaseError(error, { clubId });
  }
}

function validationError(error: string) {
  return validationErrorJson(error);
}

function getForbiddenDisconnectField(payload: Record<string, unknown>) {
  const labels: Record<string, string> = {
    accessToken: "Strava access token",
    access_token: "Strava access token",
    activityId: "Strava activity id",
    activity_id: "Strava activity id",
    athleteId: "Strava athlete",
    athlete_id: "Strava athlete",
    clubId: "Strava club",
    club_id: "Strava club",
    expiresAt: "Strava token expiry",
    expires_at: "Strava token expiry",
    refreshToken: "Strava refresh token",
    refresh_token: "Strava refresh token",
    scopes: "Strava scopes",
    status: "Strava status",
    userId: "Strava user",
    user_id: "Strava user",
  };
  const field = Object.keys(labels).find((key) => payload[key] !== undefined);
  return field ? labels[field] : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
