import { CalendarDays, Clock, MapPin, Plane, ShieldCheck, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resolveStudentsByIds } from "@/lib/members";
import { getCompetitionsData } from "@/lib/backend-data";
import type { Competition } from "@/data/competitions";

const tasks = [
  { label: "Confirm divisions", done: 18, total: 24 },
  { label: "Weight checks", done: 14, total: 24 },
  { label: "Travel plans", done: 9, total: 24 },
];

export default async function CompetitionsPage() {
  const competitions = await getCompetitionsData();
  const totalAthletes = new Set(competitions.flatMap((event) => event.registered_students)).size;
  const nextEvent = competitions[0];

  return (
    <AppShell title="Competitions" subtitle="Track tournaments, deadlines, athlete rosters, and team preparation in one place.">
      <PageTransition>
        <div className="space-y-5">
          <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-[var(--border)] p-5">
                <Badge variant="accent">Next competition</Badge>
                <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-3xl font-semibold text-[var(--foreground)]">{nextEvent.name}</h2>
                    <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={15} /> {nextEvent.date}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={15} /> {nextEvent.city}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Trophy size={15} /> {nextEvent.type}
                      </span>
                    </p>
                  </div>
                  <Button variant="primary">
                    <Plane size={16} /> Plan team
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-3">
                <Metric label="Athletes tracking" value={totalAthletes.toString()} />
                <Metric label="Upcoming events" value={competitions.length.toString()} />
                <Metric label="Registration deadline" value={nextEvent.registration_deadline} />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Prep checklist</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Registration readiness across the team.</p>
                </div>
                <ShieldCheck className="text-[var(--accent)]" size={22} />
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
                      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(task.done / task.total) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            {competitions.map((event) => (
              <CompetitionCard key={event.id} event={event} />
            ))}
          </section>
        </div>
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

function CompetitionCard({ event }: { event: Competition }) {
  const roster = resolveStudentsByIds(event.registered_students);

  return (
    <Card className="flex min-h-[330px] flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge>{event.status}</Badge>
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

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--muted)]">Team prep</span>
          <span className="font-mono text-[var(--accent)]">{event.prep}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-hover)]">
          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${event.prep}%` }} />
        </div>
      </div>

      <div className="mt-auto pt-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Roster</p>
        <div className="flex -space-x-3">
          {roster.map((student) => (
            <StudentAvatar key={student.id} student={student} className="size-10 border-2 border-[var(--background)]" />
          ))}
        </div>
      </div>
    </Card>
  );
}
