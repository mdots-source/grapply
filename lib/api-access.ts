import { NextResponse } from "next/server";
import type { Club, PlatformRole } from "@/data/platform";
import { getCurrentSession } from "@/lib/auth-session";

type ApiSession = NonNullable<Awaited<ReturnType<typeof getCurrentSession>>> & {
  activeClub: Club;
  activeRole: PlatformRole;
};

export async function requireApiRole(allowedRoles: PlatformRole[], clubSlug?: string | null) {
  const session = await getCurrentSession();

  if (!session) {
    return { error: NextResponse.json({ ok: false, error: "Login required." }, { status: 401 }) };
  }

  const membership = clubSlug
    ? session.memberships.find((item) => item.club.slug === clubSlug)
    : session.activeClub && session.activeRole
      ? session.memberships.find((item) => item.club.slug === session.activeClub?.slug)
      : null;

  if (!membership) {
    return { error: NextResponse.json({ ok: false, error: "Club access required." }, { status: 403 }) };
  }

  if (!allowedRoles.includes(membership.role)) {
    return { error: NextResponse.json({ ok: false, error: "You do not have permission for this action." }, { status: 403 }) };
  }

  return {
    session: {
      ...session,
      activeClub: membership.club,
      activeRole: membership.role,
    } as ApiSession,
  };
}
