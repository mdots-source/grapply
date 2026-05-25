import { NextResponse } from "next/server";
import { getBackendClubId } from "@/lib/backend";
import { insertRow, isSupabaseConfigured, selectRows, upsertRow } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(searchParams.get("club"));
      if (!clubId) return NextResponse.json({ source: "supabase", goals: [] });

      const memberId = searchParams.get("memberId");
      const filters = [`club_id=eq.${clubId}`];
      if (memberId) filters.push(`member_id=eq.${memberId}`);

      const rows = await selectRows("member_goals", `select=*&${filters.join("&")}&order=created_at.desc`);
      return NextResponse.json({ source: "supabase", goals: rows });
    } catch (error) {
      return NextResponse.json({ source: "mock", goals: [], supabaseError: String(error) });
    }
  }

  return NextResponse.json({ source: "mock", goals: [] });
}

export async function POST(request: Request) {
  const payload = await request.json();

  if (!payload?.memberId || !payload?.title) {
    return NextResponse.json({ ok: false, error: "Missing memberId or goal title." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(payload.clubSlug);
      if (!clubId) return NextResponse.json({ ok: false, error: "Club not found." }, { status: 404 });

      const row = await insertRow("member_goals", {
        club_id: clubId,
        member_id: payload.memberId,
        title: payload.title,
        status: payload.status ?? "active",
        target_date: payload.targetDate ?? null,
      });

      return NextResponse.json({ ok: true, source: "supabase", goal: row });
    } catch (error) {
      return NextResponse.json({ ok: false, source: "supabase", error: String(error) }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", goal: payload });
}

export async function PATCH(request: Request) {
  const payload = await request.json();

  if (!payload?.id || !payload?.memberId || !payload?.title) {
    return NextResponse.json({ ok: false, error: "Missing goal id, memberId, or title." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(payload.clubSlug);
      if (!clubId) return NextResponse.json({ ok: false, error: "Club not found." }, { status: 404 });

      const row = await upsertRow(
        "member_goals",
        {
          id: payload.id,
          club_id: clubId,
          member_id: payload.memberId,
          title: payload.title,
          status: payload.status ?? "active",
          target_date: payload.targetDate ?? null,
        },
        "id",
      );

      return NextResponse.json({ ok: true, source: "supabase", goal: row });
    } catch (error) {
      return NextResponse.json({ ok: false, source: "supabase", error: String(error) }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", goal: payload });
}
