import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  CalendarDays,
  Check,
  Flame,
  Medal,
  MessageCircle,
  MonitorPlay,
  Shield,
  Trophy,
  Users,
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

const features = [
  { icon: MonitorPlay, title: "Live TV display", copy: "Turn check-ins, athletes, and session focus into a live signal on the academy floor." },
  { icon: Users, title: "Member profiles", copy: "Belts, stripes, focus areas, attendance, training hours, and competition history." },
  { icon: Award, title: "Progression", copy: "Promotions, stripes, streaks, and milestones that make progress visible between belts." },
  { icon: Trophy, title: "Rankings", copy: "Competition points and academy leaderboards built around BJJ culture." },
  { icon: MessageCircle, title: "Training feed", copy: "Class recaps, announcements, promotions, and moments your members remember." },
  { icon: CalendarDays, title: "Schedule ops", copy: "Coaches, rooms, belt eligibility, and class flow in a clean operational surface." },
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header />
      <Hero />
      <OutcomeStrip />
      <ProductShowcase />
      <ProgressionSection />
      <CommunitySection />
      <FeatureGrid />
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
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)]">
            <Shield size={22} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black tracking-[0.18em]">Grapply</span>
            <span className="block truncate text-xs text-[var(--muted)]">Jiu-Jitsu Academy OS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {[
            ["TV", "#tv"],
            ["Progression", "#progression"],
            ["Community", "#community"],
            ["Features", "#features"],
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
          <Link href="/register" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition hover:-translate-y-0.5">
            Book demo <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border)]">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_36%,color-mix(in_srgb,var(--accent-blue)_7%,transparent))]" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-20">
        <div className="relative z-10">
          <Badge variant="accent" className="mb-5">
            <Flame size={13} />
            Your academy, live
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] tracking-normal sm:text-6xl lg:text-7xl">
            Modern academy software for Brazilian Jiu-Jitsu.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
            Grapply makes your academy feel alive: live check-ins, TV screens, visible progression, rankings, training feed, schedules, and member profiles in one premium BJJ operating system.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-foreground)] transition hover:-translate-y-0.5">
              See your academy live <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 text-sm font-semibold transition hover:bg-[var(--surface-hover)]">
              Open product demo <MonitorPlay size={16} />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <Metric value={academyMeta.memberCount} label="Members" />
            <Metric value={academyMeta.checkedInToday} label="Today" accent />
            <Metric value={academyMeta.academyPulse} label="Pulse" />
          </div>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative z-10 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="hidden space-y-3 lg:block">
        <LiveClassCard />
        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Promotion watch</p>
          <div className="mt-4 space-y-3">
            {promotions.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-sm font-semibold">{item.student}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TvPanel compact />
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
          <div key={title} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductShowcase() {
  return (
    <section id="tv" className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
      <div>
        <Kicker icon={MonitorPlay}>Live academy TV</Kicker>
        <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Give the academy floor a heartbeat.</h2>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          Members check in and appear instantly. Coaches see the session focus. The academy feels active before the first round starts.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {["Athlete cards", "Belt colors", "Session focus", "Live check-ins"].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
              <Check size={15} className="text-[var(--status-success)]" />
              {item}
            </div>
          ))}
        </div>
      </div>
      <TvPanel />
    </section>
  );
}

function ProgressionSection() {
  return (
    <section id="progression" className="border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <div>
          <Kicker icon={Award}>Belt progression</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Make progress visible between promotions.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Belts and stripes matter because they carry emotion. Grapply gives coaches a clean way to recognize progress and members a reason to stay engaged.
          </p>
          <div className="mt-5 space-y-3">
            {promotions.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.student}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{item.detail}</p>
                  </div>
                  <Badge variant={item.type === "belt" ? "accent" : "muted"}>{item.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <BeltDistribution />
          <RankingsPanel />
        </div>
      </div>
    </section>
  );
}

function CommunitySection() {
  return (
    <section id="community" className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
      <div>
        <Kicker icon={MessageCircle}>Training feed</Kicker>
        <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Your academy gets a memory.</h2>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          Class recaps, promotions, competition prep, and open mat moments live where members can see them.
        </p>
        <TrainingFeed />
      </div>
      <div className="grid gap-3">
        <AttendancePanel />
        <CompetitionPanel />
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section id="features" className="border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Kicker icon={BarChart3}>Platform</Kicker>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">A BJJ-native operating system, not a generic gym CRM.</h2>
        </div>
        <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
                <div className="grid size-10 place-items-center rounded-lg bg-[var(--surface)] text-[var(--accent)]">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{feature.copy}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-6 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8 lg:grid-cols-[1fr_0.78fr] lg:items-center">
        <div>
          <Badge variant="accent" className="mb-4">
            Next generation academy OS
          </Badge>
          <h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">Make your academy look modern and feel alive.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Built for academy owners who want stronger culture, better retention, and a premium member experience around real BJJ rituals.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-foreground)] transition hover:-translate-y-0.5">
              Book a demo <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 text-sm font-semibold transition hover:bg-[var(--surface-hover)]">
              Explore product
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
          <span>Grapply Jiu-Jitsu Academy OS</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard" className="hover:text-[var(--foreground)]">Product</Link>
          <Link href="/tv" className="hover:text-[var(--foreground)]">TV</Link>
          <Link href="/login" className="hover:text-[var(--foreground)]">Login</Link>
        </div>
      </div>
    </footer>
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

function RankingsPanel() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
      <h3 className="text-xl font-semibold">Academy rankings</h3>
      <div className="mt-4 space-y-3">
        {rankedMembers.slice(0, 4).map((member, index) => (
          <div key={member.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <span className="grid size-7 place-items-center rounded-lg bg-[var(--panel)] text-xs font-semibold text-[var(--accent)]">{index + 1}</span>
            <StudentAvatar student={member} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{member.name}</p>
              <p className="text-xs capitalize text-[var(--muted)]">{member.belt} belt</p>
            </div>
            <p className="text-sm font-semibold tabular-nums">{member.points}</p>
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

function AttendancePanel() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
      <h3 className="text-xl font-semibold">Attendance pulse</h3>
      <div className="mt-5 flex h-44 items-end gap-2">
        {attendance.map((item) => (
          <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-end rounded-lg bg-[var(--surface)] p-1" style={{ height: `${Math.max(20, (item.students / maxAttendance) * 100)}%` }}>
              <div className="h-full w-full rounded-md bg-[var(--accent)]" style={{ opacity: 0.38 + item.sparring / 120 }} />
            </div>
            <span className="text-[11px] text-[var(--muted)]">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompetitionPanel() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
      <h3 className="text-xl font-semibold">Competition team</h3>
      <div className="mt-4 space-y-3">
        {competitions.slice(0, 3).map((event) => (
          <div key={event.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{event.name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{event.date} · {event.city}</p>
              </div>
              <Badge variant="muted">{event.registered_students.length} athletes</Badge>
            </div>
          </div>
        ))}
      </div>
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
