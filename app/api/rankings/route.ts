import { getClubRoster } from "@/data/platform";
import { apiSupabaseError, requireApiAccess } from "@/lib/api-access";
import { noStoreJson } from "@/lib/api-json";
import { getBackendClubId, getMockClubId } from "@/lib/backend";
import { getReadableMemberIds } from "@/lib/member-visibility";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";
import { toStudent } from "@/lib/supabase/mappers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiAccess(searchParams.get("club"));
  if (access.error) return access.error;
  const clubSlug = access.session.activeClub.slug;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(clubSlug);
      if (!clubId) return noStoreJson({ source: "supabase", rankings: [] });
      const readable = await getReadableMemberIds({
        clubId,
        userId: access.session.user.id,
        userEmail: access.session.user.email,
        role: access.session.activeRole,
      });
      if ("error" in readable && readable.error) return readable.error;
      if ("empty" in readable && readable.empty) return noStoreJson({ source: "supabase", rankings: [] });

      const rankRows = readable.scope === "own"
        ? await selectRows("academy_members", `select=id,points&club_id=eq.${clubId}&order=points.desc`)
        : null;
      const rankById = rankRows
        ? new Map(rankRows.map((row, index) => [row.id, index + 1]))
        : null;
      const filters = [`club_id=eq.${clubId}`];
      if (readable.scope === "own") filters.push(`id=in.(${readable.memberIds.map(encodeURIComponent).join(",")})`);

      const rows = await selectRows("academy_members", `select=*&${filters.join("&")}&order=points.desc`);
      const rankedRows = rows
        .map(toStudent)
        .map((member, index) => ({ ...member, rank: rankById?.get(member.id) ?? index + 1 }));

      return noStoreJson({
        source: "supabase",
        rankings: rankedRows,
      });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  return noStoreJson({
    source: "mock",
    rankings: getMockRankings(clubSlug, {
      userName: access.session.user.name,
      role: access.session.activeRole,
    }),
  });
}

function getMockRankings(clubSlug: string, viewer: { userName: string; role: string }) {
  const rankings = getClubRoster(getMockClubId(clubSlug))
    .sort((a, b) => b.points - a.points)
    .map((member, index) => ({ ...member, rank: index + 1 }));

  if (viewer.role === "owner" || viewer.role === "admin" || viewer.role === "coach") return rankings;
  return rankings.filter((member) => member.name === viewer.userName);
}
