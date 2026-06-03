import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-access";
import { getBackendClubId } from "@/lib/backend";
import { isSupabaseConfigured, selectRows, upsertRow } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(searchParams.get("club"));
      if (!clubId) return NextResponse.json({ source: "supabase", settings: {} });

      const rows = await selectRows("club_settings", `select=*&club_id=eq.${clubId}`);
      return NextResponse.json({
        source: "supabase",
        settings: Object.fromEntries(rows.map((row) => [row.key, row.value])),
      });
    } catch (error) {
      return NextResponse.json({ source: "mock", settings: {}, supabaseError: String(error) });
    }
  }

  return NextResponse.json({ source: "mock", settings: {} });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as { clubSlug?: string; key?: string; value?: Json };
  const access = await requireApiRole(["owner", "admin"], payload.clubSlug);
  if (access.error) return access.error;

  if (!payload.key) {
    return NextResponse.json({ ok: false, error: "Missing settings key." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(payload.clubSlug);
      if (!clubId) return NextResponse.json({ ok: false, error: "Club not found." }, { status: 404 });
      const row = await upsertRow(
        "club_settings",
        { club_id: clubId, key: payload.key, value: payload.value ?? {} },
        "club_id,key",
      );
      return NextResponse.json({ ok: true, source: "supabase", setting: row });
    } catch (error) {
      return NextResponse.json({ ok: true, source: "mock", setting: payload, supabaseError: String(error) });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", setting: payload });
}
