"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Crown,
  Dumbbell,
  Eye,
  Flame,
  Layers3,
  MapPin,
  Medal,
  MonitorPlay,
  QrCode,
  Radio,
  ShieldCheck,
  Sparkles,
  Table2,
  Trophy,
  UserCog,
  Users,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LandingMembersAgGridPreview, LandingRankingsAgGridPreview, LandingScheduleAgGridPreview } from "@/components/marketing/landing-ag-grid-previews";
import { DemoRequestForm } from "@/components/marketing/demo-request-form";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardKicker, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { academyMeta, tvTickerItems } from "@/data/academy-meta";
import { attendance, beltStyles, currentSession, recentActivity, schedule, students, tvCheckedInAthletes, type Belt } from "@/data/academy";
import { beltDistribution, communityHighlights, dashboardStats, promotions } from "@/data/dashboard";
import { competitions } from "@/data/competitions";
import { clubs } from "@/data/platform";
import { trainingPosts, typeLabels } from "@/data/training-feed";
import { cn } from "@/lib/utils";

const rankedMembers = [...students].sort((a, b) => b.points - a.points);
const activeMembers = students.filter((student) => student.status === "active");
const maxAttendance = Math.max(...attendance.map((item) => item.students));
const maxBeltCount = Math.max(...beltDistribution.map((item) => item.count));

const heroMetrics = [
  { value: academyMeta.memberCount, label: "members", detail: "managed in one academy OS" },
  { value: dashboardStats.checkedInToday, label: "checked in today", detail: "visible on the mat-side TV" },
  { value: dashboardStats.weeklyAttendance, label: "weekly visits", detail: "attendance owners can actually feel" },
];

const productModules = [
  { icon: Users, title: "Members", copy: "Belt, role, hours, streaks, focus areas, and profile context." },
  { icon: CalendarDays, title: "Schedule", copy: "Weekly class operations for coaches, rooms, levels, and timing." },
  { icon: MonitorPlay, title: "TV screen", copy: "A live display that turns check-ins into academy energy." },
  { icon: Trophy, title: "Rankings", copy: "Points, records, belt filters, and visible competitive movement." },
  { icon: Flame, title: "Training feed", copy: "Promotions, recaps, milestones, announcements, and moments." },
  { icon: UserCog, title: "Admin", copy: "Owner, admin, coach, and member roles connected to the workspace." },
];

const featureGrid = [
  { icon: MonitorPlay, title: "Live TV display", copy: "Students check in and appear on a screen that makes the room feel alive." },
  { icon: Table2, title: "AG Grid rosters", copy: "Fast member, rankings, and schedule surfaces built for real daily scanning." },
  { icon: Award, title: "Belt progression", copy: "Stripes, promotions, watchlists, and coach-awarded milestones." },
  { icon: Trophy, title: "Rankings", copy: "Points and records that make competition culture visible." },
  { icon: CalendarDays, title: "Schedule", copy: "Classes, coaches, rooms, levels, and time blocks in one operating view." },
  { icon: Medal, title: "Competitions", copy: "Upcoming events, registered athletes, deadlines, and prep status." },
  { icon: Flame, title: "Training feed", copy: "A social layer for sessions, streaks, team moments, and announcements." },
  { icon: Building2, title: "Academy network", copy: "Designed for single academies today and multi-club teams next." },
];

