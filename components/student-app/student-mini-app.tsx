"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import {
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Globe2,
  Home,
  ListChecks,
  Lock,
  LogOut,
  Medal,
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
import type { Club, ClubClass, ClubMembership, PlatformRole, PlatformUser } from "@/data/platform";
import type { TrainingCamp } from "@/data/training-camps";
import type { TrainingPost } from "@/data/training-feed";
import type { DashboardData, RankedMember } from "@/lib/backend-data";
import { cn, initials } from "@/lib/utils";

type MiniSession = {
  user: PlatformUser;
  activeClub: Club | null;
  activeRole: PlatformRole | null;
  memberships: Array<ClubMembership & { club: Club }>;
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
type Lang = "en" | "es" | "pt" | "ru";

const langKey = "grapply-mobile-language";
const clubConfirmedKey = "grapply-mobile-club-confirmed";
const chooseClubAfterLoginKey = "grapply-mobile-choose-club";
const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type DayLabel = (typeof dayOrder)[number];

const languages: Array<{ id: Lang; label: string }> = [
  { id: "en", label: "EN" },
  { id: "es", label: "ES" },
  { id: "pt", label: "PT" },
  { id: "ru", label: "RU" },
];

const copy = {
  en: {
    loginTitle: "Sign in",
    email: "Email",
    password: "Password",
    login: "Log in",
    opening: "Opening",
    chooseClub: "Choose academy",
    continue: "Continue",
    language: "Language",
    today: "Today",
    schedule: "Schedule",
    events: "Events",
    rankings: "Rankings",
    profile: "Profile",
    welcome: "Hi",
    nextClass: "Next class",
    noClass: "No class",
    checkIn: "Check in",
    checkedIn: "Checked in",
    updates: "Updates",
    week: "Week",
    upNext: "Up next",
    competitions: "Competitions",
    camps: "Camps",
    points: "Points",
    hours: "Hours",
    streak: "Streak",
    month: "30 days",
    wins: "wins",
    select: "Select",
    switchClub: "Switch",
    noUpdates: "No updates",
    time: "Time",
    class: "Class",
    mat: "Mat",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    classes: "classes",
  },
  es: {
    loginTitle: "Entrar",
    email: "Email",
    password: "Contraseña",
    login: "Entrar",
    opening: "Abriendo",
    chooseClub: "Elige academia",
    continue: "Continuar",
    language: "Idioma",
    today: "Hoy",
    schedule: "Horario",
    events: "Eventos",
    rankings: "Ranking",
    profile: "Perfil",
    welcome: "Hola",
    nextClass: "Próxima clase",
    noClass: "Sin clase",
    checkIn: "Check-in",
    checkedIn: "Listo",
    updates: "Novedades",
    week: "Semana",
    upNext: "Siguiente",
    competitions: "Competiciones",
    camps: "Camps",
    points: "Puntos",
    hours: "Horas",
    streak: "Racha",
    month: "30 días",
    wins: "victorias",
    select: "Elegir",
    switchClub: "Cambiar",
    noUpdates: "Sin novedades",
    time: "Hora",
    class: "Clase",
    mat: "Tatami",
    days: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    classes: "clases",
  },
  pt: {
    loginTitle: "Entrar",
    email: "Email",
    password: "Senha",
    login: "Entrar",
    opening: "Abrindo",
    chooseClub: "Escolha academia",
    continue: "Continuar",
    language: "Idioma",
    today: "Hoje",
    schedule: "Agenda",
    events: "Eventos",
    rankings: "Ranking",
    profile: "Perfil",
    welcome: "Olá",
    nextClass: "Próxima aula",
    noClass: "Sem aula",
    checkIn: "Check-in",
    checkedIn: "Feito",
    updates: "Novidades",
    week: "Semana",
    upNext: "A seguir",
    competitions: "Competições",
    camps: "Camps",
    points: "Pontos",
    hours: "Horas",
    streak: "Sequência",
    month: "30 dias",
    wins: "vitórias",
    select: "Escolher",
    switchClub: "Trocar",
    noUpdates: "Sem novidades",
    time: "Hora",
    class: "Aula",
    mat: "Tatame",
    days: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    classes: "aulas",
  },
  ru: {
    loginTitle: "Вход",
    email: "Email",
    password: "Пароль",
    login: "Войти",
    opening: "Открываем",
    chooseClub: "Выбери клуб",
    continue: "Продолжить",
    language: "Язык",
    today: "Сегодня",
    schedule: "График",
    events: "События",
    rankings: "Рейтинг",
    profile: "Профиль",
    welcome: "Привет",
    nextClass: "Ближайшая",
    noClass: "Нет класса",
    checkIn: "Чек-ин",
    checkedIn: "Готово",
    updates: "Новости",
    week: "Неделя",
    upNext: "Дальше",
    competitions: "Соревнования",
    camps: "Кемпы",
    points: "Очки",
    hours: "Часы",
    streak: "Серия",
    month: "30 дней",
    wins: "побед",
    select: "Выбрать",
    switchClub: "Сменить",
    noUpdates: "Пока пусто",
    time: "Время",
    class: "Класс",
    mat: "Зал",
    days: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    classes: "классы",
  },
} satisfies Record<Lang, Record<string, string | string[]>>;

const tabIcons: Record<TabId, React.ComponentType<{ size?: number; className?: string }>> = {
  today: Home,
  schedule: CalendarDays,
  events: Medal,
  rankings: Trophy,
  profile: UserRound,
};

const localeByLang: Record<Lang, string> = {
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
  ru: "ru-RU",
};

function startOfCalendarWeek(date: Date) {
  const value = new Date(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addCalendarDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function dayLabelFromDate(date: Date): DayLabel {
  return dayOrder[(date.getDay() + 6) % 7];
}

function formatMobileWeekRange(start: Date, lang: Lang) {
  const locale = localeByLang[lang];
  const end = addCalendarDays(start, 6);
  const startLabel = start.toLocaleDateString(locale, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(locale, { month: "short", day: "numeric" });
  return `${startLabel} - ${endLabel}`;
}

function isSameCalendarDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

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
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [lang, setLang] = useState<Lang>("en");
  const [hydrated, setHydrated] = useState(false);
  const [choosingClub, setChoosingClub] = useState(false);

  useEffect(() => {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
    const storedLang = window.localStorage.getItem(langKey);
    if (isLang(storedLang)) setLang(storedLang);
    setChoosingClub(window.localStorage.getItem(chooseClubAfterLoginKey) === "1");
    setHydrated(true);
  }, []);

  function changeLang(next: Lang) {
    setLang(next);
    window.localStorage.setItem(langKey, next);
  }

  if (!session) return <MobileLogin lang={lang} />;

  const t = copy[lang];
  const classes = initialData?.classes ?? [];
  const rankings = initialData?.rankings ?? [];
  const nextClass = pickNextClass(classes);
  const currentStudent = findStudentProfile(rankings, session.user);
  const needsClub = hydrated && (
    !session.activeClub ||
    choosingClub ||
    searchParams.get("chooseClub") === "1" ||
    window.localStorage.getItem(clubConfirmedKey) !== session.activeClub.slug
  );

  if (needsClub) {
    return (
      <OrganizationPicker
        session={session}
        lang={lang}
        onDone={() => setChoosingClub(false)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col bg-[linear-gradient(180deg,var(--panel-strong),var(--background))]">
        <MobileHeader
          session={session}
          currentStudent={currentStudent}
          lang={lang}
          onChooseClub={() => {
            window.localStorage.setItem(chooseClubAfterLoginKey, "1");
            setChoosingClub(true);
          }}
        />
        <section className="flex-1 overflow-y-auto px-3 pb-24 pt-3 min-[420px]:px-4">
          {activeTab === "today" && (
            <TodayView
              t={t}
              session={session}
              student={currentStudent}
              dashboard={initialData?.dashboard ?? null}
              classes={classes}
              posts={initialData?.posts ?? []}
              nextClass={nextClass}
              onOpenSchedule={() => setActiveTab("schedule")}
            />
          )}
          {activeTab === "schedule" && <ScheduleView t={t} lang={lang} classes={classes} nextClass={nextClass} />}
          {activeTab === "events" && (
            <EventsView t={t} competitions={initialData?.competitions ?? []} trainingCamps={initialData?.trainingCamps ?? []} />
          )}
          {activeTab === "rankings" && <RankingsView t={t} rankings={rankings} currentStudent={currentStudent} />}
          {activeTab === "profile" && <ProfileView t={t} lang={lang} onLanguageChange={changeLang} session={session} student={currentStudent} posts={initialData?.posts ?? []} />}
        </section>
        <MobileNav t={t} activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </main>
  );
}

function MobileLogin({ lang }: { lang: Lang }) {
  const t = copy[lang];
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
      window.localStorage.setItem(chooseClubAfterLoginKey, "1");
      window.localStorage.removeItem(clubConfirmedKey);
      window.location.assign("/app?chooseClub=1");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 py-5 text-[var(--foreground)]">
      <div className="w-full max-w-[430px]">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex items-center gap-3">
            <BrandLogo className="size-11 border border-[var(--border)]" priority />
            <p className="text-lg font-black">Grapply</p>
          </div>
        </div>
        <form onSubmit={submit} className="rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]">
              <Lock size={20} />
            </span>
            <h1 className="text-2xl font-semibold">{t.loginTitle as string}</h1>
          </div>
          <div className="space-y-3">
            <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" inputMode="email" autoComplete="email" placeholder={t.email as string} />
            <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder={t.password as string} />
          </div>
          {error && <p className="mt-3 rounded-xl border border-[var(--accent-coral)]/30 bg-[var(--accent-coral)]/10 px-3 py-2 text-sm text-[var(--accent-coral)]">{error}</p>}
          <Button type="submit" variant="primary" className="mt-4 h-12 w-full" disabled={loading}>
            {loading ? `${t.opening as string}...` : t.login as string}
          </Button>
        </form>
      </div>
    </main>
  );
}

function OrganizationPicker({
  session,
  lang,
  onDone,
}: {
  session: MiniSession;
  lang: Lang;
  onDone: () => void;
}) {
  const t = copy[lang];
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectClub(clubSlug: string) {
    setLoadingSlug(clubSlug);
    setError(null);
    try {
      const response = await fetch("/api/mobile/club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubSlug }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error ?? "Could not select academy.");
      window.localStorage.setItem(clubConfirmedKey, clubSlug);
      window.localStorage.removeItem(chooseClubAfterLoginKey);
      onDone();
      window.location.assign("/app");
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : "Could not select academy.");
    } finally {
      setLoadingSlug(null);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-[var(--foreground)]">
      <div className="mx-auto w-full max-w-[430px]">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex items-center gap-3">
            <BrandLogo className="size-11 border border-[var(--border)]" priority />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{session.user.name}</p>
              <p className="truncate text-xs text-[var(--muted)]">{session.user.email}</p>
            </div>
          </div>
        </div>

        <section className="rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]">
              <Building2 size={20} />
            </span>
            <h1 className="text-2xl font-semibold">{t.chooseClub as string}</h1>
          </div>
          <div className="space-y-2">
            {session.memberships.map((membership) => {
              const active = membership.club.slug === session.activeClub?.slug;
              return (
                <button
                  key={membership.club.slug}
                  type="button"
                  onClick={() => selectClub(membership.club.slug)}
                  disabled={Boolean(loadingSlug)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
                    active ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-[var(--border)] bg-[var(--surface)]",
                  )}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--panel)] text-sm font-black">
                    {initials(membership.club.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{membership.club.name}</span>
                    <span className="block truncate text-xs text-[var(--muted)]">{membership.club.location}</span>
                  </span>
                  {loadingSlug === membership.club.slug ? (
                    <span className="text-xs text-[var(--muted)]">...</span>
                  ) : active ? (
                    <Check size={18} className="text-[var(--accent)]" />
                  ) : (
                    <ChevronRight size={18} className="text-[var(--muted)]" />
                  )}
                </button>
              );
            })}
          </div>
          {error && <p className="mt-3 rounded-xl border border-[var(--accent-coral)]/30 bg-[var(--accent-coral)]/10 px-3 py-2 text-sm text-[var(--accent-coral)]">{error}</p>}
        </section>
      </div>
    </main>
  );
}

function MobileHeader({
  session,
  currentStudent,
  lang,
  onChooseClub,
}: {
  session: MiniSession;
  currentStudent: Student | null;
  lang: Lang;
  onChooseClub: () => void;
}) {
  const t = copy[lang];
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--panel-strong)_94%,transparent)] px-3 pb-3 pt-3 backdrop-blur-xl min-[420px]:px-4">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onChooseClub} className="min-w-0 flex-1 text-left">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{session.activeClub?.name}</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{t.switchClub as string}</p>
        </button>
        <a href="/api/auth/logout" aria-label="Log out" className="grid size-10 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
          <LogOut size={17} />
        </a>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--panel)] text-sm font-black">
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

