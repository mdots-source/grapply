import { NextResponse } from "next/server";
import { trainingCamps, type TrainingCamp } from "@/data/training-camps";
import { getBackendClubId } from "@/lib/backend";
import { isSupabaseConfigured, selectRows, upsertRow } from "@/lib/supabase/server";
import { toTrainingCamp, toTrainingCampInsert } from "@/lib/supabase/mappers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(searchParams.get("club"));
      if (!clubId) return NextResponse.json({ source: "supabase", camps: [] });
      const rows = await selectRows("training_camps", `select=*&club_id=eq.${clubId}&order=prep.desc`);
      return NextResponse.json({ source: "supabase", camps: rows.map(toTrainingCamp) });
    } catch (error) {
      return NextResponse.json({ source: "mock", camps: trainingCamps, supabaseError: String(error) });
    }
  }

  return NextResponse.json({ source: "mock", camps: trainingCamps });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as TrainingCamp & { clubSlug?: string };

  if (!payload?.id || !payload?.name) {
    return NextResponse.json({ ok: false, error: "Missing camp id or name." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(payload.clubSlug);
      if (!clubId) return NextResponse.json({ ok: false, error: "Club not found." }, { status: 404 });
      const row = await upsertRow("training_camps", toTrainingCampInsert(payload, clubId), "id");
      return NextResponse.json({ ok: true, source: "supabase", camp: toTrainingCamp(row) });
    } catch (error) {
      return NextResponse.json({ ok: false, source: "supabase", error: String(error) }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", camp: payload });
}
