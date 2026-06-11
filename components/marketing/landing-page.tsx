"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  CalendarDays,
  Check,
  CreditCard,
  Flame,
  Gamepad2,
  Layers3,
  Medal,
  MessageCircle,
  MonitorPlay,
  Network,
  Radio,
  Sparkles,
  Trophy,
  UserCog,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand-logo";
import { StudentAvatar } from "@/components/student-avatar";
import { academyMeta } from "@/data/academy-meta";
import { attendance, beltStyles, currentSession, recentActivity, schedule, students, tvCheckedInAthletes } from "@/data/academy";
import { beltDistribution, communityHighlights, promotions } from "@/data/dashboard";
import { competitions } from "@/data/competitions";
import { trainingPosts, typeLabels } from "@/data/training-feed";
import { cn } from "@/lib/utils";

const rankedMembers = [...students].sort((a, b) => b.points - a.points);
const activeMembers = students.filter((student) => student.status === "active");
const maxAttendance = Math.max(...attendance.map((item) => item.students));
const maxBeltCount = Math.max(...beltDistribution.map((item) => item.count));

const productScreens = [
  {
    id: "members",
    label: "Members",
    icon: Users,
    title: "Member workspace",
    copy: "Belt, role, focus, attendance, hours, points, and coach notes in one view.",
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: CalendarDays,
    title: "Class operations",
    copy: "Rooms, coaches, belt eligibility, and class flow designed for fast front-desk scanning.",
  },
  {
    id: "rankings",
    label: "Rankings",
    icon: Trophy,
    title: "Rankings",
    copy: "Points, wins, streaks, and leaderboard standings for members.",
  },
  {
    id: "tv",
    label: "TV mode",
    icon: MonitorPlay,
    title: "Live academy display",
    copy: "A mat-side screen for check-ins, athlete cards, and session focus.",
  },
  {
    id: "roles",
    label: "Roles",
    icon: UserCog,
    title: "Team permissions",
    copy: "Owner, admin, coach, and member access for real academy operations.",
  },
] as const;

const beltOrbitItems = [
  { belt: "white", transform: "translate(-50%, -50%) translate(96px, -12px) rotate(2deg)" },
  { belt: "blue", transform: "translate(-50%, -50%) translate(33px, 94px) rotate(21deg)" },
  { belt: "purple", transform: "translate(-50%, -50%) translate(-92px, 55px) rotate(38deg)" },
  { belt: "brown", transform: "translate(-50%, -50%) translate(-94px, -54px) rotate(58deg)" },
  { belt: "black", transform: "translate(-50%, -50%) translate(30px, -98px) rotate(75deg)" },
] as const satisfies { belt: keyof typeof beltStyles; transform: string }[];

const features = [
  { icon: Users, title: "Member management", copy: "Profiles, belts, stripes, attendance, status, training hours, and focus areas." },
  { icon: CalendarDays, title: "Class schedule", copy: "Classes, rooms, coaches, levels, and daily flow in one clean operational surface." },
  { icon: Award, title: "Belt system", copy: "Progression, promotion watch, stripes, and rank history." },
  { icon: UserCog, title: "Coach/admin roles", copy: "Permissions and workspace roles for owners, admins, coaches, and members." },
  { icon: MonitorPlay, title: "Academy TV display", copy: "A live screen for check-ins, session focus, and current attendance." },
  { icon: MessageCircle, title: "Training feed", copy: "Session recaps, announcements, milestones, and member updates." },
  { icon: Medal, title: "Competitions & camps", copy: "Rosters, deadlines, travel details, and event planning." },
  { icon: Network, title: "Integrations", copy: "Strava scaffolding and room for future academy integrations." },
];

