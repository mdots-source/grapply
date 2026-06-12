"use client";

import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import {
  Activity,
  CalendarDays,
  Dumbbell,
  Flame,
  Home,
  ListChecks,
  Lock,
  LogOut,
  Medal,
  Mountain,
  Trophy,
  UserRound,
} from "lucide-react";
import { AgGridHost } from "@/components/ag-grid-host";
import { BeltPill } from "@/components/belt-pill";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Student } from "@/data/academy";
import type { Competition } from "@/data/competitions";
import type { Club, ClubClass, PlatformRole, PlatformUser } from "@/data/platform";
import type { TrainingCamp } from "@/data/training-camps";
import { type TrainingPost, typeLabels } from "@/data/training-feed";
import type { DashboardData, RankedMember } from "@/lib/backend-data";
import { cn, initials } from "@/lib/utils";

type MiniSession = {
  user: PlatformUser;
  activeClub: Club;
  activeRole: PlatformRole;
};

type StudentMiniAppProps = {
  session: MiniSession | null;
  initialData?: {
    dashboard: DashboardData | null;
    classes: ClubClass[];
    competitions: Competition[];
    trainingCamps: TrainingCamp[];
    rankings: RankedMember[];
    posts: TrainingPost[];
  };
};

type TabId = "today" | "schedule" | "events" | "rankings" | "profile";

const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: "today", label: "Today", icon: Home },
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "events", label: "Events", icon: Medal },
  { id: "rankings", label: "Rankings", icon: Trophy },
  { id: "profile", label: "Profile", icon: UserRound },
];

const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
        HapticFeedback?: {
          impactOccurred?: (style: "light" | "medium" | "heavy") => void;
          notificationOccurred?: (type: "success" | "warning" | "error") => void;
        };
      };
    };
  }
}

export function StudentMiniApp({ session, initialData }: StudentMiniAppProps) {
  const [activeTab, setActiveTab] = useState<TabId>("today");

  useEffect(() => {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
  }, []);

  if (!session) return <MobileLogin />;

  const classes = initialData?.classes ?? [];
  const nextClass = pickNextClass(classes);
  const currentStudent = findStudentProfile(initialData?.rankings ?? [], session.user);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-[linear-gradient(180deg,var(--panel-strong),var(--background))]">
        <MobileHeader session={session} currentStudent={currentStudent} />
        <section className="flex-1 overflow-y-auto px-4 pb-28 pt-3">
          {activeTab === "today" && (
            <TodayView
              session={session}
              student={currentStudent}
              dashboard={initialData?.dashboard ?? null}
              classes={classes}
              posts={initialData?.posts ?? []}
              nextClass={nextClass}
              onOpenSchedule={() => setActiveTab("schedule")}
            />
          )}
          {activeTab === "schedule" && <ScheduleView classes={classes} nextClass={nextClass} />}
          {activeTab === "events" && (
            <EventsView competitions={initialData?.competitions ?? []} trainingCamps={initialData?.trainingCamps ?? []} />
          )}
          {activeTab === "rankings" && <RankingsView rankings={initialData?.rankings ?? []} currentStudent={currentStudent} />}
          {activeTab === "profile" && <ProfileView session={session} student={currentStudent} posts={initialData?.posts ?? []} />}
        </section>
        <MobileNav activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </main>
  );
}

