import { LockKeyhole } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { ScheduleGrid } from "@/components/schedule-grid";
import { Card } from "@/components/ui/card";
import { getClassesData, getCompetitionsData, getVisibleMembersData } from "@/lib/backend-data";
import { getWorkspaceDestinationLabel } from "@/lib/workspace-intent";
import { requireWorkspaceRole } from "@/lib/workspace-access";

export default async function SchedulePage({ searchParams }: { searchParams?: Promise<{ access?: string; checkIn?: string; create?: string; from?: string }> }) {
  const params = await searchParams;
  const returnToParams = new URLSearchParams();
  if (params?.checkIn) returnToParams.set("checkIn", params.checkIn);
  if (params?.create) returnToParams.set("create", params.create);
  const session = await requireWorkspaceRole(["owner", "admin", "coach", "member"], `/schedule${returnToParams.size ? `?${returnToParams}` : ""}`);
  const deniedFrom = params?.access === "denied" && params.from?.startsWith("/") ? params.from : null;
  const canManageClasses = session.activeRole === "owner" || session.activeRole === "admin" || session.activeRole === "coach";
  const viewer = {
    userId: session.user.id,
    userEmail: session.user.email,
    role: session.activeRole,
  };
  let initialScheduleError: string | null = null;
  const [initialClasses, initialCompetitions, initialMembers] = await Promise.all([
    getClassesData(session.activeClub.slug).catch((error) => {
      initialScheduleError = error instanceof Error ? error.message : "Could not load classes.";
      return [];
    }),
    getCompetitionsData(session.activeClub.slug, viewer).catch(() => []),
    getVisibleMembersData({
      clubSlug: session.activeClub.slug,
      userId: session.user.id,
      userEmail: session.user.email,
      role: session.activeRole,
    }).catch(() => []),
  ]);

  return (
    <AppShell title="Schedule" subtitle="Weekly academy planner with classes, coaches, rooms, and training levels at a glance." initialSession={session}>
      <PageTransition>
        {deniedFrom && <AccessNotice from={deniedFrom} />}
        <ScheduleGrid
          initialCheckInClassId={canManageClasses ? params?.checkIn : undefined}
          initialCreateClass={canManageClasses && params?.create === "class"}
          canManageClasses={canManageClasses}
          classManagementScope={session.activeRole === "coach" ? "own" : canManageClasses ? "all" : "none"}
          currentUserId={session.user.id}
          currentUserName={session.user.name}
          initialClasses={initialClasses}
          initialCompetitionEvents={initialCompetitions}
          initialMembers={initialMembers}
          initialScheduleError={initialScheduleError}
          initialClubSlug={session.activeClub.slug}
        />
      </PageTransition>
    </AppShell>
  );
}

function AccessNotice({ from }: { from: string }) {
  return (
    <Card className="mb-4 border-[var(--accent)]/25 bg-[var(--accent)]/8 p-4">
      <div className="flex gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/12 text-[var(--accent)]">
          <LockKeyhole size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">This club role cannot access {getWorkspaceDestinationLabel(from)}.</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Switch to a club where you have staff access, or keep working from the schedule.</p>
        </div>
      </div>
    </Card>
  );
}
