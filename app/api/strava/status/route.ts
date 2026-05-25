import { NextResponse } from "next/server";
import { platformUsers } from "@/data/platform";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? "sofia@grapply.app";
  const mockUser = platformUsers.find((user) => user.email === email) ?? platformUsers[0];

  if (isSupabaseConfigured()) {
    try {
      const users = await selectRows("app_users", `select=*&email=eq.${encodeURIComponent(email)}&limit=1`);
      const user = users[0];
      if (!user) {
        return NextResponse.json({ source: "supabase", status: "not_connected", athleteId: null });
      }

      const connections = await selectRows("strava_connections", `select=*&user_id=eq.${user.id}&limit=1`);
      const connection = connections[0];

      return NextResponse.json({
        source: "supabase",
        status: connection ? "connected" : "not_connected",
        athleteId: connection?.athlete_id ?? null,
        scopes: connection?.scopes ?? [],
        expiresAt: connection?.expires_at ?? null,
      });
    } catch (error) {
      return NextResponse.json({
        source: "mock",
        status: mockUser.stravaStatus,
        athleteId: mockUser.stravaAthleteId ?? null,
        supabaseError: String(error),
      });
    }
  }

  return NextResponse.json({
    source: "mock",
    status: mockUser.stravaStatus,
    athleteId: mockUser.stravaAthleteId ?? null,
  });
}