function MobileLogin() {
  const [email, setEmail] = useState("eli@grapply.app");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnTo: "/schedule" }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error ?? "Login failed.");
      window.location.reload();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-5 text-[var(--foreground)]">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex items-center gap-3">
          <BrandLogo className="size-12 border border-[var(--border)]" priority />
          <div>
            <p className="text-lg font-black">Grapply</p>
            <p className="text-sm text-[var(--muted)]">Student mobile app</p>
          </div>
        </div>
        <form onSubmit={submit} className="glass rounded-[22px] p-5">
          <div className="mb-5 grid size-11 place-items-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]">
            <Lock size={20} />
          </div>
          <h1 className="text-2xl font-semibold">Open your academy</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Use your Grapply student login to enter the mobile app.</p>
          <div className="mt-6 space-y-3">
            <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" inputMode="email" autoComplete="email" placeholder="Email" />
            <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Password" />
          </div>
          {error && <p className="mt-3 rounded-lg border border-[var(--accent-coral)]/30 bg-[var(--accent-coral)]/10 px-3 py-2 text-sm text-[var(--accent-coral)]">{error}</p>}
          <Button type="submit" variant="primary" className="mt-5 h-12 w-full" disabled={loading}>
            {loading ? "Opening..." : "Log in"}
          </Button>
        </form>
      </div>
    </main>
  );
}

function MobileHeader({ session, currentStudent }: { session: MiniSession; currentStudent: Student | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--panel-strong)_92%,transparent)] px-4 pb-3 pt-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{session.activeClub.name}</p>
          <h1 className="mt-1 truncate text-xl font-semibold">Student App</h1>
        </div>
        <a
          href="/api/auth/logout"
          aria-label="Log out"
          className="grid size-10 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
        >
          <LogOut size={17} />
        </a>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--panel)] text-sm font-black">
          {initials(session.user.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{session.user.name}</p>
          <p className="truncate text-xs text-[var(--muted)]">{session.user.email}</p>
        </div>
        {currentStudent && <BeltPill belt={currentStudent.belt} stripes={currentStudent.stripes} />}
      </div>
    </header>
  );
}

