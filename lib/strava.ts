const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities";

export const STRAVA_SCOPES = ["read", "profile:read_all", "activity:read_all"] as const;

export class StravaApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "StravaApiError";
  }
}

export function getStravaConfig() {
  return {
    clientId: process.env.STRAVA_CLIENT_ID,
    clientSecret: process.env.STRAVA_CLIENT_SECRET,
    redirectUri: getDefaultStravaRedirectUri(),
  };
}

export function isStravaConfigured() {
  const { clientId, clientSecret, redirectUri } = getStravaConfig();
  return Boolean(clientId && clientSecret && redirectUri);
}

export function buildStravaAuthorizationUrl({ state, redirectUri: redirectUriOverride }: { state: string; redirectUri?: string }) {
  const { clientId, clientSecret, redirectUri } = getStravaConfig();
  const callbackUrl = redirectUriOverride ?? redirectUri;
  if (!clientId || !clientSecret || !callbackUrl) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    approval_prompt: "auto",
    scope: STRAVA_SCOPES.join(","),
    state,
  });

  return `${STRAVA_AUTHORIZE_URL}?${params.toString()}`;
}

function getDefaultStravaRedirectUri() {
  if (process.env.STRAVA_REDIRECT_URI) return process.env.STRAVA_REDIRECT_URI;
  if (process.env.NEXT_PUBLIC_APP_URL) return `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/strava/callback`;
  return "http://localhost:3000/api/strava/callback";
}

export async function exchangeStravaCode(code: string) {
  const { clientId, clientSecret } = getStravaConfig();
  if (!clientId || !clientSecret) {
    throw new Error("Missing Strava OAuth credentials.");
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new StravaApiError("Strava token exchange failed.", response.status);
  }

  return response.json() as Promise<{
    token_type: "Bearer";
    expires_at: number;
    expires_in: number;
    refresh_token: string;
    access_token: string;
    athlete: {
      id: number;
      firstname?: string;
      lastname?: string;
      profile?: string;
    };
  }>;
}

export async function refreshStravaToken(refreshToken: string) {
  const { clientId, clientSecret } = getStravaConfig();
  if (!clientId || !clientSecret) {
    throw new Error("Missing Strava OAuth credentials.");
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new StravaApiError("Strava token refresh failed.", response.status);
  }

  return response.json() as Promise<{
    token_type: "Bearer";
    expires_at: number;
    expires_in: number;
    refresh_token: string;
    access_token: string;
  }>;
}

export type StravaActivity = {
  id: number | string;
  name: string;
  type?: string;
  sport_type?: string;
  start_date: string;
  distance?: number;
  moving_time?: number;
  elapsed_time?: number;
  total_elevation_gain?: number;
  average_heartrate?: number;
  suffer_score?: number;
};

export async function fetchStravaActivities(accessToken: string, perPage = 30) {
  const params = new URLSearchParams({
    per_page: String(Math.max(1, Math.min(perPage, 100))),
  });
  const response = await fetch(`${STRAVA_ACTIVITIES_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new StravaApiError("Strava activities sync failed.", response.status);
  }

  return response.json() as Promise<StravaActivity[]>;
}
