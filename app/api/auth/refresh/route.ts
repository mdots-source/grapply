import { NextResponse } from "next/server";
import { clearActiveClubCookie, clearAuthCookies, setActiveClubCookie, setAuthCookies } from "@/lib/auth-cookies";
import { getCurrentSessionWithRefresh } from "@/lib/auth-session";
import { getRequestUrl } from "@/lib/request-origin";
import { normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo, splitOrganizationWorkspacePath } from "@/lib/workspace-intent";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = normalizeRefreshReturnTo(url.searchParams.get("returnTo"));
  const { session, refreshedSession } = await getCurrentSessionWithRefresh();

  if (!session) {
    const loginUrl = getRequestUrl("/login", request);
    loginUrl.searchParams.set("returnTo", returnTo);
    loginUrl.searchParams.set("error", "Session expired. Sign in again.");
    const response = noStoreRedirect(loginUrl, 303);
    clearAuthCookies(response);
    return response;
  }

  const destination = getSessionDestination(returnTo, session.activeClub?.slug);
  const response = noStoreRedirect(getRequestUrl(destination, request), 303);
  if (refreshedSession) setAuthCookies(response, refreshedSession);
  if (session.activeClub?.slug) setActiveClubCookie(response, session.activeClub.slug);
  else clearActiveClubCookie(response);
  return response;
}

function getSessionDestination(returnTo: string, activeClubSlug?: string | null) {
  const requestedWorkspace = splitOrganizationWorkspacePath(new URL(returnTo, "https://grapply.local").pathname);
  if (requestedWorkspace) return returnTo;
  return activeClubSlug ? scopeWorkspaceReturnTo(returnTo, activeClubSlug) : `/clubs?returnTo=${encodeURIComponent(returnTo)}`;
}

function normalizeRefreshReturnTo(rawReturnTo: string | null) {
  if (!rawReturnTo?.startsWith("/")) return "/schedule";

  try {
    const destination = new URL(rawReturnTo, "https://grapply.local");
    const requestedWorkspace = splitOrganizationWorkspacePath(destination.pathname);
    if (requestedWorkspace) {
      const normalizedWorkspacePath = normalizeWorkspaceReturnTo(`${requestedWorkspace.workspacePath}${destination.search}`);
      return scopeWorkspaceReturnTo(normalizedWorkspacePath, requestedWorkspace.organizationId);
    }

    return normalizeWorkspaceReturnTo(rawReturnTo);
  } catch {
    return "/schedule";
  }
}

function noStoreRedirect(url: URL, status?: number) {
  const response = NextResponse.redirect(url, status);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
