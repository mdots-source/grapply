import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Mountain,
  Plane,
  ShieldCheck,
  Target,
  Tent,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resolveStudentsByIds } from "@/lib/members";
import { getTrainingCampsData } from "@/lib/backend-data";
import { requireWorkspaceRole } from "@/lib/workspace-access";
import type { TrainingCamp } from "@/data/training-camps";

const tasks = [
  { label: "Travel confirmed", done: 11, total: 16 },
  { label: "Deposits paid", done: 9, total: 16 },
  { label: "Gear checklist", done: 14, total: 16 },
];

export default async function TrainingCampsPage() {
  const session = await requireWorkspaceRole(["owner", "admin", "coach", "member"], "/training-camps");
  const trainingCamps = await getTrainingCampsData();
  const totalTravelers = new Set(trainingCamps.flatMap((camp) => camp.registered_students)).size;
  const nextCamp = trainingCamps[0];
  const canManagePlanning = session.activeRole !== "member";
  const averagePrep = trainingCamps.length
    ? Math.round(trainingCamps.reduce((total, camp) => total + camp.prep, 0) / trainingCamps.length)
    : 0;
  const lowPrepCamps = trainingCamps.filter((camp) => camp.prep < 65).length;
  const openCamps = trainingCamps.filter((camp) => camp.status.toLowerCase().includes("open")).length;

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
          <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-[var(--border)] p-5">
                <Badge variant="accent">Next camp</Badge>
                <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
                  {canManagePlanning ? (
                    <Button variant="primary" asChild>
                      <Link href="#camp-prep">
                        <Plane size={16} /> Plan trip
                      </Link>
                    </Button>
                  ) : (
                    <Badge variant="muted">Trip plan managed by staff</Badge>
                  )}
                </div>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-3">
                <Metric label="Athletes interested" value={totalTravelers.toString()} />
                <Metric label="Upcoming camps" value={trainingCamps.length.toString()} />
                <Metric label="Registration deadline" value={nextCamp.registration_deadline} />
              </div>
            </Card>

            <Card id="camp-prep" className="scroll-mt-6 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Travel checklist</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Readiness for the next academy camp trip.</p>
                </div>
                <ShieldCheck className="text-[var(--accent-blue)]" size={22} />
              </div>
              <div className="mt-5 space-y-4">
                {tasks.map((task) => (
                  <div key={task.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--muted)]">{task.label}</span>
                      <span className="font-mono text-xs text-[var(--muted)]">
                        {task.done}/{task.total}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-hover)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent-blue)]"
                        style={{ width: `${(task.done / task.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            <ReadinessCard
              icon={Target}
              label="Average readiness"
              value={`${averagePrep}%`}
              detail={averagePrep >= 75 ? "Travel plans are on track" : "Needs staff review"}
              tone={averagePrep >= 75 ? "success" : "warning"}
            />
            <ReadinessCard
              icon={AlertTriangle}
              label="Trips under 65%"
              value={lowPrepCamps.toString()}
              detail={lowPrepCamps > 0 ? "Review travel and deposits" : "No weak trip plans"}
              tone={lowPrepCamps > 0 ? "warning" : "success"}
            />
            <ReadinessCard
              icon={CheckCircle2}
              label="Registration open"
              value={openCamps.toString()}
              detail={canManagePlanning ? "Staff can plan rosters" : "Managed by academy staff"}
              tone="accent"
            />
          </section>

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

function ReadinessCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  detail: string;
  tone: "accent" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
      : tone === "warning"
        ? "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300"
        : "border-[var(--accent-blue)]/25 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]";

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--muted)]">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--foreground)]">{value}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>
        </div>
        <div className={`grid size-10 shrink-0 place-items-center rounded-xl border ${toneClass}`}>
          <Icon size={18} />
        </div>
      </div>
    </Card>
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
  const needsReview = camp.prep < 65;
  const fewSpotsLeft = spotsLeft <= 4;

  return (
    <Card className="flex min-h-[360px] flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={camp.status === "Registration open" ? "accent" : "muted"}>{camp.status}</Badge>
            {needsReview && (
              <Badge variant="muted">
                <AlertTriangle size={12} /> Needs travel plan
              </Badge>
            )}
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

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--muted)]">Trip prep</span>
          <span className="font-mono text-[var(--accent-blue)]">{camp.prep}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-hover)]">
          <div className="h-full rounded-full bg-[var(--accent-blue)]" style={{ width: `${camp.prep}%` }} />
        </div>
      </div>

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
            <Button variant={needsReview ? "primary" : "surface"} size="sm" asChild>
              <Link href={`/members?filter=camp&camp=${camp.id}`}>
                {needsReview ? "Review trip" : "Plan roster"}
              </Link>
            </Button>
          ) : (
            <Badge variant="muted">Staff managed</Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
