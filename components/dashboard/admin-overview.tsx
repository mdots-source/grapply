"use client";

import { CalendarClock, ClipboardList, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveClub } from "@/components/use-active-club";
import { dashboardStats as seedDashboardStats } from "@/data/dashboard";
import type { DashboardClass, DashboardMeta, DashboardStats } from "@/components/dashboard-grid";
import type { PlatformRole } from "@/data/platform";

export function AdminOverview({
  stats = seedDashboardStats,
  viewerRole,
  meta,
  classes,
  clubSlug,
}: {
  stats?: DashboardStats;
  viewerRole: PlatformRole;
  meta: DashboardMeta;
  classes?: DashboardClass[];
  clubSlug?: string;
}) {
  const activeClub = useActiveClub();
  const resolvedClubSlug = activeClub?.slug ?? clubSlug;
  const canManageSchedule = viewerRole === "owner" || viewerRole === "admin" || viewerRole === "coach";
  const canManageClub = viewerRole === "owner" || viewerRole === "admin";
  const roleLabel = viewerRole === "coach" ? "Coach" : viewerRole[0].toUpperCase() + viewerRole.slice(1);
  const workspaceHref = (path: string) => resolvedClubSlug ? `/${resolvedClubSlug}${path}` : path;
  const visibleClasses = classes ?? [];
  const nextClass = visibleClasses[0];

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
              <a href={workspaceHref("/schedule")}>
                <CalendarClock size={16} />
                View schedule
              </a>
            </Button>
            <Button variant="surface" asChild>
              <a href={workspaceHref("/members")}>
                <Users size={16} />
                View members
              </a>
            </Button>
            {canManageSchedule && (
              <Button variant="primary" asChild>
                <a href={workspaceHref("/schedule?create=class")}>
                  <ClipboardList size={16} />
                  Create class
                </a>
              </Button>
            )}
            {canManageClub && (
              <Button variant="outline" asChild>
                <a href={workspaceHref("/admin")}>
                  <ShieldCheck size={16} />
                  Manage roles
                </a>
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
              <CardDescription>
                {nextClass ? `Next up: ${nextClass.name} at ${nextClass.time}.` : "No classes are scheduled for this club yet."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {visibleClasses.length ? visibleClasses.map((item, index) => (
              <div
                key={item.id}
                className={`rounded-xl border p-3 ${
                  index === 0 ? "border-[var(--accent)]/35 bg-[var(--accent)]/8" : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{item.name}</p>
                  <Badge variant={index === 0 ? "accent" : "default"}>{item.time}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {item.coach} · {item.mat}
                </p>
              </div>
            )) : (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
                Create the first class from Schedule when you are ready.
              </div>
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
