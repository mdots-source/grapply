import { NextResponse } from "next/server";
import { buildStravaAuthorizationUrl } from "@/lib/strava";
import { normalizeWorkspaceReturnTo } from "@/lib/workspace-intent";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const returnTo = `/clubs?returnTo=${encodeURIComponent(normalizeWorkspaceReturnTo(searchParams.get("returnTo")))}`;
  const url = buildStravaAuthorizationUrl({ state: returnTo });

  if (!url) {
    const redirectUrl = new URL(returnTo, request.url);
    redirectUrl.searchParams.set("strava", "missing-config");
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(url);
}
