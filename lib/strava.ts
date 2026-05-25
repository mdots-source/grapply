const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export const STRAVA_SCOPES = ["read", "profile:read_all", "activity:read_all"] as const;

export function getStravaConfig() {
  return {
    clientId: process.env.STRAVA_CLIENT_ID,
    clientSecret: process.env.STRAVA_CLIENT_SECRET,
    redirectUri: process.env.STRAVA_REDIRECT_URI ?? "http://localhost:3002/api/strava/callback",
  };
}

export function buildStravaAuthorizationUrl({ state }: { state: string }) {
  const { clientId, redirectUri } = getStravaConfig();
  if (!clientId) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: STRAVA_SCOPES.join(","),
    state,
  });

  return `${STRAVA_AUTHORIZE_URL}?${params.toString()}`;
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
    throw new Error(`Strava token exchange failed with ${response.status}.`);
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
