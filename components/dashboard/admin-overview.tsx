"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BeltPill } from "@/components/belt-pill";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { beltStyles } from "@/data/academy";
import {
  attendanceTrend,
  beltDistribution,
  coachActions,
  dashboardStats,
  studentsNeedingAttention,
  todayClasses,
} from "@/data/dashboard";

const statCards = [
  { key: "active", label: "Active Students", value: dashboardStats.activeStudents, icon: Users, trend: "+4 this week", tone: "accent" },
  { key: "checked", label: "Checked In Today", value: dashboardStats.checkedInToday, icon: UserCheck, trend: "78% of active", tone: "blue" },
  { key: "weekly", label: "Weekly Attendance", value: dashboardStats.weeklyAttendance, icon: Activity, trend: `+${dashboardStats.weeklyAttendanceChange}% vs last week`, tone: "accent" },
  { key: "inactive", label: "Inactive Students", value: dashboardStats.inactiveStudents, icon: UserX, trend: "6 need outreach", tone: "coral" },
  { key: "new", label: "New This Month", value: dashboardStats.newStudentsThisMonth, icon: UserPlus, trend: "Onboarding pipeline", tone: "blue" },
  { key: "trial", label: "Trial Students", value: dashboardStats.trialStudents, icon: TrendingUp, trend: "3 converting soon", tone: "default" },
  { key: "revenue", label: "Revenue (MTD)", value: dashboardStats.revenueMtd, icon: CircleDollarSign, trend: dashboardStats.revenueChange, tone: "accent" },
  { key: "attention", label: "Need Attention", value: studentsNeedingAttention.length, icon: AlertTriangle, trend: "Low attendance", tone: "coral" },
] as const;

export function AdminOverview() {
  const nextClass = todayClasses.find((c) => c.isNext) ?? todayClasses[0];

  return (
    <section className="space-y-5">
      <SectionHeader
        kicker="Coach & owner"
        title="Admin Overview"
        description="Operational signals for attendance, roster health, classes, and revenue."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity size={18} className="text-[var(--accent)]" />
                Attendance trend
              </CardTitle>
              <CardDescription>Weekly check-ins and sparring volume across the academy.</CardDescription>
            </div>
            <Badge variant="accent">
              <TrendingUp size={14} /> +{dashboardStats.weeklyAttendanceChange}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend}>
                  <defs>
                    <linearGradient id="dashStudents" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#e8ff5f" stopOpacity={0.65} />
                      <stop offset="95%" stopColor="#e8ff5f" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="dashSparring" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#72ddff" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#72ddff" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="day" stroke="#71717a" tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" tickLine={false} axisLine={false} width={32} />
                  <Tooltip contentStyle={{ background: "#111217", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="students" stroke="#e8ff5f" fill="url(#dashStudents)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="sparring" stroke="#72ddff" fill="url(#dashSparring)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock size={18} className="text-[var(--accent-blue)]" />
                Upcoming classes today
              </CardTitle>
              <CardDescription>Next on the floor: {nextClass.name} at {nextClass.time}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayClasses.map((item) => (
              <div
                key={item.time}
                className={`rounded-xl border p-3 transition-colors ${
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
            <Button variant="outline" className="mt-2 w-full" asChild>
              <Link href="/schedule">View full schedule</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Belt distribution</CardTitle>
            <CardDescription>Active roster breakdown by belt rank.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={beltDistribution} layout="vertical" margin={{ left: 4, right: 12 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" stroke="#71717a" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="belt" stroke="#71717a" tickLine={false} axisLine={false} width={56} tickFormatter={(b) => beltStyles[b as keyof typeof beltStyles]?.label ?? b} />
                  <Tooltip contentStyle={{ background: "#111217", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12 }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={14}>
                    {beltDistribution.map((entry) => (
                      <Cell key={entry.belt} fill={beltStyles[entry.belt].hex} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown size={18} className="text-[var(--accent-coral)]" />
              Students needing attention
            </CardTitle>
            <CardDescription>Attendance risk and trial follow-ups.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {studentsNeedingAttention.map((student) => (
              <Link
                key={student.id}
                href={`/members/${student.id}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 transition hover:border-[var(--accent-coral)]/30 hover:bg-[var(--surface)]"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{student.name}</p>
                  <p className="text-xs text-[var(--muted)]">{student.reason}</p>
                </div>
                <BeltPill belt={student.belt} />
              </Link>
            ))}
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/members">View all members</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest admin activity</CardTitle>
            <CardDescription>Recent coach and owner actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {coachActions.map((item) => (
              <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
                <p className="text-sm leading-5 text-[var(--foreground)]">{item.action}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {item.coach} · {item.time}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SectionHeader({ kicker, title, description }: { kicker: string; title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--border)] pb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{kicker}</p>
      <h2 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="max-w-3xl text-sm text-[var(--muted)]">{description}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  trend: string;
  tone: "accent" | "blue" | "coral" | "default";
}) {
  const iconTone = {
    accent: "text-[var(--accent)] bg-[var(--accent)]/12 border-[var(--accent)]/25",
    blue: "text-[var(--accent-blue)] bg-sky-400/10 border-sky-400/20",
    coral: "text-[var(--accent-coral)] bg-rose-400/10 border-rose-400/20",
    default: "text-[var(--muted)] bg-[var(--surface)] border-[var(--border)]",
  }[tone];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className={`grid size-10 place-items-center rounded-xl border ${iconTone}`}>
          <Icon size={18} />
        </div>
        <Badge variant="muted" className="text-[10px]">
          {trend}
        </Badge>
      </div>
      <p className="mt-4 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{label}</p>
    </Card>
  );
}
