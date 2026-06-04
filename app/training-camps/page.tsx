import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Mountain,
  Tent,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { CreateTrainingCampForm, EditTrainingCampButton } from "@/components/planning/create-training-camp-form";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resolveStudentsByIds } from "@/lib/members";
import { getTrainingCampsData } from "@/lib/backend-data";
import { requireWorkspaceRole } from "@/lib/workspace-access";
import type { TrainingCamp } from "@/data/training-camps";

export default async function TrainingCampsPage() {
  const session = await requireWorkspaceRole(["owner", "admin", "coach"], "/training-camps");
  const trainingCamps = await getTrainingCampsData();
  const totalTravelers = new Set(trainingCamps.flatMap((camp) => camp.registered_students)).size;
  const nextCamp = trainingCamps[0];
  const canManagePlanning = session.activeRole !== "member";

  return (
    <AppShell
      title="Training Camps"
      subtitle="Plan upcoming camps, travel windows, athlete interest, and academy trips worth attending."
      initialSession={session}
    >
      <PageTransition>
        {!nextCamp ? (
          <Card className="flex min-h-[360px] flex-col items-center justify-center border-dashed p-8 text-center">
            <div className="grid size-14 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--accent-blue)]">
              <Mountain size={26} />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-[var(--foreground)]">No training camps yet</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
              Add camps for this club when coaches start planning travel, rooms, payments, and rosters.
            </p>
          </Card>
        ) : (
        <div className="space-y-5">
          <section>
            <Card className="overflow-hidden p-0">
              <div className="border-b border-[var(--border)] p-5">
                <Badge variant="accent">Next camp</Badge>
                <div className="mt-4">
                  <div>
                    <h2 className="text-3xl font-semibold text-[var(--foreground)]">{nextCamp.name}</h2>
                    <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={15} /> {nextCamp.date} – {nextCamp.endDate}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={15} /> {nextCamp.city}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Tent size={15} /> {nextCamp.type}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-3">
                <Metric label="Athletes interested" value={totalTravelers.toString()} />
                <Metric label="Upcoming camps" value={trainingCamps.length.toString()} />
                <Metric label="Registration deadline" value={nextCamp.registration_deadline} />
              </div>
            </Card>
          </section>

          {canManagePlanning && <CreateTrainingCampForm />}

          <section id="camp-list" className="scroll-mt-6 grid gap-4 xl:grid-cols-2">
            {trainingCamps.map((camp) => (
              <CampCard key={camp.id} camp={camp} canManagePlanning={canManagePlanning} />
            ))}
          </section>
        </div>
        )}
      </PageTransition>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function CampCard({ camp, canManagePlanning }: { camp: TrainingCamp; canManagePlanning: boolean }) {
  const roster = resolveStudentsByIds(camp.registered_students);
  const spotsLeft = camp.spotsTotal - camp.registered_students.length;
  const fewSpotsLeft = spotsLeft <= 4;

  return (
    <Card className="flex min-h-[360px] flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={camp.status === "Registration open" ? "accent" : "muted"}>{camp.status}</Badge>
            <Badge variant="muted">
              <CheckCircle2 size={12} /> Travel plan
            </Badge>
            {fewSpotsLeft && <Badge variant="muted">Few spots left</Badge>}
          </div>
          <h3 className="mt-4 text-xl font-semibold text-[var(--foreground)]">{camp.name}</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">{camp.venue}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--accent-blue)]">
          <Mountain size={22} />
        </div>
      </div>

      <div className="mt-5 grid gap-2 text-sm text-[var(--muted)]">
        <span className="inline-flex items-center gap-2">
          <CalendarDays size={15} /> {camp.date} – {camp.endDate}
        </span>
        <span className="inline-flex items-center gap-2">
          <MapPin size={15} /> {camp.location}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock size={15} /> Register by {camp.registration_deadline}
        </span>
        <span className="inline-flex items-center gap-2">
          <Users size={15} /> {camp.registered_students.length}/{camp.spotsTotal} spots · {spotsLeft} left
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Camp focus</p>
        <p className="mt-1 text-sm text-[var(--foreground)]">{camp.focus}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Host: {camp.host} · Est. {camp.estimatedCost}
        </p>
      </div>

      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{camp.notes}</p>

      <div className="mt-auto pt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Travel roster</p>
          <span className="text-xs text-[var(--muted)]">{roster.length} athletes</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex -space-x-3">
            {roster.map((student) => (
              <StudentAvatar key={student.id} student={student} className="size-10 border-2 border-[var(--background)]" />
            ))}
          </div>
          {canManagePlanning ? (
            <div className="flex flex-wrap justify-end gap-2">
              <EditTrainingCampButton camp={camp} />
              <Button variant="surface" size="sm" asChild>
                <Link href={`/members?filter=camp&camp=${camp.id}`}>
                  Plan roster
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
