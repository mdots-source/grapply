import type { NextResponse } from "next/server";

export const authCookieNames = {
  accessToken: "grapply-access-token",
  refreshToken: "grapply-refresh-token",
  activeClub: "grapply-active-club",
} as const;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setAuthCookies(
  response: NextResponse,
  session: { access_token: string; refresh_token: string; expires_in: number },
) {
  response.cookies.set(authCookieNames.accessToken, session.access_token, {
    ...cookieOptions,
    maxAge: session.expires_in,
  });
  response.cookies.set(authCookieNames.refreshToken, session.refresh_token, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(authCookieNames.accessToken);
  response.cookies.delete(authCookieNames.refreshToken);
  response.cookies.delete(authCookieNames.activeClub);
}

export function setActiveClubCookie(response: NextResponse, slug: string) {
  response.cookies.set(authCookieNames.activeClub, slug, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 90,
  });
}
