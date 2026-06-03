"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  CalendarPlus,
  MonitorPlay,
  Plus,
  Radio,
  Clock,
  ShieldCheck,
  Trophy,
  UserPlus,
} from "lucide-react";
import { QuickActions } from "@/components/oss/quick-actions";
import { StatCard } from "@/components/oss/stat-card";
import { Badge } from "@/components/ui/badge";
import { academyMeta } from "@/data/academy-meta";
import { dashboardStats } from "@/data/dashboard";
import type { DashboardMeta, DashboardStats } from "@/components/dashboard-grid";

const quickActions = [
  { href: "/members?add=1", label: "Add member", icon: UserPlus, accent: "accent" as const },
  { href: "/schedule?create=class", label: "Create class", icon: CalendarPlus, accent: "blue" as const },
  { href: "/members?filter=promotion", label: "Award stripe", icon: Award, accent: "accent" as const },
  { href: "/competitions#competition-prep", label: "Plan team", icon: Trophy, accent: "blue" as const },
  { href: "/tv", label: "Open TV screen", icon: MonitorPlay, accent: "accent" as const },
  { href: "/training-feed?create=post", label: "Training post", icon: Plus, accent: "coral" as const },
];

export function CommandCenter({
  meta = academyMeta,
  stats = dashboardStats,
}: {
  meta?: DashboardMeta;
  stats?: DashboardStats;
}) {
  return (
    <section className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--panel)] p-5 md:p-6"
        style={{ boxShadow: "var(--glow-accent)" }}
      >
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent" className="gap-1.5">
                <Radio size={12} />
                On the mats
              </Badge>
              <Badge>{meta.liveClass.trainingType}</Badge>
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)] md:text-3xl">
              Today&apos;s academy command center
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
              <strong className="text-[var(--foreground)]">{meta.liveClass.name}</strong> with{" "}
              {meta.liveClass.coach} · {meta.liveClass.room} · {meta.liveClass.time}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/schedule"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]/35 hover:bg-[var(--surface-hover)]"
              >
                <Clock size={14} />
                View schedule
              </Link>
              <Link
                href="/members?filter=attention"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]/35 hover:bg-[var(--surface-hover)]"
              >
                <ShieldCheck size={14} />
                Review follow-ups
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
            <Link
              href="/tv"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition hover:border-[var(--accent)]/30"
            >
              <p className="text-xs text-[var(--muted)]">Checked in</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--accent)]">
                {meta.checkedInToday}
              </p>
            </Link>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <p className="text-xs text-[var(--muted)]">Class time</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--foreground)]">
                {meta.liveClass.time}
              </p>
            </div>
            <div className="col-span-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:col-span-1">
              <p className="text-xs text-[var(--muted)]">Active roster</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.activeStudents}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Quick actions</p>
          <Badge variant="muted">Owner / coach workflow</Badge>
        </div>
        <QuickActions actions={quickActions} className="rounded-[14px] border border-[var(--border)] bg-[var(--panel)] p-3" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Live class"
          value={meta.liveClass.name}
          icon={Radio}
          tone="live"
          trend={meta.liveClass.room}
          index={0}
        />
        <StatCard
          label="Checked in today"
          value={meta.checkedInToday}
          icon={UserPlus}
          tone="accent"
          trend={`${Math.round((meta.checkedInToday / Math.max(stats.activeStudents, 1)) * 100)}% of active`}
          index={1}
        />
        <StatCard
          label="Weekly attendance"
          value={stats.weeklyAttendance}
          icon={Clock}
          tone="blue"
          trend={`+${stats.weeklyAttendanceChange}% vs last week`}
          index={2}
        />
      </div>
    </section>
  );
}
