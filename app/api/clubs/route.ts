import { NextResponse } from "next/server";
import { getUserClubContext, platformUsers } from "@/data/platform";
import { toClub, toClubMembership, toPlatformUser } from "@/lib/supabase/mappers";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? "usr-sofia";
  const demoUser = platformUsers.find((user) => user.id === userId);

  if (isSupabaseConfigured()) {
    try {
      const userQuery = demoUser
        ? `select=*&email=eq.${encodeURIComponent(demoUser.email)}&limit=1`
        : `select=*&id=eq.${encodeURIComponent(userId)}&limit=1`;
      const users = await selectRows("app_users", userQuery);
      const userRow = users[0];
      const user = userRow ? toPlatformUser(userRow) : null;
      if (!user) return NextResponse.json({ user: null, memberships: [] });

      const memberships = await selectRows("club_memberships", `select=*&user_id=eq.${user.id}`);
      const clubIds = memberships.map((membership) => membership.club_id);
      const clubs = clubIds.length > 0 ? await selectRows("clubs", `select=*&id=in.(${clubIds.join(",")})`) : [];
      const stravaConnections = await selectRows("strava_connections", `select=*&user_id=eq.${user.id}`).catch(() => []);
      const stravaConnection = stravaConnections[0];

      return NextResponse.json({
        source: "supabase",
        user: {
          ...user,
          id: demoUser?.id ?? user.id,
          stravaStatus: stravaConnection ? "connected" : user.stravaStatus,
          stravaAthleteId: stravaConnection?.athlete_id,
        },
        memberships: memberships.map((membership) => ({
          ...toClubMembership(membership),
          club: clubs.find((club) => club.id === membership.club_id)
            ? toClub(clubs.find((club) => club.id === membership.club_id)!)
            : undefined,
        })),
      });
    } catch (error) {
      return NextResponse.json({ source: "mock", ...getUserClubContext(userId), supabaseError: String(error) });
    }
  }

  return NextResponse.json(getUserClubContext(userId));
}
