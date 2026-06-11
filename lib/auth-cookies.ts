import type { NextResponse } from "next/server";

export const authCookieNames = {
  accessToken: "grapply-access-token",
  refreshToken: "grapply-refresh-token",
  activeClub: "grapply-active-club",
  stravaState: "grapply-strava-state",
} as const;

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.VERCEL === "1" || process.env.COOKIE_SECURE === "true",
  path: "/",
};

export function setAuthCookies(
  response: NextResponse,
  session: { access_token: string; refresh_token: string; expires_in: number },
) {
  response.cookies.set(authCookieNames.accessToken, session.access_token, {
    ...authCookieOptions,
    maxAge: session.expires_in,
  });
  response.cookies.set(authCookieNames.refreshToken, session.refresh_token, {
    ...authCookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function setMockAuthCookie(response: NextResponse, userId: string) {
  response.cookies.set(authCookieNames.accessToken, `mock:${userId}`, {
    ...authCookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(authCookieNames.accessToken);
  response.cookies.delete(authCookieNames.refreshToken);
  response.cookies.delete(authCookieNames.activeClub);
}

export function clearActiveClubCookie(response: NextResponse) {
  response.cookies.delete(authCookieNames.activeClub);
}

export function setActiveClubCookie(response: NextResponse, slug: string) {
  response.cookies.set(authCookieNames.activeClub, slug, {
    ...authCookieOptions,
    maxAge: 60 * 60 * 24 * 90,
  });
}

export function setStravaStateCookie(response: NextResponse, nonce: string) {
  response.cookies.set(authCookieNames.stravaState, nonce, {
    ...authCookieOptions,
    maxAge: 60 * 10,
  });
}

export function clearStravaStateCookie(response: NextResponse) {
  response.cookies.delete(authCookieNames.stravaState);
}

export function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (rawName === name) return decodeURIComponent(rawValue.join("="));
  }

  return null;
}
