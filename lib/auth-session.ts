import { cookies } from "next/headers";
import { authCookieNames } from "@/lib/auth-cookies";
import { getAuthUser } from "@/lib/supabase/auth";
import { selectRows } from "@/lib/supabase/server";
import { toClub, toClubMembership, toPlatformUser } from "@/lib/supabase/mappers";

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.accessToken)?.value;
  const activeClubSlug = cookieStore.get(authCookieNames.activeClub)?.value;

  if (!accessToken) return null;

  const authUser = await getAuthUser(accessToken);
  if (!authUser?.email) return null;

  const users = await selectRows("app_users", `select=*&email=eq.${encodeURIComponent(authUser.email)}&limit=1`);
  const userRow = users[0];
  if (!userRow) return null;

  const memberships = await selectRows("club_memberships", `select=*&user_id=eq.${userRow.id}`);
  const clubIds = memberships.map((membership) => membership.club_id);
  const clubRows = clubIds.length ? await selectRows("clubs", `select=*&id=in.(${clubIds.join(",")})`) : [];
  const normalizedMemberships = memberships
    .map((membership) => {
      const club = clubRows.find((row) => row.id === membership.club_id);
      if (!club) return null;
      return { ...toClubMembership(membership), club: toClub(club) };
    })
    .filter((membership): membership is NonNullable<typeof membership> => Boolean(membership));

  const activeMembership =
    normalizedMemberships.find((membership) => membership.club.slug === activeClubSlug) ?? normalizedMemberships[0] ?? null;

  return {
    authUser,
    user: toPlatformUser(userRow),
    memberships: normalizedMemberships,
    activeClub: activeMembership?.club ?? null,
    activeRole: activeMembership?.role ?? null,
  };
}