function TodayView({
  session,
  student,
  dashboard,
  classes,
  posts,
  nextClass,
  onOpenSchedule,
}: {
  session: MiniSession;
  student: Student | null;
  dashboard: DashboardData | null;
  classes: ClubClass[];
  posts: TrainingPost[];
  nextClass: ClubClass | null;
  onOpenSchedule: () => void;
}) {
  const [checkedInClassId, setCheckedInClassId] = useState<string | null>(null);
  const checkedIn = Boolean(nextClass && checkedInClassId === nextClass.id);

  function checkIn() {
    if (!nextClass) return;
    setCheckedInClassId(nextClass.id);
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("success");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(155deg,color-mix(in_srgb,var(--accent)_18%,transparent),var(--surface))] p-5 shadow-[var(--glow-accent)]">
        <p className="text-sm text-[var(--muted)]">Welcome back,</p>
        <h2 className="mt-1 text-3xl font-semibold leading-tight">{session.user.name.split(" ")[0]}</h2>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Metric label="Hours" value={student ? String(student.totalHours) : String(dashboard?.stats.weeklyAttendance ?? 0)} />
          <Metric label="Streak" value={student ? String(student.streak) : "0"} />
          <Metric label="Points" value={student ? String(student.points) : "0"} />
        </div>
      </section>

      <section className="rounded-[22px] border border-[var(--border)] bg-[var(--panel)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Next class</p>
            <h3 className="mt-2 text-xl font-semibold">{nextClass?.name ?? "No class today"}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {nextClass ? `${nextClass.day} ${nextClass.time} · ${nextClass.coach} · ${nextClass.mat}` : "Check the schedule for upcoming training."}
            </p>
          </div>
          <CalendarDays className="mt-1 text-[var(--accent)]" size={22} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" variant="primary" className="h-11" onClick={checkIn} disabled={!nextClass || checkedIn}>
            <ListChecks size={16} />
            {checkedIn ? "Checked in" : "Check in"}
          </Button>
          <Button type="button" variant="surface" className="h-11" onClick={onOpenSchedule}>
            Schedule
          </Button>
        </div>
      </section>

      <section>
        <SectionTitle icon={Activity} title="Club updates" />
        <div className="mt-3 space-y-3">
          {posts.slice(0, 3).map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
          {posts.length === 0 && <EmptyPanel text="No updates yet." />}
        </div>
      </section>

      <section>
        <SectionTitle icon={Dumbbell} title="This week" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {classes.slice(0, 4).map((item) => (
            <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">{item.day} · {item.time}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ScheduleView({ classes, nextClass }: { classes: ClubClass[]; nextClass: ClubClass | null }) {
  const [selectedDay, setSelectedDay] = useState(nextClass?.day ?? dayOrder[0]);
  const rowData = useMemo(() => classes.filter((item) => item.day === selectedDay).sort((a, b) => a.time.localeCompare(b.time)), [classes, selectedDay]);
  const columnDefs = useMemo<ColDef<ClubClass>[]>(
    () => [
      {
        headerName: "Time",
        field: "time",
        width: 78,
        pinned: "left",
        cellRenderer: (params: { value: string }) => <span className="text-base font-black text-[var(--foreground)]">{params.value}</span>,
      },
      {
        headerName: "Class",
        field: "name",
        flex: 1.4,
        minWidth: 178,
        cellRenderer: (params: { data: ClubClass }) => <ScheduleClassCell item={params.data} active={params.data.id === nextClass?.id} />,
      },
      {
        headerName: "Mat",
        field: "mat",
        width: 98,
        cellRenderer: (params: { data: ClubClass }) => (
          <div className="flex h-full items-center">
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">{params.data.mat}</span>
          </div>
        ),
      },
    ],
    [nextClass?.id],
  );

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Schedule</p>
        <h2 className="mt-2 text-3xl font-semibold">Train this week</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Pick a day and swipe the grid to inspect class details.</p>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {dayOrder.map((day) => {
          const count = classes.filter((item) => item.day === day).length;
          const active = selectedDay === day;
          return (
            <button
              type="button"
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "min-w-[66px] rounded-2xl border px-3 py-3 text-left transition",
                active
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]",
              )}
            >
              <span className="block text-sm font-black">{day}</span>
              <span className="mt-1 block text-[11px] opacity-75">{count} classes</span>
            </button>
          );
        })}
      </div>

      {nextClass && (
        <div className="rounded-[22px] border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Up next</p>
          <p className="mt-2 text-lg font-semibold">{nextClass.name}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{nextClass.day} {nextClass.time} · {nextClass.coach}</p>
        </div>
      )}

      <AgGridHost className="oss-mobile-schedule-grid ag-theme-quartz h-[480px] w-full">
        <AgGridReact<ClubClass>
          theme="legacy"
          rowData={rowData}
          columnDefs={columnDefs}
          rowHeight={92}
          headerHeight={42}
          suppressCellFocus
          suppressMovableColumns
          domLayout="normal"
          overlayNoRowsTemplate="<span>No classes on this day.</span>"
        />
      </AgGridHost>
    </div>
  );
}

