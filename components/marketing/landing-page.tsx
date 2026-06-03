"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BarChart3,
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
  Shield,
  Sparkles,
  Trophy,
  UserCog,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/components/student-avatar";
import { academyMeta } from "@/data/academy-meta";
import { attendance, beltStyles, currentSession, schedule, students, tvCheckedInAthletes } from "@/data/academy";
import { beltDistribution, promotions } from "@/data/dashboard";
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
    title: "Member command center",
    copy: "Belt, role, focus, attendance, hours, points, and coach context in one premium athlete view.",
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
    title: "Competitive progression",
    copy: "Points, wins, streaks, and leaderboard energy that make training feel game-like.",
  },
  {
    id: "tv",
    label: "TV mode",
    icon: MonitorPlay,
    title: "Live academy display",
    copy: "A mat-side screen for live check-ins, athlete cards, session focus, and academy atmosphere.",
  },
  {
    id: "roles",
    label: "Roles",
    icon: UserCog,
    title: "Team permissions",
    copy: "Owner, admin, coach, and member access for real academy operations.",
  },
] as const;

const features = [
  { icon: Users, title: "Member management", copy: "Profiles, belts, stripes, attendance, status, training hours, and focus areas." },
  { icon: CalendarDays, title: "Class schedule", copy: "Classes, rooms, coaches, levels, and daily flow in one clean operational surface." },
  { icon: Award, title: "Belt system", copy: "Progression, promotion watch, stripes, and emotional moments around rank." },
  { icon: UserCog, title: "Coach/admin roles", copy: "Permissions and workspace roles for owners, admins, coaches, and members." },
  { icon: MonitorPlay, title: "Academy TV display", copy: "A live screen that makes the room feel active, modern, and connected." },
  { icon: MessageCircle, title: "Training feed", copy: "Session recaps, announcements, milestones, reactions, and academy memory." },
  { icon: Medal, title: "Competitions & camps", copy: "Rosters, deadlines, prep readiness, events, and team culture." },
  { icon: Network, title: "Integration-ready", copy: "Strava-ready scaffolding and a product direction for future academy integrations." },
];

const pricingPlans = [
  {
    name: "White Belt",
    price: "$100",
    suffix: "/mo",
    accent: "#f4f4f5",
    description: "For small academies that need the core operating layer.",
    cta: "Book demo",
    featured: false,
    items: ["Member directory", "Schedule management", "Rankings", "Basic dashboard", "Mock TV preview", "Email support"],
  },
  {
    name: "Purple Belt",
    price: "$200",
    suffix: "/mo",
    accent: beltStyles.purple.hex,
    description: "The recommended academy OS for growing BJJ teams.",
    cta: "Book demo",
    featured: true,
    items: ["Everything in White Belt", "Advanced academy dashboard", "Coach/admin roles", "TV display mode", "Training activity feed", "Competitions and camps", "Priority support", "Product preview/demo setup"],
  },
  {
    name: "Black Belt",
    price: "Custom",
    suffix: "",
    accent: beltStyles.black.hex,
    description: "For larger academies, networks, and serious operators.",
    cta: "Talk to us",
    featured: false,
    items: ["Multi-club support", "Custom onboarding", "Advanced permissions", "Integrations", "Custom analytics", "Dedicated support", "Roadmap partnership"],
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header />
      <Hero />
      <OutcomeStrip />
      <ProductPreview />
      <FeatureSection />
      <ControlRoomSection />
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
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[var(--glow-accent)]">
            <Shield size={22} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black tracking-[0.18em]">Grapply</span>
            <span className="block truncate text-xs text-[var(--muted)]">Jiu-Jitsu Academy OS</span>
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
            BJJ academy command center
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.03] tracking-normal sm:text-6xl lg:text-7xl">
            Run your Jiu-Jitsu academy like a high-performance fight team.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
            Members, classes, rankings, roles, training activity, and live academy displays in one premium operating system.
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
            <Metric value={academyMeta.academyPulse} label="Pulse" />
          </div>
        </div>

        <HeroCommandScene />
      </div>
    </section>
  );
}

