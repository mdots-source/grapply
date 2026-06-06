import Link from "next/link";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, MapPin, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CreateCompetitionForm, DeleteCompetitionButton, EditCompetitionButton } from "@/components/planning/create-competition-form";
import { PageTransition } from "@/components/page-transition";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCompetitionsData, getVisibleMembersData } from "@/lib/backend-data";
import { requireWorkspaceRole } from "@/lib/workspace-access";
import { getWorkspaceHref } from "@/lib/workspace-url";
import type { Competition } from "@/data/competitions";
import type { Student } from "@/data/academy";

export default async function CompetitionsPage() {
  const session = await requireWorkspaceRole(["owner", "admin", "coach", "member"], "/competitions");
  let loadError: string | null = null;
  const viewer = {
    userId: session.user.id,
    userEmail: session.user.email,
    role: session.activeRole,
  };
  const [competitions, members] = await Promise.all([
    getCompetitionsData(session.activeClub.slug, viewer).catch((error) => {
      loadError = error instanceof Error ? error.message : "Could not load competitions.";
      return [];
    }),
    getVisibleMembersData({
      clubSlug: session.activeClub.slug,
      userId: session.user.id,
      userEmail: session.user.email,
      role: session.activeRole,
    }).catch(() => {
      loadError ??= "Could not load competition roster.";
      return [];
    }),
  ]);
  const canManagePlanning = session.activeRole !== "member";
  const canDeletePlanning = session.activeRole === "owner" || session.activeRole === "admin";
  const organizationId = session.activeClub.slug;

  return (
    <AppShell title="Competitions" subtitle="Track tournaments, deadlines, athlete rosters, and team preparation in one place." initialSession={session}>
      <PageTransition>
        {loadError ? (
          <PlanningErrorState
            title="Competitions are unavailable"
            message={loadError}
            canManagePlanning={canManagePlanning}
            organizationId={organizationId}
          />
        ) : competitions.length === 0 ? (
          <div className="space-y-5">
            <Card className="flex min-h-[320px] flex-col items-center justify-center border-dashed p-8 text-center">
              <div className="grid size-14 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]">
                <Trophy size={26} />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-[var(--foreground)]">No competitions yet</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                Add tournaments for this club when the team starts tracking registrations, prep, and travel.
              </p>
            </Card>
            {canManagePlanning && <CreateCompetitionForm clubSlug={organizationId} />}
          </div>
        ) : (
        <div className="space-y-5">
          {canManagePlanning && <CreateCompetitionForm clubSlug={organizationId} />}

          <section id="competition-events" className="scroll-mt-6 grid gap-4 xl:grid-cols-3">
            {competitions.map((event) => (
              <CompetitionCard
                key={event.id}
                event={event}
                members={members}
                organizationId={organizationId}
                canManagePlanning={canManagePlanning}
                canDeletePlanning={canDeletePlanning}
              />
            ))}
          </section>
        </div>
        )}
      </PageTransition>
    </AppShell>
  );
}

function PlanningErrorState({
  title,
  message,
  canManagePlanning,
  organizationId,
}: {
  title: string;
  message: string;
  canManagePlanning: boolean;
  organizationId: string;
}) {
  return (
    <div className="space-y-5">
      <Card className="flex min-h-[320px] flex-col items-center justify-center border-dashed p-8 text-center">
        <div className="grid size-14 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--accent-coral)]">
          <AlertTriangle size={26} />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-[var(--foreground)]">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{message}</p>
      </Card>
      {canManagePlanning && <CreateCompetitionForm clubSlug={organizationId} />}
    </div>
  );
}

function CompetitionCard({
  event,
  members,
  organizationId,
  canManagePlanning,
  canDeletePlanning,
}: {
  event: Competition;
  members: Student[];
  organizationId: string;
  canManagePlanning: boolean;
  canDeletePlanning: boolean;
}) {
  const roster = resolveClubRoster(event.registered_students, members);

  return (
    <Card className="flex min-h-[330px] flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={event.status.toLowerCase().includes("open") ? "accent" : "muted"}>{event.status}</Badge>
            <Badge variant="muted">
              <CheckCircle2 size={12} /> Team event
            </Badge>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-[var(--foreground)]">{event.name}</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">{event.venue}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--accent)]">
          <Trophy size={22} />
        </div>
      </div>

      <div className="mt-5 grid gap-2 text-sm text-[var(--muted)]">
        <span className="inline-flex items-center gap-2">
          <CalendarDays size={15} /> {event.date}
        </span>
        <span className="inline-flex items-center gap-2">
          <MapPin size={15} /> {event.location}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock size={15} /> Deadline {event.registration_deadline}
        </span>
        <span className="inline-flex items-center gap-2">
          <Users size={15} /> {event.registered_students.length} athletes
        </span>
      </div>

      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{event.notes}</p>

      <div className="mt-auto pt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Roster</p>
          <span className="text-xs text-[var(--muted)]">{roster.length} athletes</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex -space-x-3">
            {roster.map((student) => (
              <StudentAvatar key={student.id} student={student} className="size-10 border-2 border-[var(--background)]" />
            ))}
          </div>
          {canManagePlanning ? (
            <div className="flex flex-wrap justify-end gap-2">
              <EditCompetitionButton event={event} clubSlug={organizationId} />
              {canDeletePlanning && <DeleteCompetitionButton event={event} clubSlug={organizationId} />}
              <Button variant="surface" size="sm" asChild>
                <Link href={getWorkspaceHref(`/members?filter=competition&event=${event.id}`, organizationId)}>
                  Manage roster
                </Link>
              </Button>
            </div>
          ) : (
            <Badge variant="muted">Staff managed</Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

function resolveClubRoster(memberIds: string[], members: Student[]) {
  const membersById = new Map(members.map((member) => [member.id, member]));
  return memberIds.map((id) => membersById.get(id)).filter((member): member is Student => Boolean(member));
}
