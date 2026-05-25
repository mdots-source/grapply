import { NextResponse } from "next/server";
import { clubMemberships, roleDefinitions } from "@/data/platform";
import { insertRow, isSupabaseConfigured, selectRows } from "@/lib/supabase/server";

export async function GET() {
  if (isSupabaseConfigured()) {
    try {
      const [roles, memberships, classes] = await Promise.all([
        selectRows("role_definitions"),
        selectRows("club_memberships"),
        selectRows("club_classes"),
      ]);

      return NextResponse.json({ source: "supabase", roles, memberships, classes });
    } catch (error) {
      return NextResponse.json({ source: "mock", roles: roleDefinitions, memberships: clubMemberships, supabaseError: String(error) });
    }
  }

  return NextResponse.json({
    source: "mock",
    roles: roleDefinitions,
    memberships: clubMemberships,
  });
}

export async function POST(request: Request) {
  const payload = await request.json();

  if (isSupabaseConfigured() && payload?.club_id && payload?.user_id && payload?.role) {
    try {
      const membership = await insertRow("club_memberships", {
        club_id: payload.club_id,
        user_id: payload.user_id,
        role: payload.role,
        invited_by: payload.invited_by ?? null,
      });

      return NextResponse.json({ ok: true, source: "supabase", membership });
    } catch (error) {
      return NextResponse.json({ ok: false, source: "supabase", error: String(error) }, { status: 400 });
    }
  }

  return NextResponse.json({
    ok: true,
    source: "mock",
    message: "Mock role update accepted. Persist this through the production database adapter later.",
    payload,
  });
}