const pricingPlans = [
  {
    name: "White Belt",
    price: "$100",
    suffix: "/mo",
    accent: beltStyles.white.hex,
    description: "For small academies that need the core tools.",
    cta: "Book demo",
    featured: false,
    items: ["Member directory", "Schedule management", "Rankings", "Basic dashboard", "Mock TV preview", "Email support"],
  },
  {
    name: "Blue Belt",
    price: "$200",
    suffix: "/mo",
    accent: beltStyles.blue.hex,
    description: "For academies that need more daily tools.",
    cta: "Book demo",
    featured: true,
    items: ["Everything in White Belt", "Advanced academy dashboard", "TV display mode", "Training activity feed", "Priority support", "Product preview/demo setup"],
  },
  {
    name: "Purple Belt",
    price: "$400",
    suffix: "/mo",
    accent: beltStyles.purple.hex,
    description: "For teams managing roles, events, and member activity.",
    cta: "Book demo",
    featured: false,
    items: ["Everything in Blue Belt", "Coach/admin roles", "Competitions and camps", "Advanced permissions", "Custom academy setup", "Priority feature input"],
  },
  {
    name: "Black Belt",
    price: "Custom",
    suffix: "",
    accent: beltStyles.black.hex,
    description: "For larger academies and multi-club teams.",
    cta: "Talk to us",
    featured: false,
    items: ["Multi-club support", "Custom onboarding", "Advanced permissions", "Integrations", "Custom reports", "Dedicated support", "Feature planning support"],
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header />
      <Hero />
      <OutcomeStrip />
      <ProductPreview />
      <LiveAcademySection />
      <TvShowcaseSection />
      <ProgressionFeedSection />
      <FeatureSection />
      <ControlRoomSection />
      <CompetitionSection />
      <PricingSection />
      <CredibilitySection />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_86%,transparent)] backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <BrandLogo className="size-10 shadow-[var(--glow-accent)]" priority />
          <span className="min-w-0">
            <span className="block text-sm font-black tracking-[0.18em]">Grapply</span>
            <span className="block truncate text-xs text-[var(--muted)]">Jiu-Jitsu Academy</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {[
            ["Product", "#product"],
            ["Features", "#features"],
            ["Pricing", "#pricing"],
            ["Demo", "#demo"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)] sm:inline-flex">
            Login
          </Link>
          <a href="#demo" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition hover:-translate-y-0.5">
            Book demo <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border)]">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_38%,color-mix(in_srgb,var(--accent-blue)_8%,transparent))]" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:px-8 lg:py-20">
        <div className="relative z-10">
          <Badge variant="accent" className="mb-5">
            <Gamepad2 size={13} />
            BJJ academy workspace
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.03] tracking-normal sm:text-6xl lg:text-7xl">
            Run your Jiu-Jitsu academy from one workspace.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
            Members, classes, rankings, roles, training activity, and live academy displays in one workspace.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="#demo" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-foreground)] transition hover:-translate-y-0.5">
              Book demo <ArrowRight size={16} />
            </a>
            <a href="#product" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 text-sm font-semibold transition hover:bg-[var(--surface-hover)]">
              View product preview <MonitorPlay size={16} />
            </a>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <Metric value={academyMeta.memberCount} label="Members" />
            <Metric value={academyMeta.checkedInToday} label="Today" accent />
            <Metric value={schedule.length} label="Classes" />
          </div>
        </div>

        <HeroCommandScene />
      </div>
    </section>
  );
}

