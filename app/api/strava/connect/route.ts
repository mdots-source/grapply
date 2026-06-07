import { NextResponse } from "next/server";
import { setActiveClubCookie, setStravaStateCookie } from "@/lib/auth-cookies";
import { getCurrentSession } from "@/lib/auth-session";
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
  const session = await getCurrentSession();

  if (!session) {
    const loginUrl = getRequestUrl("/login", request);
    loginUrl.searchParams.set("returnTo", workspaceReturnTo);
    loginUrl.searchParams.set("strava", "login-required");
    return noStoreRedirect(loginUrl, 303);
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
    return noStoreRedirect(clubsUrl, 303);
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
    const response = noStoreRedirect(redirectUrl);
    setActiveClubCookie(response, clubSlug);
    return response;
  }

  const response = noStoreRedirect(url);
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