function HeroCommandScene() {
  return (
    <div className="relative z-10 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 shadow-[var(--shadow)]">
      <div className="relative min-h-[430px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 [perspective:1100px] sm:min-h-[520px]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_42%,color-mix(in_srgb,var(--accent-blue)_9%,transparent))]" />
        <div className="absolute inset-x-8 bottom-10 h-48 origin-bottom rounded-lg border border-[var(--border)] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--accent)_12%,transparent)_1px,transparent_1px),linear-gradient(0deg,color-mix(in_srgb,var(--accent-blue)_10%,transparent)_1px,transparent_1px)] bg-[length:36px_36px] [transform:rotateX(62deg)]" />
        <div className="absolute left-8 top-8 w-48 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_86%,transparent)] p-4 shadow-[var(--shadow)] [transform:rotateY(12deg)_rotateX(4deg)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Live class</p>
          <h3 className="mt-2 text-xl font-semibold">{currentSession.name}</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">{currentSession.room} · {currentSession.time}</p>
        </div>
        <div className="absolute right-7 top-12 w-52 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_88%,transparent)] p-4 shadow-[var(--shadow)] [transform:rotateY(-14deg)_rotateX(5deg)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Leaderboard</p>
          <div className="mt-3 space-y-2">
            {rankedMembers.slice(0, 3).map((member, index) => (
              <div key={member.id} className="flex items-center gap-2 rounded-lg bg-[var(--surface)] px-2 py-2">
                <span className="text-xs font-semibold text-[var(--accent)]">{index + 1}</span>
                <StudentAvatar student={member} size="sm" />
                <p className="min-w-0 truncate text-xs font-semibold">{member.name}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-9 left-1/2 w-64 -translate-x-1/2 rounded-lg border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--accent)_9%,var(--panel))] p-4 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <Badge variant="success">TV online</Badge>
            <span className="text-xs tabular-nums text-[var(--muted)]">{currentSession.time}–{currentSession.endTime}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {tvCheckedInAthletes.slice(0, 3).map((member) => (
              <div key={member.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
                <StudentAvatar student={member} size="sm" />
                <p className="mt-2 truncate text-xs font-semibold">{member.name.split(" ")[0]}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute left-1/2 top-24 size-44 -translate-x-1/2 rounded-full border border-[color-mix(in_srgb,var(--accent)_28%,transparent)]" />
        <BeltOrbit />
      </div>
    </div>
  );
}

function BeltOrbit() {
  const belts = ["white", "blue", "purple", "brown", "black"] as const;
  return (
    <div className="absolute left-1/2 top-24 size-44 -translate-x-1/2">
      {belts.map((belt, index) => {
        const angle = (index / belts.length) * Math.PI * 2;
        const x = Math.cos(angle) * 86;
        const y = Math.sin(angle) * 66;
        return (
          <span
            key={belt}
            className="absolute left-1/2 top-1/2 h-3 w-14 rounded-full border border-[var(--border)]"
            style={{
              backgroundColor: beltStyles[belt].hex,
              transform: `translate(${x - 28}px, ${y - 6}px) rotate(${index * 18}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

function OutcomeStrip() {
  return (
    <section className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:px-6 md:grid-cols-3 lg:px-8">
        {[
          ["More attendance", "Streaks, live visibility, and member momentum make training feel active every week."],
          ["Stronger culture", "The room sees who is training, competing, improving, and showing up."],
          ["Premium identity", "Your academy looks modern on TV, mobile, and the front-desk workflow."],
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
  const [activeId, setActiveId] = useState<(typeof productScreens)[number]["id"]>("members");
  const active = useMemo(() => productScreens.find((screen) => screen.id === activeId) ?? productScreens[0], [activeId]);
  const ActiveIcon = active.icon;

  return (
    <section id="product" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div>
          <Kicker icon={Layers3}>Product preview</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">A product you can feel, not another admin table.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Switch between the core academy surfaces: members, schedule, rankings, TV mode, and roles.
          </p>
          <div className="mt-6 grid gap-2">
            {productScreens.map((screen) => {
              const Icon = screen.icon;
              const activeScreen = screen.id === activeId;
              return (
                <button
                  key={screen.id}
                  type="button"
                  onClick={() => setActiveId(screen.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition",
                    activeScreen ? "border-[color-mix(in_srgb,var(--accent)_38%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))] text-[var(--foreground)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]",
                  )}
                >
                  <Icon size={18} className={activeScreen ? "text-[var(--accent)]" : ""} />
                  <span className="text-sm font-semibold">{screen.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 shadow-[var(--shadow)]">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">{active.label}</p>
                <h3 className="mt-2 text-2xl font-semibold">{active.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{active.copy}</p>
              </div>
              <div className="grid size-12 place-items-center rounded-lg bg-[var(--surface)] text-[var(--accent)]">
                <ActiveIcon size={24} />
              </div>
            </div>
            <ProductPanel activeId={active.id} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductPanel({ activeId }: { activeId: (typeof productScreens)[number]["id"] }) {
  if (activeId === "schedule") return <SchedulePreview />;
  if (activeId === "rankings") return <RankingsPreview />;
  if (activeId === "tv") return <TvPanel compact />;
  if (activeId === "roles") return <RolesPreview />;
  return <MembersPreview />;
}

function FeatureSection() {
  return (
    <section id="features" className="border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Kicker icon={Zap}>Features</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Everything that makes the academy feel alive.</h2>
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
        <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">A game-like operating layer for the mats.</h2>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          Grapply turns the routines of a BJJ academy into a live system: classes, rankings, belts, competition prep, and TV moments all orbit the same academy identity.
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Competition prep</p>
          {competitions.slice(0, 2).map((event) => (
            <div key={event.id} className="mt-3 rounded-lg bg-[var(--surface)] p-3">
              <p className="text-sm font-semibold">{event.name}</p>
              <p className="text-xs text-[var(--muted)]">{event.registered_students.length} athletes · {event.prep}% prep</p>
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

function PricingSection() {
  return (
    <section id="pricing" className="border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Kicker icon={CreditCard}>Pricing</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Pricing that follows the belt system.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">Start with the core operating system, then grow into TV, roles, feed, competitions, and custom network support.</p>
        </div>
        <div className="mt-7 grid gap-4 lg:grid-cols-3">
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
          <Kicker icon={Sparkles}>MVP demo available now</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">Built around real BJJ workflows, not fake generic testimonials.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Grapply is designed for academy owners, coaches, and teams who want a cleaner operating system for members, belts, classes, rankings, and mat-side displays.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Owners", "Cleaner operations and a premium academy identity."],
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
    <section id="demo" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="grid gap-6 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)] sm:p-8 lg:grid-cols-[1fr_0.78fr] lg:items-center">
        <div>
          <Badge variant="accent" className="mb-4">
            Demo
          </Badge>
          <h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">Ready to see your academy as a modern fight team OS?</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Book a product walkthrough and see how Grapply can make your academy feel modern, alive, and easier to operate.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href="mailto:demo@grapply.app?subject=Grapply%20demo%20request" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-foreground)] transition hover:-translate-y-0.5">
              Book demo <ArrowRight size={16} />
            </a>
            <Link href="/dashboard" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 text-sm font-semibold transition hover:bg-[var(--surface-hover)]">
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
          <span className="grid size-9 place-items-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)]">
            <Shield size={18} />
          </span>
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

function Kicker({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
      <Icon size={14} />
      {children}
    </div>
  );
}

function BeltLabel({ belt }: { belt: keyof typeof beltStyles }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize" style={{ backgroundColor: beltStyles[belt].hex, color: belt === "white" ? "#09090b" : "#ffffff" }}>
      {belt}
    </span>
  );
}

function BeltDot({ belt }: { belt: keyof typeof beltStyles }) {
  return <span className="size-3 rounded-full border border-[var(--border)]" style={{ backgroundColor: beltStyles[belt].hex }} />;
}
