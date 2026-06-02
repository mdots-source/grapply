import { NextResponse } from "next/server";
import { trainingPosts, type TrainingPost } from "@/data/training-feed";
import { getBackendClubId } from "@/lib/backend";
import { isSupabaseConfigured, selectRows, upsertRow } from "@/lib/supabase/server";
import { toTrainingPost, toTrainingPostInsert } from "@/lib/supabase/mappers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(searchParams.get("club"));
      if (!clubId) return NextResponse.json({ source: "supabase", posts: [] });
      const rows = await selectRows("training_posts", `select=*&club_id=eq.${clubId}&order=pinned.desc,heat.desc`);
      return NextResponse.json({ source: "supabase", posts: rows.map(toTrainingPost) });
    } catch (error) {
      return NextResponse.json({ source: "mock", posts: trainingPosts, supabaseError: String(error) });
    }
  }

  return NextResponse.json({ source: "mock", posts: trainingPosts });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as TrainingPost & { clubSlug?: string };

  if (!payload?.id || !payload?.title) {
    return NextResponse.json({ ok: false, error: "Missing post id or title." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(payload.clubSlug);
      if (!clubId) return NextResponse.json({ ok: false, error: "Club not found." }, { status: 404 });
      const row = await upsertRow("training_posts", toTrainingPostInsert(payload, clubId), "id");
      return NextResponse.json({ ok: true, source: "supabase", post: toTrainingPost(row) });
    } catch (error) {
      return NextResponse.json({ ok: true, source: "mock", post: payload, supabaseError: String(error) });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", post: payload });
}
