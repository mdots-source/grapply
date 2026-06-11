import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Club, PlatformRole } from "@/data/platform";
import { getCurrentSession } from "@/lib/auth-session";
import { getRoleSafeWorkspaceReturnTo, scopeWorkspaceReturnTo } from "@/lib/workspace-intent";

type WorkspaceSession = NonNullable<Awaited<ReturnType<typeof getCurrentSession>>> & {
  activeClub: Club;
  activeRole: PlatformRole;
};

export async function requireWorkspaceRole(allowedRoles: PlatformRole[], returnTo: string): Promise<WorkspaceSession> {
  const session = await getCurrentSession();
  const requestHeaders = await headers();
  const requestedOrganizationId = requestHeaders.get("x-grapply-organization-id");
  const requestedReturnTo = requestedOrganizationId ? scopeWorkspaceReturnTo(returnTo, requestedOrganizationId) : returnTo;

  if (!session) {
    redirect(`/api/auth/refresh?returnTo=${encodeURIComponent(requestedReturnTo)}`);
  }

  const requestedMembership = requestedOrganizationId
    ? session.memberships.find((membership) => membership.club.slug === requestedOrganizationId)
    : null;
  const activeClub = requestedMembership?.club ?? session.activeClub;
  const activeRole = requestedMembership?.role ?? session.activeRole;

  if (requestedOrganizationId && !requestedMembership) {
    const destination = new URL("/clubs", "https://grapply.local");
    destination.searchParams.set("access", "denied");
    destination.searchParams.set("returnTo", requestedReturnTo);
    redirect(`${destination.pathname}${destination.search}`);
  }

  if (!activeRole || !activeClub) {
    redirect(`/clubs?returnTo=${encodeURIComponent(requestedReturnTo)}`);
  }

  if (!allowedRoles.includes(activeRole)) {
    const fallback = getRoleSafeWorkspaceReturnTo(requestedReturnTo, activeRole);
    const destination = new URL(scopeWorkspaceReturnTo(fallback, activeClub.slug), "https://grapply.local");
    destination.searchParams.set("access", "denied");
    destination.searchParams.set("from", requestedReturnTo);
    redirect(`${destination.pathname}${destination.search}`);
  }

  return {
    ...session,
    activeClub,
    activeRole,
  } as WorkspaceSession;
}