const pricingPlans = [
  {
    name: "White Belt",
    price: "$100",
    suffix: "/mo",
    accent: beltStyles.white.hex,
    description: "For small academies getting their core workspace organized.",
    featured: false,
    items: ["Member directory", "Schedule management", "Rankings", "Basic dashboard", "MVP preview access"],
  },
  {
    name: "Blue Belt",
    price: "$200",
    suffix: "/mo",
    accent: beltStyles.blue.hex,
    description: "For growing academies that want live engagement inside the room.",
    featured: true,
    items: ["Everything in White Belt", "TV display mode", "Training feed", "Attendance insights", "Priority product setup"],
  },
  {
    name: "Purple Belt",
    price: "$400",
    suffix: "/mo",
    accent: beltStyles.purple.hex,
    description: "For teams running roles, events, competitions, and deeper academy culture.",
    featured: false,
    items: ["Everything in Blue Belt", "Coach/admin roles", "Competition planning", "Advanced permissions", "Founder feedback lane"],
  },
  {
    name: "Black Belt",
    price: "Custom",
    suffix: "",
    accent: beltStyles.black.hex,
    description: "For larger academies, multi-club teams, and deeper rollout needs.",
    featured: false,
    items: ["Multi-club support", "Custom onboarding", "Operational review", "Integration planning", "Dedicated support"],
  },
];

const faqItems = [
  ["Is Grapply a generic gym CRM?", "No. The product is built around BJJ workflows: belts, stripes, mat-side check-ins, rankings, class culture, competitions, and coach context."],
  ["Does the TV screen use the same data as the app?", "Yes. The landing preview mirrors the existing TV mode: live class info, checked-in athletes, belt colors, and academy activity."],
  ["Can coaches and admins use different roles?", "Yes. The product already models owner, admin, coach, and member roles so the academy can grow without everyone sharing one login."],
  ["Is there a real backend yet?", "This prototype uses mock data with Supabase-ready API scaffolding. The landing form posts to a real route and falls back cleanly in local demo mode."],
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header />
      <Hero />
      <ProductOSSection />
      <LiveAcademySection />
      <MembersSection />
      <ScheduleSection />
      <TvShowcaseSection />
      <ProgressionSection />
      <RankingsSection />
      <TrainingFeedSection />
      <CompetitionsSection />
      <PartnersSection />
      <FeatureSection />
      <WhySection />
      <PricingSection />
      <FaqSection />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Header() {
  const nav = [
    ["Product", "#product"],
    ["TV", "#tv"],
    ["Partners", "#partners"],
    ["Pricing", "#pricing"],
    ["FAQ", "#faq"],
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <BrandLogo className="size-10 shadow-[var(--glow-accent)]" priority />
          <span className="min-w-0">
            <span className="block text-sm font-black tracking-[0.18em]">Grapply</span>
            <span className="block truncate text-xs text-[var(--muted)]">Jiu-Jitsu Academy OS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map(([label, href]) => (
            <a key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)] sm:inline-flex">
            Login
          </Link>
          <Button asChild variant="primary" size="lg">
            <a href="#demo">
              Book demo <ArrowRight />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border)]">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_34%,color-mix(in_srgb,var(--accent-blue)_9%,transparent))]" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:px-8 lg:py-18">
        <Reveal className="relative z-10">
          <Kicker icon={Radio}>Live academy OS</Kicker>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal sm:text-7xl">
            Your academy, alive.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
            Grapply turns attendance, progression, rankings, classes, competitions, and academy culture into one live operating system for modern Jiu-Jitsu academies.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="primary" size="lg">
              <a href="#demo">
                See your academy live <ArrowRight />
              </a>
            </Button>
            <Button asChild variant="surface" size="lg">
              <Link href="/clubs">
                Open MVP preview <MonitorPlay />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {heroMetrics.map((metric, index) => (
              <MetricCard key={metric.label} value={metric.value} label={metric.label} detail={metric.detail} accent={index === 1} />
            ))}
          </div>
        </Reveal>

        <HeroProductScene />
      </div>
    </section>
  );
}

