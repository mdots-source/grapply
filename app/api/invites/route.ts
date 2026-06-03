import { NextResponse } from "next/server";
import { getBackendClubId } from "@/lib/backend";
import { insertRow, isSupabaseConfigured, selectRows, upsertRow } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(searchParams.get("club"));
      if (!clubId) return NextResponse.json({ source: "supabase", invites: [] });
      const rows = await selectRows("club_invites", `select=*&club_id=eq.${clubId}&order=created_at.desc`);
      return NextResponse.json({ source: "supabase", invites: rows });
    } catch (error) {
      return NextResponse.json({ source: "mock", invites: [], supabaseError: String(error) });
    }
  }

  return NextResponse.json({ source: "mock", invites: [] });
}

export async function POST(request: Request) {
  const payload = await request.json();

  if (!payload?.email) {
    return NextResponse.json({ ok: false, error: "Missing invite email." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(payload.clubSlug);
      if (!clubId) return NextResponse.json({ ok: false, error: "Club not found." }, { status: 404 });

      const row = await insertRow("club_invites", {
        club_id: clubId,
        email: payload.email,
        role: payload.role ?? "member",
        invited_by: payload.invitedBy ?? null,
        status: "pending",
      });

      return NextResponse.json({ ok: true, source: "supabase", invite: row });
    } catch (error) {
      return NextResponse.json({ ok: true, source: "mock", invite: payload, supabaseError: String(error) });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", invite: payload });
}

export async function PATCH(request: Request) {
  const payload = await request.json();

  if (!payload?.id || !payload?.status) {
    return NextResponse.json({ ok: false, error: "Missing invite id or status." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(payload.clubSlug);
      if (!clubId) return NextResponse.json({ ok: false, error: "Club not found." }, { status: 404 });

      const row = await upsertRow(
        "club_invites",
        {
          id: payload.id,
          club_id: clubId,
          email: payload.email,
          role: payload.role ?? "member",
          invited_by: payload.invitedBy ?? null,
          status: payload.status,
        },
        "id",
      );

      return NextResponse.json({ ok: true, source: "supabase", invite: row });
    } catch (error) {
      return NextResponse.json({ ok: true, source: "mock", invite: payload, supabaseError: String(error) });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", invite: payload });
}
