import { NextResponse } from "next/server";
import type { Competition } from "@/data/competitions";
import { requireApiRole } from "@/lib/api-access";
import { getBackendClubId, getRequestedClubSlug } from "@/lib/backend";
import { getMockCompetitionsForClub } from "@/lib/mock-club-content";
import { isSupabaseConfigured, selectRows, upsertRow } from "@/lib/supabase/server";
import { toCompetition, toCompetitionInsert } from "@/lib/supabase/mappers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clubSlug = await getRequestedClubSlug(searchParams.get("club"));

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(clubSlug);
      if (!clubId) return NextResponse.json({ source: "supabase", competitions: [] });
      const rows = await selectRows("competitions", `select=*&club_id=eq.${clubId}&order=prep.desc`);
      return NextResponse.json({ source: "supabase", competitions: rows.map(toCompetition) });
    } catch (error) {
      return NextResponse.json({ source: "mock", competitions: getMockCompetitionsForClub(clubSlug), supabaseError: String(error) });
    }
  }

  return NextResponse.json({ source: "mock", competitions: getMockCompetitionsForClub(clubSlug) });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Competition & { clubSlug?: string };
  const access = await requireApiRole(["owner", "admin", "coach"], payload.clubSlug);
  if (access.error) return access.error;

  if (!payload?.id || !payload?.name) {
    return NextResponse.json({ ok: false, error: "Missing competition id or name." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(payload.clubSlug);
      if (!clubId) return NextResponse.json({ ok: false, error: "Club not found." }, { status: 404 });
      const row = await upsertRow("competitions", toCompetitionInsert(payload, clubId), "id");
      return NextResponse.json({ ok: true, source: "supabase", competition: toCompetition(row) });
    } catch (error) {
      return NextResponse.json({ ok: true, source: "mock", competition: payload, supabaseError: String(error) });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", competition: payload });
}
