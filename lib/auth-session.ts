import { cookies } from "next/headers";
import { authCookieNames } from "@/lib/auth-cookies";
import { clubMemberships, clubs, getDemoSafeRole, platformUsers } from "@/data/platform";
import { isMockAuthFallbackAllowed } from "@/lib/auth-mode";
import { getAuthUser, refreshPasswordSession } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { selectRows } from "@/lib/supabase/server";
import { toClub, toClubMembership, toPlatformUser } from "@/lib/supabase/mappers";

export function getDemoWorkspaceSession(activeClubSlug = "grapply-bjj") {
  const user = platformUsers.find((candidate) => candidate.id === "usr-sofia") ?? platformUsers[0];
  if (!user) return null;

  const normalizedMemberships = clubMemberships
    .filter((membership) => membership.userId === user.id)
    .map((membership) => {
      const club = clubs.find((candidate) => candidate.id === membership.clubId);
      if (!club) return null;
      return { ...membership, role: getDemoSafeRole(user.email, club.slug, membership.role), club };
    })
    .filter((membership): membership is NonNullable<typeof membership> => Boolean(membership));

  const activeMembership = activeClubSlug
    ? normalizedMemberships.find((membership) => membership.club.slug === activeClubSlug) ?? null
    : normalizedMemberships[0] ?? null;

  return {
    user,
    memberships: normalizedMemberships,
    activeClub: activeMembership?.club ?? null,
    activeRole: activeMembership?.role ?? null,
  };
}

export async function getCurrentSession() {
  const result = await getCurrentSessionResult(false);
  return result.session;
}

export async function getCurrentSessionWithRefresh() {
  return getCurrentSessionResult(true);
}

async function getCurrentSessionResult(allowRefresh: boolean) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.accessToken)?.value;
  const refreshToken = cookieStore.get(authCookieNames.refreshToken)?.value;
  const activeClubSlug = cookieStore.get(authCookieNames.activeClub)?.value;

  let refreshedSession: Awaited<ReturnType<typeof refreshPasswordSession>> | null = null;
  let authUser: Awaited<ReturnType<typeof getAuthUser>> | null = null;

  if (!accessToken) {
    if (!allowRefresh || !refreshToken || !isSupabaseConfigured()) return { session: null, refreshedSession: null };
    refreshedSession = await refreshPasswordSession(refreshToken).catch(() => null);
    authUser = refreshedSession?.user ?? null;
    if (!authUser?.email) return { session: null, refreshedSession: null };
  }

  if (accessToken?.startsWith("mock:") && !isMockAuthFallbackAllowed()) return { session: null, refreshedSession: null };

  if (!isSupabaseConfigured() || accessToken?.startsWith("mock:")) {
    const userId = accessToken?.startsWith("mock:") ? accessToken.slice("mock:".length) : platformUsers[0]?.id;
    const user = platformUsers.find((candidate) => candidate.id === userId);
    if (!user) return { session: null, refreshedSession: null };

    const normalizedMemberships = clubMemberships
      .filter((membership) => membership.userId === user.id)
      .map((membership) => {
        const club = clubs.find((candidate) => candidate.id === membership.clubId);
        if (!club) return null;
        return { ...membership, role: getDemoSafeRole(user.email, club.slug, membership.role), club };
      })
      .filter((membership): membership is NonNullable<typeof membership> => Boolean(membership));

    const activeMembership = activeClubSlug
      ? normalizedMemberships.find((membership) => membership.club.slug === activeClubSlug) ?? null
      : normalizedMemberships[0] ?? null;

    return {
      refreshedSession: null,
      session: {
        user,
        memberships: normalizedMemberships,
        activeClub: activeMembership?.club ?? null,
        activeRole: activeMembership?.role ?? null,
      },
    };
  }

  if (!authUser?.email && accessToken) {
    authUser = await getAuthUser(accessToken);
  }
  if (!authUser?.email && refreshToken && allowRefresh) {
    refreshedSession = await refreshPasswordSession(refreshToken).catch(() => null);
    authUser = refreshedSession?.user ?? null;
  }
  if (!authUser?.email) return { session: null, refreshedSession: null };

  const users = await selectRows("app_users", `select=*&email=eq.${encodeURIComponent(authUser.email)}&limit=1`);
  const userRow = users[0];
  if (!userRow) return { session: null, refreshedSession: null };

  const memberships = await selectRows("club_memberships", `select=*&user_id=eq.${userRow.id}`);
  const clubIds = memberships.map((membership) => membership.club_id);
  const clubRows = clubIds.length ? await selectRows("clubs", `select=*&id=in.(${clubIds.join(",")})`) : [];
  const normalizedMemberships = memberships
    .map((membership) => {
      const club = clubRows.find((row) => row.id === membership.club_id);
      if (!club) return null;
      const mappedClub = toClub(club);
      const mappedMembership = toClubMembership(membership);
      return { ...mappedMembership, club: mappedClub };
    })
    .filter((membership): membership is NonNullable<typeof membership> => Boolean(membership));

  const activeMembership = activeClubSlug
    ? normalizedMemberships.find((membership) => membership.club.slug === activeClubSlug) ?? null
    : normalizedMemberships[0] ?? null;

  return {
    refreshedSession,
    session: {
      user: toPlatformUser(userRow),
      memberships: normalizedMemberships,
      activeClub: activeMembership?.club ?? null,
      activeRole: activeMembership?.role ?? null,
    },
  };
}
