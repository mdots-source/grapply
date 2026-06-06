import { platformUsers } from "@/data/platform";
import { apiSupabaseError, requireApiAccess } from "@/lib/api-access";
import { noStoreJson } from "@/lib/api-json";
import { getBackendClubId } from "@/lib/backend";
import { isStravaConfigured, refreshStravaToken, StravaApiError, STRAVA_SCOPES } from "@/lib/strava";
import { isSupabaseConfigured, selectRows, updateRows } from "@/lib/supabase/server";

const STRAVA_REFRESH_WINDOW_SECONDS = 60 * 10;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedClubSlug = searchParams.get("club");
  const access = await requireApiAccess(requestedClubSlug);
  if (access.error) return access.error;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      if (!isUuid(access.session.user.id)) {
        return mockStravaStatus(access.session.user.email);
      }

      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) {
        return noStoreJson({ source: "supabase", status: "not_connected", athleteId: null });
      }

      const connections = await selectRows("strava_connections", `select=*&user_id=eq.${access.session.user.id}&club_id=eq.${clubId}&limit=1`);
      let connection = connections[0];

      if (!connection) {
        return noStoreJson({ source: "supabase", status: "not_connected", athleteId: null });
      }

      if (!isStravaConfigured()) {
        return noStoreJson({
          source: "supabase",
          status: "not_configured",
          athleteId: connection.athlete_id,
          scopes: connection.scopes ?? [],
          expiresAt: connection.expires_at,
          refreshed: false,
          error: "Strava is connected in the database, but OAuth credentials are missing on this deployment.",
        });
      }

      if (!hasRequiredScopes(connection.scopes ?? [])) {
        return noStoreJson({
          source: "supabase",
          status: "needs_reconnect",
          athleteId: connection.athlete_id,
          scopes: connection.scopes ?? [],
          expiresAt: connection.expires_at,
          refreshed: false,
        });
      }

      let refreshed = false;
      const currentSeconds = Math.floor(Date.now() / 1000);
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
        connection = updated ?? connection;
        refreshed = Boolean(updated);
      }

      return noStoreJson({
        source: "supabase",
        status: "connected",
        athleteId: connection.athlete_id,
        scopes: connection.scopes ?? [],
        expiresAt: connection.expires_at,
        refreshed,
      });
    } catch (error) {
      if (error instanceof StravaApiError) return stravaProviderError(error);
      return apiSupabaseError(error, { clubId });
    }
  }

  return mockStravaStatus(access.session.user.email);
}

function mockStravaStatus(email = platformUsers[0]?.email) {
  const mockUser = platformUsers.find((user) => user.email === email) ?? platformUsers[0];
  return noStoreJson({
    source: "mock",
    status: mockUser.stravaStatus,
    athleteId: mockUser.stravaAthleteId ?? null,
  });
}

function stravaProviderError(error: StravaApiError) {
  if (error.status === 401 || error.status === 403) {
    return noStoreJson({
      source: "strava",
      status: "needs_reconnect",
      athleteId: null,
      refreshed: false,
      error: "Reconnect Strava before syncing activities.",
    }, { status: 409 });
  }

  if (error.status === 429) {
    return noStoreJson({
      source: "strava",
      status: "rate_limited",
      athleteId: null,
      refreshed: false,
      error: "Strava rate limit reached. Try again later.",
    }, { status: 429 });
  }

  return noStoreJson({
    source: "strava",
    status: "temporarily_unavailable",
    athleteId: null,
    refreshed: false,
    error: "Strava is temporarily unavailable.",
  }, { status: 502 });
}

function hasRequiredScopes(scopes: string[]) {
  return STRAVA_SCOPES.every((scope) => scopes.includes(scope));
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
