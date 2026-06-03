import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-access";
import { getBackendClubId } from "@/lib/backend";
import { insertRow, isSupabaseConfigured, selectRows } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(searchParams.get("club"));
      if (!clubId) return NextResponse.json({ source: "supabase", promotions: [] });

      const memberId = searchParams.get("memberId");
      const filters = [`club_id=eq.${clubId}`];
      if (memberId) filters.push(`member_id=eq.${memberId}`);

      const rows = await selectRows("member_promotions", `select=*&${filters.join("&")}&order=awarded_at.desc`);
      return NextResponse.json({ source: "supabase", promotions: rows });
    } catch (error) {
      return NextResponse.json({ source: "mock", promotions: [], supabaseError: String(error) });
    }
  }

  return NextResponse.json({ source: "mock", promotions: [] });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const access = await requireApiRole(["owner", "admin", "coach"], payload.clubSlug);
  if (access.error) return access.error;

  if (!payload?.memberId || !payload?.detail || !payload?.awardedByName || !payload?.type) {
    return NextResponse.json({ ok: false, error: "Missing promotion memberId, type, awardedByName, or detail." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(payload.clubSlug);
      if (!clubId) return NextResponse.json({ ok: false, error: "Club not found." }, { status: 404 });

      const row = await insertRow("member_promotions", {
        club_id: clubId,
        member_id: payload.memberId,
        awarded_by: payload.awardedBy ?? null,
        awarded_by_name: payload.awardedByName,
        type: payload.type,
        belt: payload.belt ?? null,
        stripes: payload.stripes ?? null,
        detail: payload.detail,
      });

      return NextResponse.json({ ok: true, source: "supabase", promotion: row });
    } catch (error) {
      return NextResponse.json({ ok: true, source: "mock", promotion: payload, supabaseError: String(error) });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", promotion: payload });
}
