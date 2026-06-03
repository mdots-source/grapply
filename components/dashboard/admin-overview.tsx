"use client";

import Link from "next/link";
import { CalendarClock, ClipboardList, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardStats as seedDashboardStats, todayClasses } from "@/data/dashboard";
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
      <div>
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
      </div>

      <div>
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
