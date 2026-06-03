import { NextResponse } from "next/server";
import { setActiveClubCookie } from "@/lib/auth-cookies";
import { normalizeWorkspaceReturnTo } from "@/lib/workspace-intent";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const club = url.searchParams.get("club") ?? "grapply-bjj";
  const destination = normalizeWorkspaceReturnTo(url.searchParams.get("returnTo"));
  const response = NextResponse.redirect(new URL(destination, request.url));
  setActiveClubCookie(response, club);
  return response;
}
