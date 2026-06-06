import { clubMemberships, clubs, platformUsers } from "@/data/platform";
import { apiSupabaseError, requireApiRole } from "@/lib/api-access";
import { noStoreJson, readJsonObject } from "@/lib/api-json";
import { getBackendClubId } from "@/lib/backend";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";
import { toPlatformUser } from "@/lib/supabase/mappers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiRole(["owner", "admin"], searchParams.get("club"));
  if (access.error) return access.error;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ source: "supabase", users: [] });

      const membershipRoleFilter = access.session.activeRole === "admin" ? "&role=in.(coach,member)" : "";
      const memberships = await selectRows("club_memberships", `select=*&club_id=eq.${clubId}${membershipRoleFilter}`);
      const userIds = memberships.map((membership) => membership.user_id);
      if (userIds.length === 0) return noStoreJson({ source: "supabase", users: [] });

      const [users, connections] = await Promise.all([
        selectRows("app_users", `select=*&id=in.(${userIds.join(",")})&order=name.asc`),
        selectRows("strava_connections", `select=*&club_id=eq.${clubId}&user_id=in.(${userIds.join(",")})`),
      ]);

      return noStoreJson({
        source: "supabase",
        users: users.map((row) => {
          const connection = connections.find((item) => item.user_id === row.id);
          return {
            ...toPlatformUser(row),
            stravaStatus: connection ? "connected" : "not_connected",
            stravaAthleteId: connection?.athlete_id,
          };
        }),
      });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  const club = clubs.find((item) => item.slug === access.session.activeClub.slug);
  const userIds = new Set(
    clubMemberships
      .filter((membership) => membership.clubId === club?.id && (access.session.activeRole === "owner" || membership.role === "coach" || membership.role === "member"))
      .map((membership) => membership.userId),
  );
  return noStoreJson({
    source: "mock",
    users: platformUsers.filter((user) => userIds.has(user.id)),
  });
}

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner"], requestedClubSlug);
  if (access.error) return access.error;

  return noStoreJson(
    {
      ok: false,
      error: "Direct user creation is disabled. Invite the person from Admin so registration can attach them to this club with the right role.",
    },
    { status: 405 },
  );
}
