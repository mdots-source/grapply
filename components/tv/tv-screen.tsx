"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Clock, Flame, MapPin, RadioTower, UserRound } from "lucide-react";
import { BeltPill } from "@/components/belt-pill";
import { LiveTicker } from "@/components/oss/live-ticker";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { beltStyles, currentSession, tvCheckedInAthletes, type TvCheckedInAthlete } from "@/data/academy";
import { tvTickerItems } from "@/data/academy-meta";
import { getAppUrl } from "@/lib/app-url";

const VISIBLE_COUNT = 6;
const ROTATION_MS = 4200;

function formatLiveClock(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m on the mat`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m on the mat` : `${hours}h on the mat`;
}

export function TvScreen() {
  const [now, setNow] = useState(() => new Date());
  const [rotationIndex, setRotationIndex] = useState(0);

  const athletes = tvCheckedInAthletes;

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (athletes.length <= VISIBLE_COUNT) return;
    const rotate = setInterval(() => {
      setRotationIndex((value) => (value + 1) % athletes.length);
    }, ROTATION_MS);
    return () => clearInterval(rotate);
  }, [athletes.length]);

  const visibleAthletes = useMemo(() => {
    if (athletes.length <= VISIBLE_COUNT) return athletes;
    return Array.from({ length: VISIBLE_COUNT }, (_, slot) => athletes[(rotationIndex + slot) % athletes.length]);
  }, [athletes, rotationIndex]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#020203] text-zinc-50">
      <div className="relative min-h-screen p-4 md:p-6 lg:p-8">
        <motion.div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(167,139,250,0.18),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]"
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] max-w-[1800px] flex-col">
          <SessionHeader now={now} checkedInCount={athletes.length} />

          <section className="mt-6 flex flex-1 flex-col rounded-[20px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl md:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">On the mat now</p>
                <h2 className="mt-1 text-3xl font-black text-zinc-50 md:text-4xl">Active athletes</h2>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="accent" className="gap-2 px-3 py-1.5 text-sm">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--accent)] opacity-70" />
                    <span className="relative inline-flex size-2 rounded-full bg-[var(--accent)]" />
                  </span>
                  {athletes.length} checked in
                </Badge>
                {athletes.length > VISIBLE_COUNT && (
                  <span className="text-xs text-zinc-500">Rotating roster · updates every few seconds</span>
                )}
              </div>
            </div>

            <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              {visibleAthletes.map((athlete, slot) => (
                <AthleteCard key={`${athlete.id}-${rotationIndex}`} athlete={athlete} slot={slot} />
              ))}
            </div>
          </section>

          <div className="mt-4">
            <LiveTicker items={tvTickerItems} />
          </div>
        </div>
      </div>
    </main>
  );
}

function SessionHeader({ now, checkedInCount }: { now: Date; checkedInCount: number }) {
  const liveTime = formatLiveClock(now);

  return (
    <header className="rounded-[20px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl md:p-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_auto]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="accent" className="gap-2">
              <RadioTower size={14} />
              Live mat display
            </Badge>
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/35 bg-[var(--accent)]/10 px-4 py-1.5 font-mono text-lg font-bold text-[var(--accent)]"
              animate={{ boxShadow: ["0 0 0 rgba(167,139,250,0)", "0 0 24px rgba(167,139,250,0.22)", "0 0 0 rgba(167,139,250,0)"] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-[var(--accent)]" />
              </span>
              {liveTime} LIVE
            </motion.div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>{currentSession.trainingType}</Badge>
            <Badge variant="default">{currentSession.experienceLevel}</Badge>
            <Badge className="border-violet-400/25 bg-violet-400/10 text-violet-200">{currentSession.category}</Badge>
          </div>

          <div>
            <h1 className="text-4xl font-black leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">{currentSession.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-400 md:text-base">
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} className="text-[var(--accent)]" />
                {currentSession.room}
              </span>
              <span>Coach {currentSession.coach}</span>
              <span className="inline-flex items-center gap-2">
                <Clock size={16} className="text-[var(--accent-blue)]" />
                Live now — {currentSession.time} to {currentSession.endTime}
              </span>
              <span>{currentSession.durationMinutes} min session</span>
            </div>
          </div>

          <div className="max-w-3xl rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Today&apos;s focus</p>
            <p className="mt-2 text-lg font-semibold leading-relaxed text-zinc-100">{currentSession.focus}</p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 xl:w-[400px]">
          <motion.div
            className="relative rounded-2xl border border-[var(--accent)]/30 bg-black/50 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            animate={{ boxShadow: ["0 0 0 rgba(167,139,250,0)", "0 0 40px rgba(167,139,250,0.18)", "0 0 0 rgba(167,139,250,0)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <p className="text-center text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent)]">Scan to check in</p>
            <div className="relative mx-auto mt-4 w-fit">
              <motion.span
                className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-[var(--accent)]/40"
                animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
                transition={{ duration: 2.2, repeat: Infinity }}
              />
              <div className="rounded-2xl bg-white p-4">
                <QRCodeSVG
                  value={getAppUrl(`/login?session=${currentSession.id}`)}
                  size={148}
                  bgColor="#ffffff"
                  fgColor="#050507"
                  level="M"
                />
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-zinc-400">Join {currentSession.name} on the academy floor</p>
          </motion.div>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Checked in" value={checkedInCount.toString()} />
            <StatTile label="Session type" value={currentSession.trainingType} />
          </div>
        </div>
      </div>
    </header>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function AthleteCard({ athlete, slot }: { athlete: TvCheckedInAthlete; slot: number }) {
  const beltColor = beltStyles[athlete.belt].hex;

  return (
    <motion.article
      layout
      className="relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 p-5 md:min-h-[360px]"
      style={{
        background: `linear-gradient(155deg, rgba(255,255,255,.12) 0%, ${beltColor}40 42%, rgba(8,9,12,.92) 100%)`,
        boxShadow: `0 0 40px ${beltColor}22, inset 0 1px 0 rgba(255,255,255,.08)`,
      }}
    >
      <motion.div
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full blur-3xl"
        style={{ background: beltColor }}
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.06, 1] }}
        transition={{ duration: 3.5 + slot * 0.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={athlete.id}
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex h-full flex-col justify-between"
        >
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.12] to-transparent" />

          <div className="relative flex items-start justify-between gap-2">
            <Badge variant="accent" className="gap-1.5 text-[10px] uppercase tracking-wider">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-zinc-950 opacity-80" />
                <span className="relative inline-flex size-1.5 rounded-full bg-zinc-950" />
              </span>
              Active now
            </Badge>
            <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 font-mono text-[10px] text-zinc-400">
              {formatDuration(athlete.checkedInMinutes)}
            </span>
          </div>

          <StudentAvatar
            student={athlete}
            size="xl"
            priority
            className="relative mx-auto mt-2 size-[7.5rem] rounded-[26px] md:size-[8.5rem]"
          />

          <div className="relative mt-4">
            <p className="line-clamp-2 text-3xl font-black leading-[1.02] tracking-tight md:text-[2rem]">{athlete.name}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <BeltPill belt={athlete.belt} stripes={athlete.stripes} className="px-4 py-1.5 text-sm" />
              {athlete.streak >= 3 && (
                <Badge className="gap-1 border-[var(--accent-coral)]/30 bg-[var(--accent-coral)]/15 text-[var(--accent-coral)]">
                  <Flame size={12} />
                  {athlete.streak} streak
                </Badge>
              )}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
              <UserRound size={13} />
              {athlete.focus}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.article>
  );
}
