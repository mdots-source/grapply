import { NextResponse } from "next/server";
import { setActiveClubCookie, setAuthCookies } from "@/lib/auth-cookies";
import { getCurrentSessionWithRefresh } from "@/lib/auth-session";
import { getRequestUrl } from "@/lib/request-origin";
import { getRoleSafeWorkspaceReturnTo, normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo } from "@/lib/workspace-intent";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const club = url.searchParams.get("club");
  const { session, refreshedSession } = await getCurrentSessionWithRefresh();
  const requestedDestination = normalizeWorkspaceReturnTo(url.searchParams.get("returnTo"));

  if (!session) {
    const loginUrl = getRequestUrl("/api/auth/refresh", request);
    loginUrl.searchParams.set("returnTo", requestedDestination);
    return noStoreRedirect(loginUrl, 303);
  }

  const membership = club ? session.memberships.find((item) => item.club.slug === club) : null;
  if (!membership) {
    const clubsUrl = getRequestUrl("/clubs", request);
    clubsUrl.searchParams.set("access", "denied");
    clubsUrl.searchParams.set("returnTo", requestedDestination);
    return noStoreRedirect(clubsUrl, 303);
  }

  const role = membership.role;
  const clubSlug = membership.club.slug;
  const destination = scopeWorkspaceReturnTo(getRoleSafeWorkspaceReturnTo(requestedDestination, role), clubSlug);
  const response = noStoreRedirect(getRequestUrl(destination, request));
  if (refreshedSession) setAuthCookies(response, refreshedSession);
  setActiveClubCookie(response, clubSlug);
  return response;
}

function noStoreRedirect(url: URL, status?: number) {
  const response = NextResponse.redirect(url, status);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