function LanguageSwitch({ lang, onChange, compact = false }: { lang: Lang; onChange: (lang: Lang) => void; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1", compact ? "" : "shrink-0")}>
      {!compact && <Globe2 size={14} className="ml-1 text-[var(--muted)]" />}
      {languages.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "rounded-full px-2 py-1 text-[11px] font-black transition",
            lang === item.id ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted)]",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function TodayView({
  t,
  session,
  student,
  dashboard,
  classes,
  posts,
  nextClass,
  onOpenSchedule,
}: {
  t: (typeof copy)[Lang];
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
    <div className="space-y-3">
      <section className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(155deg,color-mix(in_srgb,var(--accent)_16%,transparent),var(--surface))] p-4 shadow-[var(--glow-accent)]">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-[var(--muted)]">{t.welcome as string}</p>
            <h2 className="truncate text-3xl font-semibold leading-tight">{session.user.name.split(" ")[0]}</h2>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <MiniMetric label={t.hours as string} value={student ? String(student.totalHours) : String(dashboard?.stats.weeklyAttendance ?? 0)} />
            <MiniMetric label={t.streak as string} value={student ? String(student.streak) : "0"} />
            <MiniMetric label={t.points as string} value={student ? String(student.points) : "0"} />
          </div>
        </div>
      </section>

      <section className="rounded-[22px] border border-[var(--border)] bg-[var(--panel)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{t.nextClass as string}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-semibold">{nextClass?.name ?? (t.noClass as string)}</h3>
            {nextClass && <p className="mt-1 truncate text-sm text-[var(--muted)]">{nextClass.day} {nextClass.time} · {nextClass.coach}</p>}
          </div>
          <CalendarDays className="shrink-0 text-[var(--accent)]" size={22} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" variant="primary" className="h-11" onClick={checkIn} disabled={!nextClass || checkedIn}>
            <ListChecks size={16} />
            {checkedIn ? t.checkedIn as string : t.checkIn as string}
          </Button>
          <Button type="button" variant="surface" className="h-11" onClick={onOpenSchedule}>
            {t.schedule as string}
          </Button>
        </div>
      </section>

      <CompactSection title={t.updates as string}>
        {posts.slice(0, 2).map((post) => <FeedCard key={post.id} post={post} />)}
        {posts.length === 0 && <EmptyPanel text={t.noUpdates as string} />}
      </CompactSection>

      <CompactSection title={t.week as string}>
        <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-4">
          {classes.slice(0, 4).map((item) => (
            <div key={item.id} className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="truncate text-sm font-semibold">{item.name}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{item.day} · {item.time}</p>
            </div>
          ))}
        </div>
      </CompactSection>
    </div>
  );
}

