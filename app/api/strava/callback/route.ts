import { NextResponse } from "next/server";
import { exchangeStravaCode } from "@/lib/strava";
import { isSupabaseConfigured, selectRows, upsertRow } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state") ?? "/clubs";
  const redirectBase = new URL(state.startsWith("/") ? state : "/clubs", request.url);

  if (error) {
    redirectBase.searchParams.set("strava", "denied");
    return NextResponse.redirect(redirectBase);
  }

  if (!code) {
    redirectBase.searchParams.set("strava", "missing-code");
    return NextResponse.redirect(redirectBase);
  }

  try {
    const token = await exchangeStravaCode(code);

    if (isSupabaseConfigured()) {
      const users = await selectRows("app_users", "select=*&email=eq.sofia@grapply.app");
      const user = users[0];
      if (user) {
        await upsertRow(
          "strava_connections",
          {
            user_id: user.id,
            athlete_id: String(token.athlete.id),
            access_token: token.access_token,
            refresh_token: token.refresh_token,
            expires_at: token.expires_at,
            scopes: url.searchParams.get("scope")?.split(",") ?? [],
          },
          "user_id",
        );
      }
    }

    redirectBase.searchParams.set("strava", "connected");
  } catch {
    redirectBase.searchParams.set("strava", "error");
  }

  return NextResponse.redirect(redirectBase);
}
