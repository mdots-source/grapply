import { redirect } from "next/navigation";
import type { Club, PlatformRole } from "@/data/platform";
import { getCurrentSession } from "@/lib/auth-session";

type WorkspaceSession = NonNullable<Awaited<ReturnType<typeof getCurrentSession>>> & {
  activeClub: Club;
  activeRole: PlatformRole;
};

export async function requireWorkspaceRole(allowedRoles: PlatformRole[], returnTo: string): Promise<WorkspaceSession> {
  const session = await getCurrentSession();

  if (!session) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (!session.activeRole || !session.activeClub) {
    redirect(`/clubs?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (!allowedRoles.includes(session.activeRole)) {
    redirect(`/schedule?access=denied&from=${encodeURIComponent(returnTo)}`);
  }

  return session as WorkspaceSession;
}
