import { getUserClubContext } from "@/data/platform";
import { apiSupabaseError } from "@/lib/api-access";
import { noStoreJson } from "@/lib/api-json";
import { clearActiveClubCookie } from "@/lib/auth-cookies";
import { getCurrentSession } from "@/lib/auth-session";
import { isMockAuthFallbackAllowed } from "@/lib/auth-mode";
import { toClub, toClubMembership, toPlatformUser } from "@/lib/supabase/mappers";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    if (!isSupabaseConfigured() && isMockAuthFallbackAllowed()) {
      return noStoreJson(getUserClubContext("usr-sofia"));
    }
    return noStoreJson({ ok: false, error: "Login required." }, { status: 401 });
  }

  if (isSupabaseConfigured()) {
    try {
      const users = await selectRows("app_users", `select=*&id=eq.${encodeURIComponent(session.user.id)}&limit=1`);
      const userRow = users[0];
      const user = userRow ? toPlatformUser(userRow) : null;
      if (!user) {
        const response = noStoreJson({ user: null, memberships: [] });
        clearActiveClubCookie(response);
        return response;
      }

      const memberships = await selectRows("club_memberships", `select=*&user_id=eq.${user.id}`);
      const clubIds = memberships.map((membership) => membership.club_id);
      const clubs = clubIds.length > 0 ? await selectRows("clubs", `select=*&id=in.(${clubIds.join(",")})`) : [];
      const stravaConnections = clubIds.length > 0
        ? await selectRows("strava_connections", `select=*&user_id=eq.${user.id}&club_id=in.(${clubIds.join(",")})`).catch(() => [])
        : [];

      const response = noStoreJson({
        source: "supabase",
        user,
        memberships: memberships.map((membership) => {
          const membershipClub = clubs.find((club) => club.id === membership.club_id);
          const mappedClub = membershipClub ? toClub(membershipClub) : undefined;
          const mappedMembership = toClubMembership(membership);
          const stravaConnection = stravaConnections.find((connection) => connection.club_id === membership.club_id);
          return {
            ...mappedMembership,
            stravaStatus: stravaConnection ? "connected" : "not_connected",
            stravaAthleteId: stravaConnection?.athlete_id,
            club: mappedClub,
          };
        }),
      });
      if (!session.activeClub) clearActiveClubCookie(response);
      return response;
    } catch (error) {
      return apiSupabaseError(error);
    }
  }

  const response = noStoreJson({
    user: session.user,
    memberships: session.memberships,
  });
  if (!session.activeClub) clearActiveClubCookie(response);
  return response;
}