function ScheduleView({ t, lang, classes, nextClass }: { t: (typeof copy)[Lang]; lang: Lang; classes: ClubClass[]; nextClass: ClubClass | null }) {
  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => startOfCalendarWeek(today), [today]);
  const todayDay = useMemo(() => dayLabelFromDate(today), [today]);
  const [selectedDay, setSelectedDay] = useState<DayLabel>(todayDay);
  const rowData = useMemo(() => classes.filter((item) => item.day === selectedDay).sort((a, b) => a.time.localeCompare(b.time)), [classes, selectedDay]);
  const selectedIndex = dayOrder.indexOf(selectedDay);
  const selectedDate = addCalendarDays(weekStart, selectedIndex);
  const columnDefs = useMemo<ColDef<ClubClass>[]>(
    () => [
      {
        headerName: t.time as string,
        field: "time",
        width: 74,
        pinned: "left",
        cellRenderer: (params: { value: string }) => <span className="text-[15px] font-black text-[var(--foreground)]">{params.value}</span>,
      },
      {
        headerName: t.class as string,
        field: "name",
        flex: 1,
        minWidth: 178,
        cellRenderer: (params: { data: ClubClass }) => <ScheduleClassCell item={params.data} active={params.data.id === nextClass?.id} />,
      },
      {
        headerName: t.mat as string,
        field: "mat",
        width: 84,
        cellRenderer: (params: { data: ClubClass }) => (
          <div className="flex h-full items-center">
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">{params.data.mat}</span>
          </div>
        ),
      },
    ],
    [nextClass?.id, t],
  );

  const days = t.days as string[];

  return (
    <div className="space-y-4">
      <div className="rounded-[26px] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{t.schedule as string}</p>
            <h2 className="mt-1 truncate text-2xl font-semibold">{formatMobileWeekRange(weekStart, lang)}</h2>
          </div>
          <Button type="button" variant="surface" size="sm" className="shrink-0" onClick={() => setSelectedDay(todayDay)}>
            {t.today as string}
          </Button>
        </div>
        {nextClass && (
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{t.upNext as string}</p>
            <p className="mt-1 truncate text-sm font-semibold">
              {nextClass.day} · {nextClass.time} · {nextClass.name}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {dayOrder.map((day, index) => {
          const count = classes.filter((item) => item.day === day).length;
          const active = selectedDay === day;
          const date = addCalendarDays(weekStart, index);
          const isToday = isSameCalendarDay(date, today);
          return (
            <button
              type="button"
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "min-w-[68px] rounded-2xl border px-3 py-2.5 text-left transition",
                active ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[var(--shadow)]" : "border-[var(--border)] bg-[var(--surface)]",
                isToday && !active ? "border-[var(--accent)]" : "",
              )}
            >
              <span className="flex items-center justify-between gap-2 text-sm font-black">
                {days[index]}
                {isToday && <span className={cn("size-1.5 rounded-full", active ? "bg-[var(--accent-foreground)]" : "bg-[var(--accent)]")} />}
              </span>
              <span className="mt-1 block text-xl font-black leading-none">{date.getDate()}</span>
              <span className="mt-1 block text-[10px] font-semibold opacity-75">
                {count} {t.classes as string}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {days[selectedIndex]} {selectedDate.toLocaleDateString(localeByLang[lang], { month: "short", day: "numeric" })}
          </p>
          <p className="text-xs text-[var(--muted)]">{rowData.length} {t.classes as string}</p>
        </div>
        {selectedDay !== todayDay && (
          <button type="button" className="text-xs font-semibold text-[var(--accent)]" onClick={() => setSelectedDay(todayDay)}>
            {t.today as string}
          </button>
        )}
      </div>

      <AgGridHost className="oss-mobile-schedule-grid ag-theme-quartz h-[min(540px,62vh)] min-h-[420px] w-full">
        <AgGridReact<ClubClass>
          theme="legacy"
          rowData={rowData}
          columnDefs={columnDefs}
          rowHeight={88}
          headerHeight={42}
          defaultColDef={{ resizable: false, suppressMovable: true }}
          suppressCellFocus
          suppressMovableColumns
          domLayout="normal"
          overlayNoRowsTemplate={`<span>${t.noClass as string}</span>`}
        />
      </AgGridHost>
    </div>
  );
}

function EventsView({ t, competitions, trainingCamps }: { t: (typeof copy)[Lang]; competitions: Competition[]; trainingCamps: TrainingCamp[] }) {
  return (
    <div className="space-y-5">
      <CompactSection title={t.competitions as string}>
        {competitions.map((event) => (
          <EventCard key={event.id} title={event.name} meta={`${event.date} · ${event.location}`} detail={`${event.type} · ${event.status}`} progress={event.prep} />
        ))}
      </CompactSection>
      <CompactSection title={t.camps as string}>
        {trainingCamps.map((camp) => (
          <EventCard key={camp.id} title={camp.name} meta={`${camp.date} · ${camp.city}`} detail={`${camp.focus}`} progress={camp.prep} />
        ))}
      </CompactSection>
    </div>
  );
}

function RankingsView({ t, rankings, currentStudent }: { t: (typeof copy)[Lang]; rankings: RankedMember[]; currentStudent: Student | null }) {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">{t.rankings as string}</h2>
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
            <p className="text-xs text-[var(--muted)]">{member.wins} {t.wins as string}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black">{member.points}</p>
            <p className="text-[11px] text-[var(--muted)]">{t.points as string}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileView({
  t,
  lang,
  onLanguageChange,
  session,
  student,
  posts,
}: {
  t: (typeof copy)[Lang];
  lang: Lang;
  onLanguageChange: (lang: Lang) => void;
  session: MiniSession;
  student: Student | null;
  posts: TrainingPost[];
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-4 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-[20px] border border-[var(--border)] bg-[var(--surface)] text-xl font-black">
          {initials(session.user.name)}
        </div>
        <h2 className="mt-3 text-2xl font-semibold">{session.user.name}</h2>
        <p className="mt-1 truncate text-sm text-[var(--muted)]">{session.activeClub?.name}</p>
        {student && <BeltPill belt={student.belt} stripes={student.stripes} className="mt-3" />}
      </section>
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--accent)]">
              <Globe2 size={16} />
            </span>
            <p className="truncate text-sm font-semibold">{t.language as string}</p>
          </div>
          <LanguageSwitch lang={lang} onChange={onLanguageChange} compact />
        </div>
      </section>
      <div className="grid grid-cols-2 gap-2">
        <Metric label={t.hours as string} value={student ? String(student.totalHours) : "0"} />
        <Metric label={t.month as string} value={student ? String(student.classes30) : "0"} />
        <Metric label={t.streak as string} value={student ? String(student.streak) : "0"} />
        <Metric label={t.points as string} value={student ? String(student.points) : "0"} />
      </div>
      <CompactSection title={t.updates as string}>
        {posts.slice(0, 3).map((post) => <FeedCard key={post.id} post={post} />)}
      </CompactSection>
    </div>
  );
}

function MobileNav({ t, activeTab, onChange }: { t: (typeof copy)[Lang]; activeTab: TabId; onChange: (tab: TabId) => void }) {
  const tabIds: TabId[] = ["today", "schedule", "events", "rankings", "profile"];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[520px] border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--panel-strong)_94%,transparent)] px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-1">
        {tabIds.map((tab) => {
          const Icon = tabIcons[tab];
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                onChange(tab);
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={cn(
                "grid min-h-[54px] place-items-center rounded-2xl px-1 text-[10px] font-semibold transition min-[390px]:text-[11px]",
                active ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted)]",
              )}
            >
              <Icon size={18} />
              <span className="max-w-full truncate">{t[tab] as string}</span>
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
        {active && <span className="size-2 shrink-0 rounded-full bg-[var(--status-live)]" />}
        <p className="truncate text-sm font-semibold">{item.name}</p>
      </div>
      <p className="mt-1 truncate text-xs text-[var(--muted)]">{item.coach}</p>
      <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">{item.level}</p>
    </div>
  );
}