function HeroProductScene() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] p-2 shadow-[var(--shadow)] sm:p-3"
    >
      <div className="relative min-h-[560px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] sm:min-h-[590px]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_10%,transparent),transparent_38%,color-mix(in_srgb,var(--accent-blue)_10%,transparent))]" />
        <div className="absolute inset-x-4 bottom-0 h-56 rounded-lg border border-[color-mix(in_srgb,var(--accent-blue)_22%,var(--border))] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--foreground)_7%,transparent)_1px,transparent_1px),linear-gradient(0deg,color-mix(in_srgb,var(--accent)_11%,transparent)_1px,transparent_1px)] bg-[length:34px_34px] opacity-80 [transform:perspective(700px)_rotateX(58deg)]" />

        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_86%,transparent)] px-3 py-2 backdrop-blur-xl sm:inset-x-4">
          <div className="flex min-w-0 items-center gap-2">
            <LiveDot />
            <span className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Academy is live</span>
          </div>
          <span className="hidden text-xs font-semibold tabular-nums text-[var(--status-success)] sm:block">{dashboardStats.checkedInToday} checked in</span>
        </div>

        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-4 right-4 top-16 rounded-lg border border-[color-mix(in_srgb,var(--accent)_34%,var(--border))] bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] p-4 shadow-[var(--shadow)] backdrop-blur-xl sm:left-6 sm:right-auto sm:w-64"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Live class</p>
            <Badge variant="success">TV online</Badge>
          </div>
          <h3 className="mt-3 text-2xl font-semibold leading-tight">{currentSession.name}</h3>
          <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{currentSession.focus}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs tabular-nums text-[var(--muted)]">{currentSession.time} - {currentSession.endTime}</span>
            <span className="text-xs text-[var(--muted)]">{currentSession.room}</span>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 6.1, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-4 right-4 top-[244px] rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] p-3 shadow-[var(--shadow)] backdrop-blur-xl sm:left-auto sm:right-6 sm:top-20 sm:w-64"
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

        <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_9%,var(--panel))] p-3 shadow-[var(--shadow)] backdrop-blur-xl sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-[420px] sm:-translate-x-1/2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MonitorPlay size={16} className="text-[var(--accent)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Mat-side TV</span>
            </div>
            <span className="text-xs tabular-nums text-[var(--muted)]">{currentSession.time} - {currentSession.endTime}</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {tvCheckedInAthletes.slice(0, 4).map((member) => (
              <div key={member.id} className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
                <StudentAvatar student={member} size="sm" />
                <p className="mt-2 truncate text-xs font-semibold">{member.name.split(" ")[0]}</p>
                <span className="mt-2 block h-1 rounded-full" style={{ backgroundColor: beltStyles[member.belt].hex }} />
              </div>
            ))}
          </div>
        </div>

        <div className="absolute left-1/2 top-[355px] hidden size-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] sm:block">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }} className="absolute inset-0">
            {(["white", "blue", "purple", "brown", "black"] as const).map((belt, index) => (
              <span
                key={belt}
                className="absolute left-1/2 top-1/2 h-2.5 w-14 rounded-full border border-[color-mix(in_srgb,var(--foreground)_18%,transparent)]"
                style={{ backgroundColor: beltStyles[belt].hex, transform: `translate(-50%, -50%) rotate(${index * 72}deg) translateX(76px)` }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function ProductOSSection() {
  return (
    <section id="product" className="scroll-mt-24 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal className="max-w-3xl">
          <Kicker icon={Layers3}>Product OS</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">One live system from check-in to black belt.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Grapply connects the surfaces your academy already runs on: roster, schedule, TV screen, rankings, feed, competitions, and staff permissions.
          </p>
        </Reveal>
        <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {productModules.map((module, index) => (
            <Reveal key={module.title} delay={index * 0.04}>
              <motion.div whileHover={{ y: -4 }} className="h-full rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
                <div className="grid size-10 place-items-center rounded-lg bg-[var(--surface)] text-[var(--accent)]">
                  <module.icon size={20} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{module.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{module.copy}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1} className="mt-7">
          <ControlSurfacePreview />
        </Reveal>
      </div>
    </section>
  );
}

function ControlSurfacePreview() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="overflow-hidden rounded-lg p-0">
        <CardHeader className="border-b border-[var(--border)] p-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCog size={18} className="text-[var(--accent)]" />
              Academy controls
            </CardTitle>
            <CardKicker>Real UI primitives inside daily operations</CardKicker>
          </div>
          <Badge variant="accent">Owner view</Badge>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs>
            <TabsList className="flex-wrap">
              <TabsTrigger active>TV</TabsTrigger>
              <TabsTrigger>Schedule</TabsTrigger>
              <TabsTrigger>Roles</TabsTrigger>
              <TabsTrigger>Members</TabsTrigger>
            </TabsList>
            <TabsContent className="grid gap-3 md:grid-cols-2">
              {[
                ["Live check-ins", "Show athletes on the TV screen", true],
                ["Promotion ticker", "Surface stripes, belt awards, and milestones", true],
                ["Coach notes", "Keep private context available to staff", true],
                ["Public rankings", "Let members see the academy leaderboard", false],
              ].map(([title, copy, checked]) => (
                <label key={String(title)} className="flex items-start justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                  <span>
                    <span className="block text-sm font-semibold text-[var(--foreground)]">{title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{copy}</span>
                  </span>
                  <Switch checked={Boolean(checked)} aria-label={String(title)} />
                </label>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="rounded-lg p-0">
        <CardHeader className="border-b border-[var(--border)] p-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays size={18} className="text-[var(--accent)]" />
              Schedule picker
            </CardTitle>
            <CardKicker>Calendar + popover pattern</CardKicker>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="surface" className="justify-between">
                June 12, 2026
                <CalendarDays />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end">
              <Calendar mode="single" selected={new Date("2026-06-12T12:00:00")} month={new Date("2026-06-01T12:00:00")} />
            </PopoverContent>
          </Popover>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
            <Calendar mode="single" selected={new Date("2026-06-12T12:00:00")} month={new Date("2026-06-01T12:00:00")} />
          </div>
          <div className="grid gap-2">
            <ProofRow>Drawer-based class editing</ProofRow>
            <ProofRow>Switches for TV and member-facing settings</ProofRow>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LiveAcademySection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8">
      <Reveal>
        <Kicker icon={Flame}>Live academy experience</Kicker>
        <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Make the room feel active before class even starts.</h2>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          Students see momentum. Coaches see context. Owners see whether the academy is healthy without opening five tools.
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
      </Reveal>
      <Reveal delay={0.08}>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Weekly attendance</p>
              <h3 className="mt-2 text-2xl font-semibold">{dashboardStats.weeklyAttendance} visits this week</h3>
            </div>
            <Badge variant="success">+{dashboardStats.weeklyAttendanceChange}%</Badge>
          </div>
          <AttendanceChart />
          <div className="mt-5 grid gap-2">
            {recentActivity.slice(0, 5).map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                <LiveDot />
                <p className="text-sm text-[var(--muted)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function MembersSection() {
  return (
    <section className="border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[1.16fr_0.84fr] lg:items-center lg:px-8">
        <Reveal>
          <LandingMembersAgGridPreview />
        </Reveal>
        <Reveal delay={0.08}>
          <Kicker icon={Table2}>Members AG Grid</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">The roster should feel like command center, not paperwork.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Members are sortable and scannable by role, belt, hours, classes, streak, and last seen. Coaches can open the right athlete context without hunting through sheets.
          </p>
          <div className="mt-6 grid gap-3">
            {["Coaches first, then belt hierarchy", "Belt, role, hours, and attendance context", "Promotion watch and follow-up filters"].map((item) => (
              <ProofRow key={item}>{item}</ProofRow>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ScheduleSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[0.84fr_1.16fr] lg:items-center lg:px-8">
      <Reveal>
        <Kicker icon={CalendarDays}>Schedule grid</Kicker>
        <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Weekly operations without spreadsheet fog.</h2>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          The schedule preview follows the product decision: classes, rooms, coaches, levels, and time blocks stay clear. No capacity clutter.
        </p>
        <div className="mt-6 grid gap-3">
          {schedule.slice(0, 3).map((item) => (
            <div key={item.name} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-lg font-semibold text-[var(--accent)]">{item.time}</p>
                  <h3 className="mt-1 text-sm font-semibold">{item.name}</h3>
                </div>
                <Badge variant="muted">{item.room}</Badge>
              </div>
              <p className="mt-3 text-xs text-[var(--muted)]">{item.coach}</p>
            </div>
          ))}
        </div>
      </Reveal>
      <Reveal delay={0.08}>
        <LandingScheduleAgGridPreview />
      </Reveal>
    </section>
  );
}

function TvShowcaseSection() {
  return (
    <section id="tv" className="scroll-mt-24 border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
        <Reveal>
          <TvPanel />
        </Reveal>
        <Reveal delay={0.08}>
          <Kicker icon={MonitorPlay}>TV screen showcase</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">The academy TV becomes the pulse of the room.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Students check in, appear instantly on screen, and see the class, coach, focus, belt colors, and activity ticker. The room feels modern and alive.
          </p>
          <div className="mt-6 grid gap-3">
            {["Live athlete cards with belt identity", "Session focus and coach context", "Ticker for promotions, events, and academy moments"].map((item) => (
              <ProofRow key={item}>{item}</ProofRow>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function TvPanel() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 shadow-[var(--shadow)] sm:p-5">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--foreground)_5%,transparent),transparent_42%),linear-gradient(90deg,color-mix(in_srgb,var(--accent)_9%,transparent),transparent_42%,color-mix(in_srgb,var(--accent-blue)_9%,transparent))]" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Badge variant="accent">
            <MonitorPlay size={13} />
            Wall-mounted TV
          </Badge>
          <div className="flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--status-success)_28%,transparent)] bg-[color-mix(in_srgb,var(--status-success)_9%,transparent)] px-3 py-1 text-xs font-semibold text-[var(--status-success)]">
            <Wifi size={13} />
            Online
          </div>
        </div>

        <div className="rounded-lg border-[6px] border-[color-mix(in_srgb,var(--foreground)_18%,var(--border))] bg-[var(--background)] p-2 shadow-[0_36px_120px_color-mix(in_srgb,var(--background)_88%,transparent)]">
          <div className="relative min-h-[520px] overflow-hidden rounded-md border border-[var(--border)] bg-[var(--background)] p-4 sm:p-5">
            <Image src="/avatars/sofia-almeida.png" alt="Academy coach backdrop" fill sizes="(min-width: 1024px) 650px, 100vw" loading="eager" className="object-cover opacity-[0.13] mix-blend-luminosity" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_srgb,var(--background)_84%,transparent)_58%,color-mix(in_srgb,var(--accent)_15%,transparent)_100%)]" />
            <div className="relative z-10 flex min-h-[480px] flex-col justify-between">
              <div className="flex items-center justify-between gap-4">
                <Badge variant="success">
                  <LiveDot />
                  Live now
                </Badge>
                <span className="text-xs tabular-nums text-[var(--muted)]">{currentSession.time} - {currentSession.endTime}</span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{currentSession.room} · {currentSession.trainingType}</p>
                <h3 className="mt-3 text-4xl font-semibold leading-none sm:text-6xl">{currentSession.name}</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">{currentSession.focus}</p>
              </div>

              <div>
                <div className="grid gap-2 lg:grid-cols-[1fr_120px]">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {tvCheckedInAthletes.slice(0, 6).map((member, index) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.04 }}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
                      >
                        <div className="flex items-center gap-3">
                          <StudentAvatar student={member} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{member.name}</p>
                            <p className="text-xs capitalize text-[var(--muted)]">{member.belt} · {member.checkedInMinutes}m</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 lg:block">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                      <QrCode size={14} />
                      Check-in
                    </div>
                    <QrPattern />
                    <p className="mt-2 text-[11px] leading-4 text-[var(--muted)]">Members scan from the mat.</p>
                  </div>
                </div>
                <Ticker />
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto h-3 w-36 rounded-b-lg border-x border-b border-[var(--border)] bg-[var(--surface)]" />
        <div className="mx-auto mt-2 flex max-w-sm items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          <Bell size={12} />
          Mounted where the room can feel it
        </div>
      </div>
    </div>
  );
}

function QrPattern() {
  const filled = new Set([0, 1, 2, 4, 5, 7, 9, 10, 12, 13, 15, 17, 18, 20, 21, 23, 24]);
  return (
    <div className="mt-3 grid size-20 grid-cols-5 gap-1 rounded-lg bg-[var(--background)] p-2">
      {Array.from({ length: 25 }).map((_, index) => (
        <span key={index} className={cn("rounded-[2px]", filled.has(index) ? "bg-[var(--foreground)]" : "bg-[var(--surface)]")} />
      ))}
    </div>
  );
}

function ProgressionSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-start lg:px-8">
      <Reveal>
        <Kicker icon={Award}>Belt progression</Kicker>
        <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Progress should feel earned, visible, and remembered.</h2>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          Stripes and promotions are not buried in admin notes. They become moments the academy can see, celebrate, and build around.
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
      </Reveal>
      <Reveal delay={0.08}>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Belt map</p>
              <h3 className="mt-2 text-2xl font-semibold">Academy progression</h3>
            </div>
            <Award className="text-[var(--accent)]" />
          </div>
          <div className="mt-6 space-y-4">
            {beltDistribution.map((item) => (
              <div key={item.belt}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <BeltBadge belt={item.belt} />
                  <span className="font-mono text-sm text-[var(--muted)]">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface)]">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(item.count / maxBeltCount) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: beltStyles[item.belt].hex }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function RankingsSection() {
  return (
    <section className="border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:px-8">
        <Reveal>
          <LandingRankingsAgGridPreview />
        </Reveal>
        <Reveal delay={0.08}>
          <Kicker icon={Trophy}>Rankings</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Competition culture, without a whiteboard.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Rankings make effort visible: points, records, movement, belt filters, and mat hours. Athletes know where they stand and what they are chasing.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SceneMiniMetric value="2,440" label="top points" />
            <SceneMiniMetric value="+4" label="biggest mover" />
            <SceneMiniMetric value="5" label="LA Open athletes" />
            <SceneMiniMetric value="44" label="exchanges logged" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function TrainingFeedSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-start lg:px-8">
      <Reveal>
        <Kicker icon={Sparkles}>Training feed</Kicker>
        <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">The academy timeline should feel social, not administrative.</h2>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          Recaps, promotions, streaks, open mats, and announcements become a shared record of what happened on the mats.
        </p>
        <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-3">
            <QrCode className="text-[var(--accent)]" />
            <div>
              <p className="text-sm font-semibold">Mobile-ready academy moments</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Built for members and coaches to stay connected between classes.</p>
            </div>
          </div>
        </div>
      </Reveal>
      <Reveal delay={0.08}>
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)]">
          {trainingPosts.slice(0, 5).map((post) => (
            <article key={post.id} className="border-b border-[var(--border)] p-4 last:border-b-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={post.pinned ? "accent" : "muted"}>{typeLabels[post.type]}</Badge>
                <span className="text-xs text-[var(--muted)]">{post.date} · {post.time} · {post.coach}</span>
              </div>
              <h3 className="mt-3 text-base font-semibold">{post.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{post.summary}</p>
              {post.taggedStudents?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.taggedStudents.slice(0, 3).map((student) => (
                    <span key={student} className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">{student}</span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function CompetitionsSection() {
  return (
    <section className="border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal className="max-w-3xl">
          <Kicker icon={Medal}>Competitions</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Competition prep becomes part of academy identity.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Upcoming tournaments, registered athletes, deadlines, and prep status sit next to the athletes training for them.
          </p>
        </Reveal>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {competitions.map((event, index) => (
            <Reveal key={event.id} delay={index * 0.04}>
              <motion.article whileHover={{ y: -4 }} className="h-full rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{event.type}</p>
                    <h3 className="mt-2 text-xl font-semibold">{event.name}</h3>
                  </div>
                  <Badge variant={event.status === "Registration open" ? "success" : "muted"}>{event.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-[var(--muted)]">{event.date} · {event.venue}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex -space-x-2">
                    {event.registered_students.slice(0, 4).map((studentId) => {
                      const student = students.find((candidate) => candidate.id === studentId);
                      return student ? <StudentAvatar key={studentId} student={student} size="sm" className="border-[var(--background)]" /> : null;
                    })}
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{event.registered_students.length} athletes</span>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>Prep readiness</span>
                    <span>{event.prep}%</span>
                  </div>
                  <ProgressBar value={event.prep} />
                </div>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnersSection() {
  return (
    <section id="partners" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8">
      <Reveal className="grid gap-6 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)] sm:p-7 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div>
          <Kicker icon={Building2}>Academy partners</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">Built with real academy shapes in mind.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Single-location gyms, competition teams, and future multi-club networks all need the same thing: a workspace that makes the academy feel current.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {clubs.map((club) => (
            <div key={club.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
                  <Building2 size={19} />
                </div>
                <Badge variant={club.status === "active" ? "success" : "muted"}>{club.status}</Badge>
              </div>
              <h3 className="mt-4 text-base font-semibold">{club.name}</h3>
              <p className="mt-2 flex items-center gap-1 text-xs text-[var(--muted)]">
                <MapPin size={13} />
                {club.location}
              </p>
              <p className="mt-3 text-xs text-[var(--muted)]">{club.memberCount} members · {club.primaryCoach}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function FeatureSection() {
  return (
    <section id="features" className="scroll-mt-24 border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal className="max-w-3xl">
          <Kicker icon={Zap}>Feature grid</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Everything points back to the room.</h2>
        </Reveal>
        <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {featureGrid.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.03}>
              <motion.div whileHover={{ y: -4 }} className="h-full rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
                <div className="grid size-10 place-items-center rounded-lg bg-[var(--surface)] text-[var(--accent)]">
                  <feature.icon size={20} />
                </div>
                <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{feature.copy}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
      <Reveal>
        <Kicker icon={ShieldCheck}>Why Grapply</Kicker>
        <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Because academy software should make your gym look alive.</h2>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          Owners do not need another dead admin panel. They need a system that helps students return, coaches prepare, and the academy identity become visible.
        </p>
      </Reveal>
      <Reveal delay={0.08}>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["More attendance", "Streaks, check-ins, and TV presence give students a reason to show up."],
            ["Stronger community", "Feed moments, promotions, and competition prep turn training into shared culture."],
            ["Better coach context", "Belts, hours, focus areas, and activity are visible before class starts."],
            ["Modern identity", "Your academy feels current the moment students walk into the room."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
              <CheckCircle2 className="text-[var(--status-success)]" />
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-24 border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal className="max-w-3xl">
          <Kicker icon={Crown}>Pricing</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Pricing that follows the belt system.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Start with the academy OS, then grow into TV engagement, feed, roles, competitions, and multi-club support.
          </p>
        </Reveal>
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pricingPlans.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 0.04}>
              <motion.div
                whileHover={{ y: -4 }}
                className={cn("relative h-full rounded-lg border bg-[var(--panel)] p-5", plan.featured ? "border-[color-mix(in_srgb,var(--accent)_48%,transparent)] shadow-[var(--glow-accent)]" : "border-[var(--border)]")}
              >
                {plan.featured ? <Badge variant="accent" className="mb-4">Most popular</Badge> : null}
                <div className="mb-4 h-1.5 rounded-full" style={{ backgroundColor: plan.accent }} />
                <h3 className="text-2xl font-semibold">{plan.name}</h3>
                <p className="mt-2 min-h-16 text-sm leading-6 text-[var(--muted)]">{plan.description}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-4xl font-semibold">{plan.price}</span>
                  {plan.suffix ? <span className="pb-1 text-sm text-[var(--muted)]">{plan.suffix}</span> : null}
                </div>
                <Button asChild variant={plan.featured ? "primary" : "surface"} className="mt-5 w-full">
                  <a href="#demo">
                    Book demo <ArrowRight />
                  </a>
                </Button>
                <div className="mt-5 space-y-3">
                  {plan.items.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                      <Check size={15} className="mt-0.5 shrink-0 text-[var(--status-success)]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8">
      <Reveal className="max-w-3xl">
        <Kicker icon={Eye}>FAQ</Kicker>
        <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Straight answers for academy owners.</h2>
      </Reveal>
      <div className="mt-7 grid gap-3 md:grid-cols-2">
        {faqItems.map(([question, answer], index) => (
          <Reveal key={question} delay={index * 0.04}>
            <div className="h-full rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
              <h3 className="text-base font-semibold">{question}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{answer}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section id="demo" className="border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:px-8">
        <Reveal>
          <Kicker icon={Dumbbell}>Book a demo</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">See your academy live before your students do.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Tell us what you run today. We will show the flows that matter: TV, members, schedule, rankings, feed, competitions, or owner operations.
          </p>
          <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="flex items-center gap-3">
              <Clock3 className="text-[var(--accent)]" />
              <div>
                <p className="text-sm font-semibold">Typical walkthrough: 25 minutes</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Built around the size and rhythm of your academy.</p>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <DemoRequestForm />
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  function openCookiePreferences() {
    window.dispatchEvent(new Event("grapply:open-cookie-preferences"));
  }

  return (
    <footer className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo className="size-9" />
          <span>Grapply · Built for Brazilian Jiu-Jitsu academies.</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <a href="#product" className="hover:text-[var(--foreground)]">Product</a>
          <a href="#pricing" className="hover:text-[var(--foreground)]">Pricing</a>
          <a href="#demo" className="hover:text-[var(--foreground)]">Demo</a>
          <Link href="/privacy" className="hover:text-[var(--foreground)]">Privacy</Link>
          <button type="button" onClick={openCookiePreferences} className="hover:text-[var(--foreground)]">Cookie settings</button>
          <a href="#demo" className="hover:text-[var(--foreground)]">Contact</a>
        </div>
      </div>
    </footer>
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

function Ticker() {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        className="flex w-max gap-6 whitespace-nowrap px-3 text-xs font-semibold text-[var(--muted)]"
      >
        {[...tvTickerItems, ...tvTickerItems].map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-2">
            <LiveDot />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function MetricCard({ value, label, detail, accent = false }: { value: string | number; label: string; detail: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
      <p className={cn("text-3xl font-semibold tabular-nums", accent && "text-[var(--accent)]")}>{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function SceneMiniMetric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
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

function ProofRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm">
      <Check size={15} className="shrink-0 text-[var(--status-success)]" />
      <span>{children}</span>
    </div>
  );
}

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={cn("min-w-0", className)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.56, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function BeltBadge({ belt, stripes = 0 }: { belt: Belt; stripes?: number }) {
  const color = beltStyles[belt].hex;
  return (
    <span
      className="inline-flex w-fit items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
      style={{ backgroundColor: color, color: belt === "white" ? beltStyles.black.hex : beltStyles.white.hex }}
    >
      {belt}
      {stripes > 0 ? (
        <span className="flex gap-0.5">
          {Array.from({ length: stripes }).map((_, index) => (
            <span key={index} className="h-2.5 w-0.5 rounded-full bg-current opacity-70" />
          ))}
        </span>
      ) : null}
    </span>
  );
}

function LiveDot() {
  return (
    <span className="relative inline-flex size-2 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--status-success)] opacity-50" />
      <span className="relative inline-flex size-2 rounded-full bg-[var(--status-success)]" />
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-[var(--surface)]">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.75 }}
        className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-blue))]"
      />
    </div>
  );
}