function EventsView({ competitions, trainingCamps }: { competitions: Competition[]; trainingCamps: TrainingCamp[] }) {
  return (
    <div className="space-y-6">
      <section>
        <SectionTitle icon={Medal} title="Competitions" />
        <div className="mt-3 space-y-3">
          {competitions.map((event) => (
            <EventCard
              key={event.id}
              title={event.name}
              meta={`${event.date} · ${event.location}`}
              detail={`${event.type} · ${event.status}`}
              progress={event.prep}
            />
          ))}
        </div>
      </section>
      <section>
        <SectionTitle icon={Mountain} title="Training camps" />
        <div className="mt-3 space-y-3">
          {trainingCamps.map((camp) => (
            <EventCard
              key={camp.id}
              title={camp.name}
              meta={`${camp.date} - ${camp.endDate} · ${camp.city}`}
              detail={`${camp.focus} · ${camp.status}`}
              progress={camp.prep}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function RankingsView({ rankings, currentStudent }: { rankings: RankedMember[]; currentStudent: Student | null }) {
  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Rankings</p>
        <h2 className="mt-2 text-3xl font-semibold">Academy points</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Sorted by points, independent of belt hierarchy.</p>
      </section>
      <div className="space-y-3">
        {rankings.slice(0, 12).map((member) => (
          <div
            key={member.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border bg-[var(--surface)] p-3",
              currentStudent?.id === member.id ? "border-[var(--accent)]" : "border-[var(--border)]",
            )}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--panel)] text-sm font-black">#{member.rank}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{member.name}</p>
              <p className="text-xs text-[var(--muted)]">{member.wins} wins · {member.totalHours}h</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black">{member.points}</p>
              <p className="text-[11px] text-[var(--muted)]">points</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileView({ session, student, posts }: { session: MiniSession; student: Student | null; posts: TrainingPost[] }) {
  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-5 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-[22px] border border-[var(--border)] bg-[var(--surface)] text-2xl font-black">
          {initials(session.user.name)}
        </div>
        <h2 className="mt-4 text-2xl font-semibold">{session.user.name}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{session.activeClub.name}</p>
        {student && <BeltPill belt={student.belt} stripes={student.stripes} className="mt-4" />}
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Total hours" value={student ? String(student.totalHours) : "0"} />
        <Metric label="Last 30 days" value={student ? String(student.classes30) : "0"} />
        <Metric label="Streak" value={student ? String(student.streak) : "0"} />
        <Metric label="Points" value={student ? String(student.points) : "0"} />
      </div>
      <section>
        <SectionTitle icon={Flame} title="Your feed" />
        <div className="mt-3 space-y-3">
          {posts.slice(0, 4).map((post) => <FeedCard key={post.id} post={post} />)}
        </div>
      </section>
    </div>
  );
}

function MobileNav({ activeTab, onChange }: { activeTab: TabId; onChange: (tab: TabId) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--panel-strong)_94%,transparent)] px-3 pb-[max(14px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onChange(tab.id);
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={cn(
                "grid min-h-[58px] place-items-center rounded-2xl px-1 text-[11px] font-semibold transition",
                active ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted)]",
              )}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function ScheduleClassCell({ item, active }: { item: ClubClass; active: boolean }) {
  return (
    <div className="flex h-full min-w-0 flex-col justify-center">
      <div className="flex items-center gap-2">
        {active && <span className="size-2 rounded-full bg-[var(--status-live)]" />}
        <p className="truncate text-sm font-semibold">{item.name}</p>
      </div>
      <p className="mt-1 truncate text-xs text-[var(--muted)]">{item.coach}</p>
      <p className="mt-2 truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">{item.level}</p>
    </div>
  );
}

function EventCard({ title, meta, detail, progress }: { title: string; meta: string; detail: string; progress: number }) {
  return (
    <article className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{meta}</p>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{detail}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--panel)]">
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </div>
    </article>
  );
}

function FeedCard({ post }: { post: TrainingPost }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-[var(--accent)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--accent)]">{typeLabels[post.type]}</span>
        <span className="text-[11px] text-[var(--muted)]">{post.date} · {post.time}</span>
      </div>
      <p className="mt-3 text-sm font-semibold">{post.title}</p>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{post.summary}</p>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <p className="text-xl font-black">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]">
        <Icon size={17} />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">{text}</div>;
}

function findStudentProfile(rankings: RankedMember[], user: PlatformUser) {
  const byName = rankings.find((member) => member.name.toLowerCase() === user.name.toLowerCase());
  if (byName) return byName;
  return rankings.find((member) => member.belt === user.belt && member.stripes === user.stripes) ?? null;
}

function pickNextClass(classes: ClubClass[]) {
  if (classes.length === 0) return null;
  const today = dayOrder[(new Date().getDay() + 6) % 7];
  const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const todayClasses = classes.filter((item) => item.day === today).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  return todayClasses.find((item) => timeToMinutes(item.time) >= currentMinutes) ?? todayClasses[0] ?? classes[0];
}

function timeToMinutes(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}