function EventCard({ title, meta, detail, progress }: { title: string; meta: string; detail: string; progress: number }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{meta}</p>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{detail}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--panel)]">
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </div>
    </article>
  );
}

function FeedCard({ post }: { post: TrainingPost }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">{post.type}</span>
        <span className="shrink-0 text-[11px] text-[var(--muted)]">{post.date}</span>
      </div>
      <p className="mt-2 text-sm font-semibold">{post.title}</p>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <p className="text-xl font-black">{value}</p>
      <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{label}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[52px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-center">
      <p className="text-base font-black">{value}</p>
      <p className="mt-0.5 max-w-14 truncate text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">{label}</p>
    </div>
  );
}

function CompactSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--muted)]">{text}</div>;
}

function findStudentProfile(rankings: RankedMember[], user: PlatformUser) {
  const byName = rankings.find((member) => member.name.toLowerCase() === user.name.toLowerCase());
  if (byName) return byName;
  return rankings.find((member) => member.belt === user.belt && member.stripes === user.stripes) ?? null;
}

function pickNextClass(classes: ClubClass[]) {
  if (classes.length === 0) return null;
  const now = new Date();
  const todayIndex = dayOrder.indexOf(dayLabelFromDate(now));
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return [...classes].sort((a, b) => nextClassOffset(a, todayIndex, currentMinutes) - nextClassOffset(b, todayIndex, currentMinutes))[0] ?? null;
}

function nextClassOffset(item: ClubClass, todayIndex: number, currentMinutes: number) {
  const classDayIndex = dayOrder.indexOf(item.day as DayLabel);
  const resolvedDayIndex = classDayIndex === -1 ? 0 : classDayIndex;
  let dayOffset = (resolvedDayIndex - todayIndex + 7) % 7;
  const minutes = timeToMinutes(item.time);
  if (dayOffset === 0 && minutes < currentMinutes) dayOffset = 7;
  return dayOffset * 24 * 60 + minutes;
}

function timeToMinutes(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function isLang(value: string | null): value is Lang {
  return value === "en" || value === "es" || value === "pt" || value === "ru";
}