function HeroCommandScene() {
  return (
    <div className="relative z-10 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] p-2 shadow-[var(--shadow)] sm:p-3">
      <div className="relative min-h-[720px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] [perspective:1200px] sm:min-h-[560px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,color-mix(in_srgb,var(--accent)_18%,transparent),transparent_31%),radial-gradient(circle_at_82%_72%,color-mix(in_srgb,var(--accent-blue)_16%,transparent),transparent_28%),linear-gradient(135deg,color-mix(in_srgb,var(--accent)_9%,transparent),transparent_42%,color-mix(in_srgb,var(--foreground)_4%,transparent))]" />
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--panel)_86%,transparent),transparent)]" />
        <div className="absolute inset-y-0 left-1/2 hidden w-px bg-[linear-gradient(180deg,transparent,color-mix(in_srgb,var(--accent)_34%,transparent),transparent)] sm:block" />
        <div className="absolute -bottom-8 inset-x-3 h-72 origin-bottom rounded-lg border border-[color-mix(in_srgb,var(--accent-blue)_18%,var(--border))] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--foreground)_8%,transparent)_1px,transparent_1px),linear-gradient(0deg,color-mix(in_srgb,var(--accent)_12%,transparent)_1px,transparent_1px)] bg-[length:34px_34px] opacity-80 [transform:rotateX(64deg)] sm:inset-x-8 sm:-bottom-4 sm:h-80" />

        <div className="absolute inset-x-3 top-3 z-30 flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_86%,transparent)] px-3 py-2 shadow-[var(--shadow)] backdrop-blur-xl sm:inset-x-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex shrink-0 gap-1.5">
              <span className="size-2 rounded-full bg-[var(--accent)]" />
              <span className="size-2 rounded-full bg-[var(--accent-blue)]" />
              <span className="size-2 rounded-full bg-[var(--status-success)]" />
            </span>
            <span className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Academy live operations</span>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--status-success)_28%,transparent)] bg-[color-mix(in_srgb,var(--status-success)_9%,transparent)] px-3 py-1 text-[11px] font-semibold text-[var(--status-success)] sm:flex">
            <span className="size-1.5 rounded-full bg-[var(--status-success)] shadow-[0_0_18px_color-mix(in_srgb,var(--status-success)_80%,transparent)]" />
            {academyMeta.checkedInToday} checked in
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18, rotateY: 10 }}
          animate={{ opacity: 1, y: 0, rotateY: 8 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute left-4 right-4 top-16 z-20 rounded-lg border border-[color-mix(in_srgb,var(--accent)_26%,var(--border))] bg-[color-mix(in_srgb,var(--panel)_88%,transparent)] p-4 shadow-[var(--shadow)] backdrop-blur-xl [transform-style:preserve-3d] sm:left-6 sm:right-auto sm:top-[72px] sm:w-60"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Live class</p>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">{currentSession.room}</span>
          </div>
          <h3 className="mt-3 text-2xl font-semibold leading-tight">{currentSession.name}</h3>
          <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{currentSession.focus}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs tabular-nums text-[var(--muted)]">{currentSession.time} - {currentSession.endTime}</span>
            <span className="flex -space-x-1">
              {(["blue", "purple", "brown", "black"] as const).map((belt) => (
                <span key={belt} className="size-4 rounded-full border border-[var(--background)]" style={{ backgroundColor: beltStyles[belt].hex }} />
              ))}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18, rotateY: -10 }}
          animate={{ opacity: 1, y: 0, rotateY: -8 }}
          transition={{ duration: 0.75, delay: 0.08, ease: "easeOut" }}
          className="absolute left-4 right-4 top-[232px] z-20 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_90%,transparent)] p-3 shadow-[var(--shadow)] backdrop-blur-xl [transform-style:preserve-3d] sm:left-auto sm:right-6 sm:top-[78px] sm:w-60"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Leaderboard</p>
            <Trophy size={16} className="text-[var(--accent)]" />
          </div>
          <div className="mt-3 space-y-2">
            {rankedMembers.slice(0, 3).map((member, index) => (
              <div key={member.id} className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-xs font-semibold text-[var(--accent)]">{index + 1}</span>
                <StudentAvatar student={member} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{member.name}</p>
                  <p className="text-[11px] capitalize text-[var(--muted)]">{member.belt} belt</p>
                </div>
                <span className="ml-auto text-[11px] font-semibold tabular-nums text-[var(--muted)]">{member.points}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="absolute left-1/2 top-[455px] z-10 size-52 -translate-x-1/2 -translate-y-1/2 sm:top-[276px] sm:size-64">
          <motion.div
            animate={{ scale: [1, 1.04, 1], opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border border-[color-mix(in_srgb,var(--accent)_34%,transparent)]"
          />
          <div className="absolute inset-8 rounded-full border border-[color-mix(in_srgb,var(--accent-blue)_24%,transparent)] bg-[radial-gradient(circle,color-mix(in_srgb,var(--panel)_82%,transparent),transparent_70%)]" />
          <BeltOrbit />
          <div aria-label="Live class snapshot" className="absolute left-1/2 top-1/2 w-36 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] p-3 text-center shadow-[var(--shadow)] backdrop-blur-xl sm:w-40 sm:p-4">
            <div className="mx-auto grid size-9 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]">
              <Radio size={18} />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--accent)]">On mat</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-left">
              <SceneMiniMetric value={activeMembers.length} label="Active" />
              <SceneMiniMetric value={academyMeta.checkedInToday} label="Today" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-20 sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-[400px] sm:-translate-x-1/2">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.14, ease: "easeOut" }}
            className="rounded-lg border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_9%,var(--panel))] p-3 shadow-[var(--shadow)] backdrop-blur-xl sm:p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <Badge variant="success">Live class</Badge>
              <span className="text-xs tabular-nums text-[var(--muted)]">{currentSession.time} - {currentSession.endTime}</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {tvCheckedInAthletes.slice(0, 4).map((member) => (
                <div key={member.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
                  <StudentAvatar student={member} size="sm" />
                  <p className="mt-2 truncate text-xs font-semibold">{member.name.split(" ")[0]}</p>
                  <span className="mt-2 block h-1 rounded-full" style={{ backgroundColor: beltStyles[member.belt].hex }} />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function BeltOrbit() {
  return (
    <div className="absolute inset-0">
      {beltOrbitItems.map((item) => {
        return (
          <span
            key={item.belt}
            className="absolute left-1/2 top-1/2 h-3 w-16 rounded-full border border-[color-mix(in_srgb,var(--foreground)_18%,transparent)] shadow-[0_12px_38px_color-mix(in_srgb,var(--background)_70%,transparent)] sm:w-[72px]"
            style={{
              backgroundColor: beltStyles[item.belt].hex,
              transform: item.transform,
            }}
          />
        );
      })}
    </div>
  );
}

function SceneMiniMetric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5">
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
    </div>
  );
}

function OutcomeStrip() {
  return (
    <section className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:px-6 md:grid-cols-3 lg:px-8">
        {[
          ["More attendance", "Streaks, check-ins, and member activity stay visible every week."],
          ["Team visibility", "The room sees who is training, competing, improving, and showing up."],
          ["Cleaner workflows", "TV, mobile, and front-desk screens use the same member data."],
        ].map(([title, copy]) => (
          <motion.div key={title} whileHover={{ y: -3 }} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <section id="product" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <Kicker icon={Layers3}>Product preview</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">A product you can feel, not another admin table.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            The MVP already has the surfaces an academy owner expects to touch: members, schedule, rankings, TV mode, and team roles.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {productScreens.map((screen) => {
              const Icon = screen.icon;
              return (
                <a
                  key={screen.id}
                  href={`#preview-${screen.id}`}
                  className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-left text-[var(--muted)] transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--accent)_34%,transparent)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <Icon size={18} />
                  <span className="text-sm font-semibold">{screen.label}</span>
                </a>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {productScreens.map((screen) => (
            <ProductSurface key={screen.id} screen={screen} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductSurface({ screen }: { screen: (typeof productScreens)[number] }) {
  const Icon = screen.icon;
  return (
    <motion.article
      id={`preview-${screen.id}`}
      whileHover={{ y: -4 }}
      className="scroll-mt-24 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 shadow-[var(--shadow)]"
    >
      <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">{screen.label}</p>
            <h3 className="mt-2 text-2xl font-semibold">{screen.title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{screen.copy}</p>
          </div>
          <div className="grid size-12 place-items-center rounded-lg bg-[var(--surface)] text-[var(--accent)]">
            <Icon size={24} />
          </div>
        </div>
        {screen.id === "schedule" && <SchedulePreview />}
        {screen.id === "rankings" && <RankingsPreview />}
        {screen.id === "tv" && <TvPanel compact />}
        {screen.id === "roles" && <RolesPreview />}
        {screen.id === "members" && <MembersPreview />}
      </div>
    </motion.article>
  );
}

function LiveAcademySection() {
  return (
    <section className="border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <div>
          <Kicker icon={Flame}>Attendance & community</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Track attendance and member activity.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Grapply keeps attendance, streaks, and training updates visible to the team.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {communityHighlights.map((item) => (
              <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                <p className="mt-1 text-sm text-[var(--accent)]">{item.member}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Weekly attendance</p>
              <h3 className="mt-2 text-2xl font-semibold">312 visits this week</h3>
            </div>
            <Badge variant="success">+12%</Badge>
          </div>
          <AttendanceChart />
          <div className="mt-5 grid gap-2">
            {recentActivity.slice(0, 4).map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                <span className="size-2 rounded-full bg-[var(--status-success)]" />
                <p className="text-sm text-[var(--muted)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AttendanceChart() {
  return (
    <div className="mt-6 flex h-48 items-end gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
      {attendance.map((item) => (
        <div key={item.day} className="flex h-full flex-1 flex-col justify-end gap-2">
          <motion.div
            initial={{ opacity: 0.55, scaleY: 0.72 }}
            whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 0.7 }}
            className="min-h-6 origin-bottom rounded-t-lg bg-[linear-gradient(180deg,var(--accent),color-mix(in_srgb,var(--accent-blue)_66%,var(--accent)))]"
            style={{ height: `${(item.students / maxAttendance) * 100}%` }}
          />
          <p className="text-center text-[11px] font-semibold text-[var(--muted)]">{item.day}</p>
        </div>
      ))}
    </div>
  );
}

function TvShowcaseSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.82fr] lg:items-center lg:px-8">
      <TvPanel />
      <div>
        <Kicker icon={Radio}>TV screen</Kicker>
        <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">A mat-side display for live classes.</h2>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          Students check in, appear on screen, and see the current session details in real time.
        </p>
        <div className="mt-6 grid gap-3">
          {["Live check-ins on the academy screen", "Session focus and coach context", "Athlete cards with belt color and training momentum"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm">
              <MonitorPlay size={16} className="text-[var(--accent)]" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProgressionFeedSection() {
  return (
    <section className="border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8">
        <div>
          <Kicker icon={Award}>Progression & feed</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Turn training into visible progression.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Promotions, stripes, activity posts, competition prep, and streaks become a shared academy timeline.
          </p>
          <div className="mt-6 space-y-3">
            {promotions.map((promotion) => (
              <div key={promotion.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-sm font-semibold">{promotion.student}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{promotion.detail}</p>
                <p className="mt-2 text-xs text-[var(--accent)]">{promotion.awardedBy} · {promotion.when}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          <BeltDistribution />
          <TrainingFeed />
        </div>
      </div>
    </section>
  );
}

function FeatureSection() {
  return (
    <section id="features" className="scroll-mt-24 border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Kicker icon={Zap}>Features</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Core tools for daily academy work.</h2>
        </div>
        <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} whileHover={{ y: -4 }} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
                <div className="grid size-10 place-items-center rounded-lg bg-[var(--surface)] text-[var(--accent)]">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{feature.copy}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ControlRoomSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
      <ControlRoomVisual />
      <div>
        <Kicker icon={Gamepad2}>Academy control room</Kicker>
        <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Daily class data in one place.</h2>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          Grapply connects classes, rankings, belts, competition prep, and TV display data.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {["Floating class schedule", "Belt progression orbit", "Live leaderboard", "Athlete check-in cards"].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm">
              <Check size={15} className="text-[var(--status-success)]" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ControlRoomVisual() {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 shadow-[var(--shadow)]">
      <div className="relative min-h-[480px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] [perspective:1000px]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_10%,transparent),transparent_38%,color-mix(in_srgb,var(--accent-blue)_10%,transparent))]" />
        <div className="absolute inset-x-10 bottom-2 h-64 origin-bottom rounded-lg border border-[var(--border)] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--foreground)_9%,transparent)_1px,transparent_1px),linear-gradient(0deg,color-mix(in_srgb,var(--accent)_10%,transparent)_1px,transparent_1px)] bg-[length:34px_34px] [transform:rotateX(64deg)]" />
        <div className="absolute left-8 top-10 w-56 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)] [transform:rotateY(16deg)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Today</p>
          <div className="mt-3 space-y-2">
            {schedule.slice(0, 3).map((item) => (
              <div key={item.name} className="rounded-lg bg-[var(--surface)] px-3 py-2">
                <p className="text-sm font-semibold">{item.time} · {item.name}</p>
                <p className="text-xs text-[var(--muted)]">{item.room}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute right-8 top-12 w-56 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)] [transform:rotateY(-16deg)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Competition roster</p>
          {competitions.slice(0, 2).map((event) => (
            <div key={event.id} className="mt-3 rounded-lg bg-[var(--surface)] p-3">
              <p className="text-sm font-semibold">{event.name}</p>
              <p className="text-xs text-[var(--muted)]">{event.registered_students.length} athletes · {event.status}</p>
            </div>
          ))}
        </div>
        <div className="absolute bottom-12 left-1/2 w-72 -translate-x-1/2 rounded-lg border border-[color-mix(in_srgb,var(--accent)_32%,transparent)] bg-[color-mix(in_srgb,var(--accent)_9%,var(--panel))] p-4 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Belt progression</p>
            <Award size={16} className="text-[var(--accent)]" />
          </div>
          <div className="mt-4 space-y-3">
            {beltDistribution.slice(0, 5).map((item) => (
              <div key={item.belt} className="flex items-center gap-3">
                <BeltLabel belt={item.belt} />
                <div className="h-2 flex-1 rounded-full bg-[var(--surface)]">
                  <div className="h-full rounded-full" style={{ width: `${(item.count / maxBeltCount) * 100}%`, backgroundColor: beltStyles[item.belt].hex }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompetitionSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <Kicker icon={Medal}>Competitions & camps</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Competition planning belongs next to training.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Rosters, deadlines, travel details, and team moments stay connected to the same athletes, rankings, and training feed.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {competitions.map((event) => (
            <motion.article key={event.id} whileHover={{ y: -4 }} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{event.type}</p>
                  <h3 className="mt-2 text-xl font-semibold">{event.name}</h3>
                </div>
                <Badge variant={event.status === "Registration open" ? "success" : "muted"}>{event.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">{event.date} · {event.city}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{event.registered_students.length} registered athletes · deadline {event.registration_deadline}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-24 border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Kicker icon={CreditCard}>Pricing</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Pricing that follows the belt system.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">Start with members and scheduling, then add TV, roles, feed, competitions, and network support.</p>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pricingPlans.map((plan) => (
            <motion.div
              key={plan.name}
              whileHover={{ y: -4 }}
              className={cn("relative rounded-lg border bg-[var(--panel)] p-5", plan.featured ? "border-[color-mix(in_srgb,var(--accent)_48%,transparent)] shadow-[var(--glow-accent)]" : "border-[var(--border)]")}
            >
              {plan.featured && <Badge variant="accent" className="mb-4">Most popular</Badge>}
              <div className="mb-4 h-1.5 rounded-full" style={{ backgroundColor: plan.accent }} />
              <h3 className="text-2xl font-semibold">{plan.name}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-[var(--muted)]">{plan.description}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-semibold">{plan.price}</span>
                {plan.suffix && <span className="pb-1 text-sm text-[var(--muted)]">{plan.suffix}</span>}
              </div>
              <a href="#demo" className={cn("mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition hover:-translate-y-0.5", plan.featured ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "border border-[var(--border)] bg-[var(--surface)]")}>
                {plan.cta} <ArrowRight size={16} />
              </a>
              <div className="mt-5 space-y-3">
                {plan.items.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                    <Check size={15} className="mt-0.5 shrink-0 text-[var(--status-success)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CredibilitySection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-5 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-7 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
        <div>
          <Kicker icon={Sparkles}>Demo available now</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">Built around real BJJ workflows.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Grapply is built for academy owners, coaches, and teams managing members, belts, classes, rankings, and mat-side displays.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Owners", "Cleaner member, schedule, and role management."],
            ["Coaches", "Context before class: attendance, focus, promotions, prep."],
            ["Members", "Visible progression, rankings, and academy moments."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section id="demo" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-12 sm:px-6 lg:px-8">
      <div className="grid gap-6 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)] sm:p-8 lg:grid-cols-[1fr_0.78fr] lg:items-center">
        <div>
          <Badge variant="accent" className="mb-4">
            Demo
          </Badge>
          <h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">See how Grapply fits your academy.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Book a walkthrough and see the member, schedule, ranking, and TV workflows.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href="mailto:demo@grapply.app?subject=Grapply%20demo%20request" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-foreground)] transition hover:-translate-y-0.5">
              Book demo <ArrowRight size={16} />
            </a>
            <Link href="/clubs" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 text-sm font-semibold transition hover:bg-[var(--surface-hover)]">
              Open MVP preview
            </Link>
          </div>
        </div>
        <LiveClassCard />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--border)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo className="size-9" />
          <span>Grapply · Built for Brazilian Jiu-Jitsu academies.</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <a href="#product" className="hover:text-[var(--foreground)]">Product</a>
          <a href="#pricing" className="hover:text-[var(--foreground)]">Pricing</a>
          <a href="#demo" className="hover:text-[var(--foreground)]">Demo</a>
          <a href="mailto:demo@grapply.app" className="hover:text-[var(--foreground)]">Contact</a>
        </div>
      </div>
    </footer>
  );
}

function MembersPreview() {
  return (
    <div className="mt-4 grid gap-3">
      {activeMembers.slice(0, 5).map((member) => (
        <div key={member.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="flex min-w-0 items-center gap-3">
            <StudentAvatar student={member} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{member.name}</p>
              <p className="text-xs text-[var(--muted)]">{member.focus}</p>
            </div>
          </div>
          <BeltLabel belt={member.belt} />
          <p className="hidden text-sm tabular-nums text-[var(--muted)] sm:block">{member.totalHours}h</p>
        </div>
      ))}
    </div>
  );
}

function SchedulePreview() {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {schedule.map((item) => (
        <div key={item.name} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-semibold tabular-nums">{item.time}</p>
              <h4 className="mt-2 text-sm font-semibold">{item.name}</h4>
            </div>
            <Badge variant="accent">{item.room}</Badge>
          </div>
          <p className="mt-3 text-xs text-[var(--muted)]">{item.coach}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.belts.map((belt) => <BeltDot key={belt} belt={belt} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function RankingsPreview() {
  return (
    <div className="mt-4 space-y-3">
      {rankedMembers.slice(0, 5).map((member, index) => (
        <div key={member.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
          <span className="grid size-8 place-items-center rounded-lg bg-[var(--panel)] text-sm font-semibold text-[var(--accent)]">{index + 1}</span>
          <StudentAvatar student={member} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{member.name}</p>
            <p className="text-xs text-[var(--muted)]">{member.wins} wins · {member.losses} losses</p>
          </div>
          <p className="text-sm font-semibold tabular-nums">{member.points}</p>
        </div>
      ))}
    </div>
  );
}

function RolesPreview() {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {[
        ["Owner", "Club settings, team, billing, integrations"],
        ["Admin", "Members, schedule, posts, reporting"],
        ["Coach", "Check-ins, notes, promotions, classes"],
        ["Member", "Schedule, profile, rankings, activity"],
      ].map(([role, copy]) => (
        <div key={role} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-semibold">{role}</p>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{copy}</p>
        </div>
      ))}
    </div>
  );
}

function TvPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow)]">
      <div className={cn("relative p-4 sm:p-5", compact ? "min-h-[340px]" : "min-h-[460px]")}>
        <Image src="/avatars/sofia-almeida.png" alt="Live academy screen" fill sizes="(min-width: 1024px) 650px, 100vw" className="object-cover opacity-[0.15] mix-blend-luminosity" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_srgb,var(--background)_82%,transparent)_58%,color-mix(in_srgb,var(--accent)_16%,transparent)_100%)]" />
        <div className={cn("relative z-10 flex flex-col justify-between", compact ? "min-h-[300px]" : "min-h-[420px]")}>
          <div className="flex items-center justify-between gap-4">
            <Badge variant="success">Live now</Badge>
            <span className="text-xs tabular-nums text-[var(--muted)]">{currentSession.time}–{currentSession.endTime}</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{currentSession.room} · {currentSession.trainingType}</p>
            <h3 className="mt-3 text-4xl font-semibold leading-none sm:text-5xl">{currentSession.name}</h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">{currentSession.focus}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {tvCheckedInAthletes.slice(0, compact ? 3 : 6).map((member) => (
              <div key={member.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="flex items-center gap-3">
                  <StudentAvatar student={member} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{member.name}</p>
                    <p className="text-xs capitalize text-[var(--muted)]">{member.belt} · {member.checkedInMinutes}m</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveClassCard() {
  return (
    <div className="rounded-lg border border-[color-mix(in_srgb,var(--accent)_26%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface))] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Live class</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{currentSession.name}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{currentSession.coach} · {currentSession.room}</p>
        </div>
        <span className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-xs tabular-nums text-[var(--muted)]">{currentSession.time}</span>
      </div>
      <p className="mt-4 text-sm leading-6">{currentSession.focus}</p>
    </div>
  );
}

function Metric({ value, label, accent = false }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
      <p className={cn("text-2xl font-semibold tabular-nums", accent && "text-[var(--accent)]")}>{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
    </div>
  );
}

function BeltDistribution() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
      <h3 className="text-xl font-semibold">Belt progression map</h3>
      <div className="mt-5 space-y-4">
        {beltDistribution.map((item) => (
          <div key={item.belt}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <BeltLabel belt={item.belt} />
              <span className="tabular-nums text-[var(--muted)]">{item.count}</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--surface)]">
              <div className="h-full rounded-full" style={{ width: `${(item.count / maxBeltCount) * 100}%`, backgroundColor: beltStyles[item.belt].hex }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrainingFeed() {
  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">
      {trainingPosts.slice(0, 4).map((post) => (
        <article key={post.id} className="border-b border-[var(--border)] p-4 last:border-b-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={post.pinned ? "accent" : "muted"}>{typeLabels[post.type]}</Badge>
            <span className="text-xs text-[var(--muted)]">{post.date} · {post.time}</span>
          </div>
          <h3 className="mt-3 text-base font-semibold">{post.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{post.summary}</p>
        </article>
      ))}
    </div>
  );
}

function Kicker({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
      <Icon size={14} />
      {children}
    </div>
  );
}

function BeltLabel({ belt }: { belt: keyof typeof beltStyles }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize" style={{ backgroundColor: beltStyles[belt].hex, color: belt === "white" ? beltStyles.black.hex : beltStyles.white.hex }}>
      {belt}
    </span>
  );
}

function BeltDot({ belt }: { belt: keyof typeof beltStyles }) {
  return <span className="size-3 rounded-full border border-[var(--border)]" style={{ backgroundColor: beltStyles[belt].hex }} />;
}
