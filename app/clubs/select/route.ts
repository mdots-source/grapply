import { NextResponse } from "next/server";
import { setActiveClubCookie } from "@/lib/auth-cookies";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const club = url.searchParams.get("club") ?? "grapply-bjj";
  const returnTo = url.searchParams.get("returnTo") ?? "/schedule";
  const destination = returnTo.startsWith("/") ? returnTo : "/schedule";
  const response = NextResponse.redirect(new URL(destination, request.url));
  setActiveClubCookie(response, club);
  return response;
}
