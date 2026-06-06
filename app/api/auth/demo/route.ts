import { NextResponse } from "next/server";
import { setActiveClubCookie, setMockAuthCookie } from "@/lib/auth-cookies";
import { noStoreJson } from "@/lib/api-json";
import { isMockAuthFallbackAllowed } from "@/lib/auth-mode";
import { getRequestUrl } from "@/lib/request-origin";
import { normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo } from "@/lib/workspace-intent";

const demoUserId = "usr-sofia";
const demoClubSlug = "grapply-bjj";

export async function GET(request: Request) {
  if (!isMockAuthFallbackAllowed()) {
    return noStoreJson({ ok: false, error: "Demo login is disabled on this deployment." }, { status: 404 });
  }

  const url = new URL(request.url);
  const returnTo = normalizeWorkspaceReturnTo(url.searchParams.get("returnTo"));
  const destination = scopeWorkspaceReturnTo(returnTo, demoClubSlug);
  const response = noStoreRedirect(getRequestUrl(destination, request), 303);
  setMockAuthCookie(response, demoUserId);
  setActiveClubCookie(response, demoClubSlug);
  return response;
}

function noStoreRedirect(url: URL, status?: number) {
  const response = NextResponse.redirect(url, status);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
