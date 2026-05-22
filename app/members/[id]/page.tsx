import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BeltPill } from "@/components/belt-pill";
import { PageTransition } from "@/components/page-transition";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardKicker, CardTitle } from "@/components/ui/card";
import { attendance, students } from "@/data/academy";

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = students.find((item) => item.id === id);
  if (!member) notFound();

  return (
    <AppShell title={member.name} subtitle="Coach-ready profile with belt progression, attendance history, competitive record, streaks, and training focus.">
      <PageTransition>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                <StudentAvatar student={member} size="xl" priority />
                <div>
                  <BeltPill belt={member.belt} stripes={member.stripes} />
                  <h2 className="mt-4 text-4xl font-semibold">{member.name}</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">Primary focus: {member.focus}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  [member.classes30, "classes"],
                  [member.streak, "streak"],
                  [`${member.wins}-${member.losses}`, "record"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
                    <p className="text-2xl font-semibold text-[var(--accent)]">{value}</p>
                    <p className="text-xs text-[var(--muted)]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8">
              <p className="mb-3 text-sm font-semibold text-[var(--muted)]">Belt progression</p>
              <div className="h-3 rounded-full bg-[var(--surface-hover)]">
                <div
                  className="h-3 rounded-full bg-[linear-gradient(90deg,#f4f4f5,#0ea5e9,#8b5cf6,#92400e,#e8ff5f)]"
                  style={{ width: `${Math.min(92, 38 + member.stripes * 9 + member.classes30)}%` }}
                />
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Academy attendance</CardTitle>
                <CardKicker>Last seven academy days (reference trend)</CardKicker>
              </div>
              <Badge>{member.status}</Badge>
            </CardHeader>
            <div className="flex h-52 items-end gap-3">
              {attendance.map((day) => (
                <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-lg bg-[var(--accent)]/80" style={{ height: `${day.students * 2}px` }} />
                  <span className="text-xs text-[var(--muted)]">{day.day}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {["Guard retention lab", "Pressure passing rounds", "Back escape benchmark"].map((item, index) => (
            <Card key={item}>
              <Badge>Session {index + 1}</Badge>
              <h3 className="mt-4 text-lg font-semibold">{item}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Coach notes are simulated for prototype review and show how OSS OS can make member development visible.</p>
            </Card>
          ))}
        </div>
      </PageTransition>
    </AppShell>
  );
}
