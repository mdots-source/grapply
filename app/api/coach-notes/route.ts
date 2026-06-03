import { NextResponse } from "next/server";
import { getBackendClubId } from "@/lib/backend";
import { insertRow, isSupabaseConfigured, selectRows } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(searchParams.get("club"));
      if (!clubId) return NextResponse.json({ source: "supabase", notes: [] });

      const memberId = searchParams.get("memberId");
      const filters = [`club_id=eq.${clubId}`];
      if (memberId) filters.push(`member_id=eq.${memberId}`);

      const rows = await selectRows("coach_notes", `select=*&${filters.join("&")}&order=created_at.desc`);
      return NextResponse.json({ source: "supabase", notes: rows });
    } catch (error) {
      return NextResponse.json({ source: "mock", notes: [], supabaseError: String(error) });
    }
  }

  return NextResponse.json({ source: "mock", notes: [] });
}

export async function POST(request: Request) {
  const payload = await request.json();

  if (!payload?.memberId || !payload?.body || !payload?.coachName) {
    return NextResponse.json({ ok: false, error: "Missing memberId, coachName, or body." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(payload.clubSlug);
      if (!clubId) return NextResponse.json({ ok: false, error: "Club not found." }, { status: 404 });

      const row = await insertRow("coach_notes", {
        club_id: clubId,
        member_id: payload.memberId,
        coach_user_id: payload.coachUserId ?? null,
        coach_name: payload.coachName,
        body: payload.body,
        visibility: payload.visibility ?? "staff",
      });

      return NextResponse.json({ ok: true, source: "supabase", note: row });
    } catch (error) {
      return NextResponse.json({ ok: true, source: "mock", note: payload, supabaseError: String(error) });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", note: payload });
}
