import { NextResponse } from "next/server";
import { setActiveClubCookie, setMockAuthCookie } from "@/lib/auth-cookies";
import { getCurrentSession } from "@/lib/auth-session";
import { getRequestUrl } from "@/lib/request-origin";
import { getRoleSafeWorkspaceReturnTo, normalizeWorkspaceReturnTo } from "@/lib/workspace-intent";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const club = url.searchParams.get("club") ?? "grapply-bjj";
  const session = await getCurrentSession();
  const role = session?.memberships.find((membership) => membership.club.slug === club)?.role;
  const requestedDestination = normalizeWorkspaceReturnTo(url.searchParams.get("returnTo"));
  const destination = getRoleSafeWorkspaceReturnTo(requestedDestination, role);
  const response = NextResponse.redirect(getRequestUrl(destination, request));
  if (!session) setMockAuthCookie(response, "usr-sofia");
  setActiveClubCookie(response, club);
  return response;
}
