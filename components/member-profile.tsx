"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Award, Medal, MessageSquarePlus, TrendingUp, Trophy } from "lucide-react";
import { BeltPill } from "@/components/belt-pill";
import { PromotionCard } from "@/components/oss/promotion-card";
import { SectionHeader } from "@/components/oss/section-header";
import { StripeIndicator } from "@/components/oss/stripe-indicator";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardKicker, CardTitle } from "@/components/ui/card";
import { beltStyles, attendance, type Student } from "@/data/academy";
import { getMemberProfileExtra } from "@/data/member-profiles";
import type { PlatformRole } from "@/data/platform";

export function MemberProfile({ member, viewerRole }: { member: Student; viewerRole: PlatformRole | null }) {
  const extra = getMemberProfileExtra(member.id);
  const canManageProgress = viewerRole === "owner" || viewerRole === "admin" || viewerRole === "coach";
  const canViewCoachNotes = canManageProgress;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-5">
            <StudentAvatar student={member} size="xl" priority />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <BeltPill belt={member.belt} stripes={member.stripes} />
                <Badge>{extra.roleLabel}</Badge>
                {extra.trial && <Badge variant="accent">Trial</Badge>}
                {extra.attendanceRisk === "high" && (
                  <Badge className="border-rose-400/30 bg-rose-400/10 text-rose-300">Needs attention</Badge>
                )}
              </div>
              <h2 className="mt-4 text-3xl font-semibold md:text-4xl">{member.name}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">Primary focus: {member.focus}</p>
              <StripeIndicator stripes={member.stripes} className="mt-3" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManageProgress && (
              <>
                <Button variant="primary" size="sm" className="gap-1.5" asChild>
                  <Link href={`/members?member=${member.id}&filter=promotion`}>
                    <Award size={14} /> Award stripe
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <Link href={`/members?member=${member.id}&filter=promotion`}>
                    <TrendingUp size={14} /> Promote belt
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5" asChild>
                  <Link href={`/members?member=${member.id}`}>
                    <MessageSquarePlus size={14} /> Add note
                  </Link>
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" className="gap-1.5" asChild>
              <Link href="/competitions">
                <Medal size={14} /> Register comp
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [member.classes30, "Classes (30d)"],
            [member.streak, "Streak"],
            [`#${extra.rank}`, "Academy rank"],
            [`${member.wins}-${member.losses}`, "Comp record"],
            [extra.weeklyAttendance, "This week"],
            [member.points, "Points"],
            [member.totalHours, "Total hours"],
            [member.status, "Status"],
          ].map(([value, label]) => (
            <div
              key={String(label)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center"
            >
              <p className="text-xl font-semibold tabular-nums text-[var(--accent)]">{value}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionHeader
            kicker="Progression"
            title="Belt timeline"
            description="Stripes, belts, and promotion moments."
          />
          <div className="mt-6 space-y-4">
            {extra.beltTimeline.length > 0 ? (
              extra.beltTimeline.map((milestone, i) => (
                <motion.div
                  key={`${milestone.belt}-${milestone.date}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative flex gap-4 pl-6 before:absolute before:left-0 before:top-2 before:h-[calc(100%+8px)] before:w-px before:bg-[var(--border)] last:before:hidden"
                >
                  <span
                    className="absolute left-[-5px] top-2 size-2.5 rounded-full ring-2 ring-[var(--background)]"
                    style={{ background: beltStyles[milestone.belt].hex }}
                  />
                  <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <BeltPill belt={milestone.belt} stripes={milestone.stripes} />
                      <span className="text-xs text-[var(--muted)]">{milestone.date}</span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted)]">Awarded by {milestone.awardedBy}</p>
                    {milestone.note && <p className="mt-2 text-sm text-[var(--foreground)]">{milestone.note}</p>}
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">Promotion history will appear here.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Weekly attendance</CardTitle>
              <CardKicker>Academy reference trend</CardKicker>
            </div>
            <Badge>{member.lastSeen}</Badge>
          </CardHeader>
          <div className="flex h-44 items-end gap-2">
            {attendance.map((day) => (
              <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                <motion.div
                  className="w-full rounded-t-lg bg-[var(--accent)]/80"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min(120, day.students * 2)}px` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                />
                <span className="text-xs text-[var(--muted)]">{day.day}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          {canViewCoachNotes ? (
            <>
              <SectionHeader kicker="Coach" title="Notes & focus" description="Private coach observations." />
              <div className="mt-4 space-y-3">
                {extra.coachNotes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                      <span>{note.coach}</span>
                      <span>{note.date}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{note.body}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <SectionHeader kicker="Training" title="Focus" description="Member-visible training context." />
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Current focus</p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{member.focus}</p>
                <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                  Private coach notes are only visible to coaches and academy staff.
                </p>
              </div>
            </>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Achievements</CardTitle>
              <CardKicker>Milestones & badges</CardKicker>
            </div>
            <Trophy size={18} className="text-[var(--accent)]" />
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {extra.achievements.length > 0 ? (
              extra.achievements.map((a) => (
                <Badge key={a} variant="accent">
                  {a}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">No achievements yet.</p>
            )}
          </div>
          {extra.registeredCompetitions.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Competitions</p>
              <div className="mt-3 space-y-2">
                {extra.registeredCompetitions.map((c) => (
                  <div key={c.name} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
                    <p className="font-medium text-[var(--foreground)]">{c.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {c.date} · {c.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {member.id === "st-001" && (
        <PromotionCard
          student={member.name}
          detail="Moved to #2 in academy rankings"
          awardedBy="System"
          when="Yesterday"
          type="ranking"
        />
      )}
    </div>
  );
}
