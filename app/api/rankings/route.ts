import { NextResponse } from "next/server";
import { getClubRoster } from "@/data/platform";
import { getBackendClubId, getMockClubId, getRequestedClubSlug } from "@/lib/backend";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";
import { toStudent } from "@/lib/supabase/mappers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clubSlug = await getRequestedClubSlug(searchParams.get("club"));

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(clubSlug);
      if (!clubId) return NextResponse.json({ source: "supabase", rankings: [] });
      const rows = await selectRows("academy_members", `select=*&club_id=eq.${clubId}&order=points.desc`);
      return NextResponse.json({
        source: "supabase",
        rankings: rows.map(toStudent).map((member, index) => ({ ...member, rank: index + 1 })),
      });
    } catch (error) {
      return NextResponse.json({
        source: "mock",
        rankings: getMockRankings(clubSlug),
        supabaseError: String(error),
      });
    }
  }

  return NextResponse.json({
    source: "mock",
    rankings: getMockRankings(clubSlug),
  });
}

function getMockRankings(clubSlug: string) {
  return getClubRoster(getMockClubId(clubSlug))
    .sort((a, b) => b.points - a.points)
    .map((member, index) => ({ ...member, rank: index + 1 }));
}
