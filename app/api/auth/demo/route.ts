import { NextResponse } from "next/server";
import { setActiveClubCookie, setMockAuthCookie } from "@/lib/auth-cookies";
import { getRequestUrl } from "@/lib/request-origin";
import { normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo } from "@/lib/workspace-intent";

const demoUserId = "usr-sofia";
const demoClubSlug = "grapply-bjj";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = normalizeWorkspaceReturnTo(url.searchParams.get("returnTo"));
  const destination = scopeWorkspaceReturnTo(returnTo, demoClubSlug);
  const response = NextResponse.redirect(getRequestUrl(destination, request), 303);
  setMockAuthCookie(response, demoUserId);
  setActiveClubCookie(response, demoClubSlug);
  return response;
}
