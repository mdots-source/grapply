import { NextResponse } from "next/server";
import { platformUsers } from "@/data/platform";
import { requireApiRole } from "@/lib/api-access";
import { isSupabaseConfigured, selectRows, upsertRow } from "@/lib/supabase/server";
import { toPlatformUser } from "@/lib/supabase/mappers";

export async function GET() {
  if (isSupabaseConfigured()) {
    try {
      const [users, connections] = await Promise.all([
        selectRows("app_users", "select=*&order=name.asc"),
        selectRows("strava_connections", "select=*"),
      ]);

      return NextResponse.json({
        source: "supabase",
        users: users.map((row) => {
          const connection = connections.find((item) => item.user_id === row.id);
          return {
            ...toPlatformUser(row),
            stravaStatus: connection ? "connected" : "not_connected",
            stravaAthleteId: connection?.athlete_id,
          };
        }),
      });
    } catch (error) {
      return NextResponse.json({ source: "mock", users: platformUsers, supabaseError: String(error) });
    }
  }

  return NextResponse.json({ source: "mock", users: platformUsers });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const access = await requireApiRole(["owner", "admin"], payload.clubSlug);
  if (access.error) return access.error;

  if (!payload?.name || !payload?.email) {
    return NextResponse.json({ ok: false, error: "Missing user name or email." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const user = await upsertRow(
        "app_users",
        {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          avatar_url: payload.avatar ?? payload.avatar_url ?? null,
        },
        "email",
      );
      return NextResponse.json({ ok: true, source: "supabase", user: toPlatformUser(user) });
    } catch (error) {
      return NextResponse.json({ ok: false, source: "supabase", error: String(error) }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", user: payload });
}
