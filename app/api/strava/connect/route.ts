import { NextResponse } from "next/server";
import { setActiveClubCookie, setAuthCookies, setStravaStateCookie } from "@/lib/auth-cookies";
import { getCurrentSessionWithRefresh } from "@/lib/auth-session";
import { getRequestUrl } from "@/lib/request-origin";
import { buildStravaAuthorizationUrl } from "@/lib/strava";
import {
  normalizeWorkspaceReturnTo,
  scopeWorkspaceReturnTo,
  splitOrganizationWorkspacePath,
} from "@/lib/workspace-intent";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawReturnTo = searchParams.get("returnTo");
  const workspaceReturnTo = normalizeWorkspaceReturnTo(rawReturnTo);
  const { session, refreshedSession } = await getCurrentSessionWithRefresh();
  const redirectWithAuth = (url: URL | string, status?: number) => {
    const response = noStoreRedirect(url, status);
    if (refreshedSession) setAuthCookies(response, refreshedSession);
    return response;
  };

  if (!session) {
    const loginUrl = getRequestUrl("/login", request);
    loginUrl.searchParams.set("returnTo", workspaceReturnTo);
    loginUrl.searchParams.set("strava", "login-required");
    return redirectWithAuth(loginUrl, 303);
  }

  const requestedClubSlug = getRequestedClubSlug(rawReturnTo);
  const membership = requestedClubSlug
    ? session.memberships.find((item) => item.club.slug === requestedClubSlug)
    : session.activeClub
      ? session.memberships.find((item) => item.club.slug === session.activeClub?.slug)
      : session.memberships[0];

  if (!membership) {
    const clubsUrl = getRequestUrl("/clubs", request);
    clubsUrl.searchParams.set("returnTo", workspaceReturnTo);
    clubsUrl.searchParams.set("strava", "club-required");
    return redirectWithAuth(clubsUrl, 303);
  }

  const clubSlug = membership.club.slug;
  const nonce = crypto.randomUUID();
  const state = `/clubs?club=${encodeURIComponent(clubSlug)}&returnTo=${encodeURIComponent(workspaceReturnTo)}&nonce=${encodeURIComponent(nonce)}`;
  const url = buildStravaAuthorizationUrl({
    state,
    redirectUri: getRequestUrl("/api/strava/callback", request).toString(),
  });

  if (!url) {
    const redirectUrl = getRequestUrl(scopeWorkspaceReturnTo(workspaceReturnTo, clubSlug), request);
    redirectUrl.searchParams.set("strava", "missing-config");
    const response = redirectWithAuth(redirectUrl);
    setActiveClubCookie(response, clubSlug);
    return response;
  }

  const response = redirectWithAuth(url);
  setActiveClubCookie(response, clubSlug);
  setStravaStateCookie(response, nonce);
  return response;
}

function noStoreRedirect(url: URL | string, status?: number) {
  const response = NextResponse.redirect(url, status);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function getRequestedClubSlug(returnTo: string | null) {
  if (!returnTo?.startsWith("/")) return null;

  try {
    const destination = new URL(returnTo, "https://grapply.local");
    return splitOrganizationWorkspacePath(destination.pathname)?.organizationId ?? null;
  } catch {
    return null;
  }
}
