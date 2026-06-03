"use client";

import Link from "next/link";
import { CalendarClock, ClipboardList, ShieldCheck, UserPlus, Users } from "lucide-react";
import { BeltPill } from "@/components/belt-pill";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { coachActions, dashboardStats as seedDashboardStats, studentsNeedingAttention, todayClasses } from "@/data/dashboard";
import type { DashboardMeta, DashboardStats } from "@/components/dashboard-grid";
import type { PlatformRole } from "@/data/platform";

export function AdminOverview({
  stats = seedDashboardStats,
  viewerRole,
  meta,
}: {
  stats?: DashboardStats;
  viewerRole: PlatformRole;
  meta: DashboardMeta;
}) {
  const canManageMembers = viewerRole === "owner" || viewerRole === "admin" || viewerRole === "coach";
  const canManageClub = viewerRole === "owner" || viewerRole === "admin";
  const roleLabel = viewerRole === "coach" ? "Trainer" : viewerRole[0].toUpperCase() + viewerRole.slice(1);
  const nextClass = todayClasses.find((item) => item.isNext) ?? todayClasses[0];

  return (
    <section className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge variant="accent">{roleLabel}</Badge>
              <h2 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">Today at the academy</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {meta.liveClass.name} with {meta.liveClass.coach} on {meta.liveClass.room}, {meta.liveClass.time}.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-64">
              <SimpleMetric label="Members" value={stats.activeStudents.toString()} />
              <SimpleMetric label="Checked in" value={stats.checkedInToday.toString()} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="surface" asChild>
              <Link href="/schedule">
                <CalendarClock size={16} />
                View schedule
              </Link>
            </Button>
            <Button variant="surface" asChild>
              <Link href="/members">
                <Users size={16} />
                View members
              </Link>
            </Button>
            {canManageMembers && (
              <Button variant="primary" asChild>
                <Link href="/schedule?create=class">
                  <ClipboardList size={16} />
                  Create class
                </Link>
              </Button>
            )}
            {canManageClub && (
              <Button variant="outline" asChild>
                <Link href="/admin">
                  <ShieldCheck size={16} />
                  Manage roles
                </Link>
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">Role access</CardTitle>
              <CardDescription>What this account can do in the selected club.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <AccessLine active label="View dashboard, members, schedule, camps, competitions, rankings" />
            <AccessLine active={canManageMembers} label="Plan classes, manage rosters, create posts, update members" />
            <AccessLine active={canManageClub} label="Invite trainers, remove staff, edit settings, manage organization" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock size={18} className="text-[var(--accent)]" />
                Classes today
              </CardTitle>
              <CardDescription>Next up: {nextClass.name} at {nextClass.time}.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayClasses.map((item) => (
              <div
                key={item.time}
                className={`rounded-xl border p-3 ${
                  item.isNext ? "border-[var(--accent)]/35 bg-[var(--accent)]/8" : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{item.name}</p>
                  <Badge variant={item.isNext ? "accent" : "default"}>{item.time}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {item.coach} · {item.room}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">{canManageMembers ? "Trainer tasks" : "Club updates"}</CardTitle>
              <CardDescription>
                {canManageMembers ? "Practical work for members and classes." : "Read-only member view."}
              </CardDescription>
            </div>
            {canManageMembers && (
              <Button variant="surface" size="sm" asChild>
                <Link href="/members?add=1">
                  <UserPlus size={15} />
                  Add member
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {canManageMembers ? (
              <>
                {studentsNeedingAttention.map((student) => (
                  <Link
                    key={student.id}
                    href={`/members?member=${student.id}`}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 transition hover:border-[var(--accent)]/30"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{student.name}</p>
                      <p className="text-xs text-[var(--muted)]">{student.reason}</p>
                    </div>
                    <BeltPill belt={student.belt} />
                  </Link>
                ))}
                {coachActions.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
                    <p className="text-sm leading-5 text-[var(--foreground)]">{item.action}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {item.coach} · {item.time}
                    </p>
                  </div>
                ))}
              </>
            ) : (
              <>
                {coachActions.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
                    <p className="text-sm leading-5 text-[var(--foreground)]">{item.action}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">{item.time}</p>
                  </div>
                ))}
                <div className="flex -space-x-3 pt-2">
                  {studentsNeedingAttention.map((student) => (
                    <StudentAvatar key={student.id} student={{ name: student.name, belt: student.belt }} className="size-10 border-2 border-[var(--background)]" />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SimpleMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function AccessLine({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
      <span className={active ? "mt-1 size-2 rounded-full bg-[var(--status-success)]" : "mt-1 size-2 rounded-full bg-[var(--muted)]"} />
      <span className={active ? "text-[var(--foreground)]" : "text-[var(--muted)]"}>{label}</span>
    </div>
  );
}
