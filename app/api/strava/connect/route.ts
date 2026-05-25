import { NextResponse } from "next/server";
import { buildStravaAuthorizationUrl } from "@/lib/strava";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get("returnTo") ?? "/clubs";
  const url = buildStravaAuthorizationUrl({ state: returnTo });

  if (!url) {
    return NextResponse.redirect(new URL(`${returnTo}?strava=missing-config`, request.url));
  }

  return NextResponse.redirect(url);
}
