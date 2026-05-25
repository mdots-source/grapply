import { NextResponse } from "next/server";
import { getBackendClubId } from "@/lib/backend";
import { insertRow, isSupabaseConfigured, selectRows } from "@/lib/supabase/server";

function optionalUuid(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(searchParams.get("club"));
      if (!clubId) return NextResponse.json({ source: "supabase", checkIns: [] });

      const classId = searchParams.get("classId");
      const memberId = searchParams.get("memberId");
      const filters = [`club_id=eq.${clubId}`];
      if (classId) filters.push(`class_id=eq.${classId}`);
      if (memberId) filters.push(`member_id=eq.${memberId}`);

      const rows = await selectRows("class_checkins", `select=*&${filters.join("&")}&order=checked_in_at.desc`);
      return NextResponse.json({ source: "supabase", checkIns: rows });
    } catch (error) {
      return NextResponse.json({ source: "mock", checkIns: [], supabaseError: String(error) });
    }
  }

  return NextResponse.json({ source: "mock", checkIns: [] });
}

export async function POST(request: Request) {
  const payload = await request.json();

  if (!payload?.classId || !payload?.memberId) {
    return NextResponse.json({ ok: false, error: "Missing classId or memberId." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(payload.clubSlug);
      if (!clubId) return NextResponse.json({ ok: false, error: "Club not found." }, { status: 404 });

      const row = await insertRow("class_checkins", {
        club_id: clubId,
        class_id: payload.classId,
        member_id: payload.memberId,
        checked_in_by: optionalUuid(payload.checkedInBy),
        source: payload.source ?? "manual",
        notes: payload.notes ?? null,
      });

      return NextResponse.json({ ok: true, source: "supabase", checkIn: row });
    } catch (error) {
      return NextResponse.json({ ok: false, source: "supabase", error: String(error) }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", checkIn: payload });
}
