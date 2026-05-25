import { NextResponse } from "next/server";
import { clubClasses } from "@/data/platform";
import { getBackendClubId } from "@/lib/backend";
import { isSupabaseConfigured, insertRow, selectRows } from "@/lib/supabase/server";
import { toClubClass } from "@/lib/supabase/mappers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clubSlug = searchParams.get("club") ?? "grapply-bjj";

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(clubSlug);
      if (!clubId) return NextResponse.json({ source: "supabase", classes: [] });

      const rows = await selectRows("club_classes", `select=*&club_id=eq.${clubId}&order=day.asc,time.asc`);
      return NextResponse.json({ source: "supabase", classes: rows.map(toClubClass) });
    } catch (error) {
      return NextResponse.json({ source: "mock", classes: clubClasses, supabaseError: String(error) });
    }
  }

  return NextResponse.json({ source: "mock", classes: clubClasses });
}

export async function POST(request: Request) {
  const payload = await request.json();

  if (!payload?.name || !payload?.coach || !payload?.day || !payload?.time) {
    return NextResponse.json({ ok: false, error: "Missing class name, coach, day, or time." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(payload.clubSlug ?? "grapply-bjj");
      if (!clubId) return NextResponse.json({ ok: false, error: "Club not found." }, { status: 404 });

      const created = await insertRow("club_classes", {
        club_id: clubId,
        name: payload.name,
        coach: payload.coach,
        day: payload.day,
        time: payload.time,
        mat: payload.mat ?? "Main Mat",
        level: payload.level ?? "all belts",
        checked_in: payload.checkedIn ?? 0,
      });

      return NextResponse.json({ ok: true, source: "supabase", class: toClubClass(created) });
    } catch (error) {
      return NextResponse.json({ ok: false, source: "supabase", error: String(error) }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", class: payload });
}
