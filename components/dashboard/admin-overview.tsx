"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BeltPill } from "@/components/belt-pill";
import { SectionHeader } from "@/components/oss/section-header";
import { StatCard } from "@/components/oss/stat-card";
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
  { key: "active", label: "Active members", value: dashboardStats.activeStudents, icon: Users, trend: "+4 this week", tone: "accent" },
  { key: "checked", label: "Checked in today", value: dashboardStats.checkedInToday, icon: UserCheck, trend: "78% of active", tone: "blue" },
  { key: "weekly", label: "Weekly attendance", value: dashboardStats.weeklyAttendance, icon: Activity, trend: `+${dashboardStats.weeklyAttendanceChange}% vs last week`, tone: "accent" },
  { key: "inactive", label: "Needs outreach", value: dashboardStats.inactiveStudents, icon: UserX, trend: "Low attendance", tone: "coral" },
  { key: "new", label: "New members", value: dashboardStats.newStudentsThisMonth, icon: UserPlus, trend: "This month", tone: "blue" },
  { key: "trial", label: "Trial members", value: dashboardStats.trialStudents, icon: TrendingUp, trend: "3 close to joining", tone: "default" },
  { key: "attention", label: "Coach follow-ups", value: studentsNeedingAttention.length, icon: AlertTriangle, trend: "Review today", tone: "coral" },
] as const;

export function AdminOverview() {
  const nextClass = todayClasses.find((c) => c.isNext) ?? todayClasses[0];

  return (
    <section className="space-y-5">
      <SectionHeader
        kicker="Coach & owner"
        title="Academy Overview"
        description="Attendance, roster health, classes, and coach follow-ups for the week."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat, index) => (
          <StatCard key={stat.key} label={stat.label} value={stat.value} icon={stat.icon} trend={stat.trend} tone={stat.tone} index={index} />
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
            <ChartFrame className="h-[280px] min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend}>
                  <defs>
                    <linearGradient id="dashStudents" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.65} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="dashSparring" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--muted)" tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted)" tickLine={false} axisLine={false} width={32} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--panel-strong)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--foreground)",
                    }}
                  />
                  <Area type="monotone" dataKey="students" stroke="var(--accent)" fill="url(#dashStudents)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="sparring" stroke="var(--accent-blue)" fill="url(#dashSparring)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartFrame>
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
            <ChartFrame className="h-[220px] min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={beltDistribution} layout="vertical" margin={{ left: 4, right: 12 }}>
                  <CartesianGrid stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted)" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="belt" stroke="var(--muted)" tickLine={false} axisLine={false} width={56} tickFormatter={(b) => beltStyles[b as keyof typeof beltStyles]?.label ?? b} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--panel-strong)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={14}>
                    {beltDistribution.map((entry) => (
                      <Cell key={entry.belt} fill={beltStyles[entry.belt].hex} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
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
            <CardTitle className="text-base">Recent coach notes</CardTitle>
            <CardDescription>Small moments worth keeping visible.</CardDescription>
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

function ChartFrame({ children, className }: { children: React.ReactNode; className: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`${className} min-w-0 w-full`}>
      {mounted ? children : <div className="size-full rounded-xl bg-[var(--surface)]" />}
    </div>
  );
}
