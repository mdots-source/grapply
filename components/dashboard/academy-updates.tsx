"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  CalendarDays,
  Flame,
  MapPin,
  Megaphone,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { students } from "@/data/academy";
import { competitions } from "@/data/competitions";
import { announcements, communityHighlights, lastTrainingSession, promotions } from "@/data/dashboard";

export function AcademyUpdates() {
  const upcoming = competitions.slice(0, 3);
  const topParticipant = students.find((s) => s.id === lastTrainingSession.topParticipant.id);

  return (
    <section className="space-y-5 pt-2">
      <div className="flex flex-col gap-1 border-b border-[var(--border)] pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-blue)]">Community</p>
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Academy Updates</h2>
        <p className="max-w-3xl text-sm text-[var(--muted)]">
          News, training recaps, competitions, promotions, and highlights that make the gym feel alive.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame size={18} className="text-[var(--accent)]" />
                Last training session
              </CardTitle>
              <CardDescription>
                {lastTrainingSession.date} · {lastTrainingSession.time}
              </CardDescription>
            </div>
            <Badge variant="accent">{lastTrainingSession.attendance} attended</Badge>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-transparent p-5">
              <h3 className="text-2xl font-semibold text-[var(--foreground)]">{lastTrainingSession.className}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">Coach {lastTrainingSession.coach}</p>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Yesterday&apos;s <strong className="text-[var(--foreground)]">{lastTrainingSession.className}</strong> class had{" "}
                <strong className="text-[var(--accent)]">{lastTrainingSession.attendance} students</strong>.{" "}
                {lastTrainingSession.summary}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Most active</p>
                  <div className="mt-3 flex items-center gap-3">
                    {topParticipant && <StudentAvatar student={topParticipant} size="sm" />}
                    <div>
                      <p className="text-sm font-semibold">{lastTrainingSession.topParticipant.name}</p>
                      <p className="text-xs text-[var(--muted)]">{lastTrainingSession.topParticipant.note}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Sparring highlight</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{lastTrainingSession.sparringHighlight}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy size={18} className="text-[var(--accent)]" />
                Upcoming competitions
              </CardTitle>
              <CardDescription>Synced with the Competitions section.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge className="mb-2">{event.status}</Badge>
                    <p className="font-semibold text-[var(--foreground)]">{event.name}</p>
                  </div>
                  <span className="font-mono text-lg text-[var(--accent)]">{event.registered_students.length}</span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <CalendarDays size={14} /> {event.date}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <MapPin size={14} /> {event.location}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">{event.registered_students.length} registered athletes · closes {event.registration_deadline}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{event.notes}</p>
                <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                  <Link href="/competitions">Manage registration</Link>
                </Button>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award size={18} className="text-violet-300" />
              Recent promotions
            </CardTitle>
            <CardDescription>Stripes, belts, rankings, and achievements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {promotions.map((item) => (
              <div key={item.id} className="rounded-xl border border-[var(--border)] bg-gradient-to-r from-violet-500/10 to-transparent p-4">
                <p className="text-sm leading-6 text-[var(--foreground)]">
                  Congrats to <strong className="text-[var(--foreground)]">{item.student}</strong> — {item.detail.toLowerCase()}.
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Awarded by {item.awardedBy} · {item.when}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone size={18} className="text-[var(--accent-blue)]" />
              Academy announcements
            </CardTitle>
            <CardDescription>Schedule, open mat, and competition prep.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.map((item) => (
              <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="accent">{item.tag}</Badge>
                  <span className="text-xs text-[var(--muted)]">{item.when}</span>
                </div>
                <p className="mt-3 font-semibold text-[var(--foreground)]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles size={18} className="text-[var(--accent)]" />
              Community highlights
            </CardTitle>
            <CardDescription>Streaks, activity, growth, and rankings.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {communityHighlights.map((item) => (
              <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-[var(--accent)]">{item.value}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Users size={14} className="text-[var(--muted)]" />
                  {item.member}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
