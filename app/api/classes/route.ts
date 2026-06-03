import { NextResponse } from "next/server";
import { clubClasses } from "@/data/platform";
import { requireApiRole } from "@/lib/api-access";
import { getBackendClubId, getMockClubId, getRequestedClubSlug } from "@/lib/backend";
import { isSupabaseConfigured, insertRow, selectRows } from "@/lib/supabase/server";
import { toClubClass } from "@/lib/supabase/mappers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clubSlug = await getRequestedClubSlug(searchParams.get("club"));

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(clubSlug);
      if (!clubId) return NextResponse.json({ source: "supabase", classes: [] });

      const rows = await selectRows("club_classes", `select=*&club_id=eq.${clubId}&order=day.asc,time.asc`);
      return NextResponse.json({ source: "supabase", classes: rows.map(toClubClass) });
    } catch (error) {
      return NextResponse.json({ source: "mock", classes: getMockClasses(clubSlug), supabaseError: String(error) });
    }
  }

  return NextResponse.json({ source: "mock", classes: getMockClasses(clubSlug) });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const access = await requireApiRole(["owner", "admin", "coach"], payload.clubSlug);
  if (access.error) return access.error;

  if (!payload?.name || !payload?.coach || !payload?.day || !payload?.time) {
    return NextResponse.json({ ok: false, error: "Missing class name, coach, day, or time." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(payload.clubSlug);
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
      return NextResponse.json({ ok: true, source: "mock", class: payload, supabaseError: String(error) });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", class: payload });
}

function getMockClasses(clubSlug?: string | null) {
  if (!clubSlug) return clubClasses;
  const clubId = getMockClubId(clubSlug);
  return clubClasses.filter((item) => item.clubId === clubId);
}
