"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  X,
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
type StatId = "hours" | "attendance" | "streak" | "points";
type StudentEvent = (Competition | TrainingCamp) & { category: "competition" | "camp" };

const langKey = "grapply-mobile-language";
const clubConfirmedKey = "grapply-mobile-club-confirmed";
const chooseClubAfterLoginKey = "grapply-mobile-choose-club";
const checkedInClassesKey = "grapply-mobile-checked-in-classes";
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
    chooseClub: "Academy",
    continue: "Continue",
    language: "Language",
    today: "Today",
    schedule: "Schedule",
    events: "Events",
    rankings: "Rankings",
    profile: "Profile",
    welcome: "Hi",
    nextClass: "Next",
    noClass: "No classes",
    checkIn: "Check in",
    checkedIn: "Checked in",
    checkOut: "Check out",
    details: "Details",
    updates: "Club",
    week: "This week",
    competitions: "Competitions",
    camps: "Camps",
    points: "Points",
    hours: "Hours",
    streak: "Streak",
    month: "30 days",
    wins: "wins",
    select: "Select",
    open: "Open",
    registered: "Registered",
    level: "Level",
    logout: "Logout",
    time: "Time",
    class: "Class",
    mat: "Mat",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    classOne: "class",
    classes: "classes",
  },
  es: {
    loginTitle: "Entrar",
    email: "Email",
    password: "Contraseña",
    login: "Entrar",
    opening: "Abriendo",
    chooseClub: "Academia",
    continue: "Continuar",
    language: "Idioma",
    today: "Hoy",
    schedule: "Horario",
    events: "Eventos",
    rankings: "Ranking",
    profile: "Perfil",
    welcome: "Hola",
    nextClass: "Próxima",
    noClass: "Sin clases",
    checkIn: "Check-in",
    checkedIn: "Listo",
    checkOut: "Salir",
    details: "Detalles",
    updates: "Club",
    week: "Semana",
    competitions: "Competiciones",
    camps: "Camps",
    points: "Puntos",
    hours: "Horas",
    streak: "Racha",
    month: "30 días",
    wins: "victorias",
    select: "Elegir",
    open: "Abierto",
    registered: "Registrado",
    level: "Nivel",
    logout: "Salir",
    time: "Hora",
    class: "Clase",
    mat: "Tatami",
    days: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    classOne: "clase",
    classes: "clases",
  },
  pt: {
    loginTitle: "Entrar",
    email: "Email",
    password: "Senha",
    login: "Entrar",
    opening: "Abrindo",
    chooseClub: "Academia",
    continue: "Continuar",
    language: "Idioma",
    today: "Hoje",
    schedule: "Agenda",
    events: "Eventos",
    rankings: "Ranking",
    profile: "Perfil",
    welcome: "Olá",
    nextClass: "Próxima",
    noClass: "Sem aulas",
    checkIn: "Check-in",
    checkedIn: "Feito",
    checkOut: "Sair",
    details: "Detalhes",
    updates: "Clube",
    week: "Semana",
    competitions: "Competições",
    camps: "Camps",
    points: "Pontos",
    hours: "Horas",
    streak: "Sequência",
    month: "30 dias",
    wins: "vitórias",
    select: "Escolher",
    open: "Aberto",
    registered: "Inscrito",
    level: "Nível",
    logout: "Sair",
    time: "Hora",
    class: "Aula",
    mat: "Tatame",
    days: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    classOne: "aula",
    classes: "aulas",
  },
  ru: {
    loginTitle: "Вход",
    email: "Email",
    password: "Пароль",
    login: "Войти",
    opening: "Открываем",
    chooseClub: "Клуб",
    continue: "Продолжить",
    language: "Язык",
    today: "Сегодня",
    schedule: "График",
    events: "События",
    rankings: "Рейтинг",
    profile: "Профиль",
    welcome: "Привет",
    nextClass: "Дальше",
    noClass: "Нет занятий",
    checkIn: "Чек-ин",
    checkedIn: "Готово",
    checkOut: "Отменить",
    details: "Детали",
    updates: "Клуб",
    week: "Неделя",
    competitions: "Соревнования",
    camps: "Кемпы",
    points: "Очки",
    hours: "Часы",
    streak: "Серия",
    month: "30 дней",
    wins: "побед",
    select: "Выбрать",
    open: "Открыто",
    registered: "Записан",
    level: "Уровень",
    logout: "Выйти",
    time: "Время",
    class: "Класс",
    mat: "Зал",
    days: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    classOne: "занятие",
    classes: "занятий",
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

function classesForDay(classes: ClubClass[], day: DayLabel) {
  return classes.filter((item) => item.day === day).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("open") || normalized.includes("early")) return "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]";
  if (normalized.includes("wait")) return "border-[var(--accent-coral)]/30 bg-[var(--accent-coral)]/10 text-[var(--accent-coral)]";
  return "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)]";
}

function getEventFocus(event: StudentEvent) {
  return "focus" in event ? event.focus : event.type;
}

function getEventHost(event: StudentEvent) {
  return "host" in event ? event.host : event.venue;
}

function formatClassCount(count: number, t: (typeof copy)[Lang]) {
  return `${count} ${count === 1 ? t.classOne as string : t.classes as string}`;
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
  const [checkedInClassIds, setCheckedInClassIds] = useState<string[]>([]);

  useEffect(() => {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
    const storedLang = window.localStorage.getItem(langKey);
    if (isLang(storedLang)) setLang(storedLang);
    setChoosingClub(window.localStorage.getItem(chooseClubAfterLoginKey) === "1");
    if (session?.user && session.activeClub) {
      const storedCheckIns = window.localStorage.getItem(getCheckInStorageKey(session));
      if (storedCheckIns) {
        try {
          const parsed = JSON.parse(storedCheckIns);
          if (Array.isArray(parsed)) setCheckedInClassIds(parsed.filter((item): item is string => typeof item === "string"));
        } catch {
          setCheckedInClassIds([]);
        }
      }
    }
    setHydrated(true);
  }, [session?.activeClub?.slug, session?.user.id]);

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

  function toggleCheckIn(classItem: ClubClass) {
    if (!session) return;
    const currentSession: MiniSession = session;
    setCheckedInClassIds((current) => {
      const next = current.includes(classItem.id) ? current.filter((id) => id !== classItem.id) : [...current, classItem.id];
      window.localStorage.setItem(getCheckInStorageKey(currentSession), JSON.stringify(next));
      return next;
    });
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.(checkedInClassIds.includes(classItem.id) ? "warning" : "success");
  }

  if (!hydrated) return <MobileLoading />;

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
          onOpenProfile={() => setActiveTab("profile")}
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
              checkedInClassIds={checkedInClassIds}
              onToggleCheckIn={toggleCheckIn}
              onOpenSchedule={() => setActiveTab("schedule")}
            />
          )}
          {activeTab === "schedule" && (
            <ScheduleView t={t} lang={lang} classes={classes} nextClass={nextClass} checkedInClassIds={checkedInClassIds} onToggleCheckIn={toggleCheckIn} />
          )}
          {activeTab === "events" && (
            <EventsView t={t} competitions={initialData?.competitions ?? []} trainingCamps={initialData?.trainingCamps ?? []} />
          )}
          {activeTab === "rankings" && <RankingsView t={t} rankings={rankings} currentStudent={currentStudent} />}
          {activeTab === "profile" && (
            <ProfileView
              t={t}
              lang={lang}
              onLanguageChange={changeLang}
              onChooseClub={() => {
                window.localStorage.setItem(chooseClubAfterLoginKey, "1");
                setChoosingClub(true);
              }}
              session={session}
              student={currentStudent}
              classes={classes}
              checkedInClassIds={checkedInClassIds}
            />
          )}
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
        body: JSON.stringify({ email, password, returnTo: "/app" }),
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

function MobileLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 text-[var(--foreground)]">
      <div className="grid gap-3 text-center">
        <BrandLogo className="mx-auto size-12 border border-[var(--border)]" priority />
        <div className="mx-auto h-1 w-20 overflow-hidden rounded-full bg-[var(--surface)]">
          <div className="h-full w-1/2 rounded-full bg-[var(--accent)]" />
        </div>
      </div>
    </main>
  );
}

function MobileHeader({
  session,
  currentStudent,
  onOpenProfile,
}: {
  session: MiniSession;
  currentStudent: Student | null;
  onOpenProfile: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--panel-strong)_94%,transparent)] px-3 pb-3 pt-3 backdrop-blur-xl min-[420px]:px-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{session.activeClub?.name}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenProfile}
        className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5 text-left transition active:scale-[0.99]"
      >
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--panel)] text-sm font-black">
          {initials(session.user.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{session.user.name}</p>
          <p className="truncate text-xs text-[var(--muted)]">{session.user.email}</p>
        </div>
        {currentStudent && <BeltPill belt={currentStudent.belt} stripes={currentStudent.stripes} />}
      </button>
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
  checkedInClassIds,
  onToggleCheckIn,
  onOpenSchedule,
}: {
  t: (typeof copy)[Lang];
  session: MiniSession;
  student: Student | null;
  dashboard: DashboardData | null;
  classes: ClubClass[];
  posts: TrainingPost[];
  nextClass: ClubClass | null;
  checkedInClassIds: string[];
  onToggleCheckIn: (classItem: ClubClass) => void;
  onOpenSchedule: () => void;
}) {
  const todayClasses = useMemo(() => classesForDay(classes, dayLabelFromDate(new Date())), [classes]);
  const checkedIn = Boolean(nextClass && checkedInClassIds.includes(nextClass.id));

  return (
    <div className="space-y-4">
      <section className="rounded-[26px] bg-[linear-gradient(155deg,color-mix(in_srgb,var(--accent)_18%,transparent),var(--panel))] p-4 shadow-[var(--glow-accent)]">
        <div className="min-w-0">
          <p className="text-sm text-[var(--muted)]">{t.welcome as string}, {session.user.name.split(" ")[0]}</p>
          <h2 className="mt-2 truncate text-3xl font-semibold leading-tight">{nextClass?.time ?? "--:--"}</h2>
          <p className="mt-1 truncate text-lg font-semibold">{nextClass?.name ?? (t.noClass as string)}</p>
          {nextClass && <p className="mt-1 truncate text-sm text-[var(--muted)]">{nextClass.day} · {nextClass.coach} · {nextClass.mat}</p>}
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <Button type="button" variant={checkedIn ? "surface" : "primary"} className="h-11" onClick={() => nextClass && onToggleCheckIn(nextClass)} disabled={!nextClass}>
            <ListChecks size={16} />
            {checkedIn ? t.checkOut as string : t.checkIn as string}
          </Button>
          <Button type="button" variant="surface" className="h-11 px-3" onClick={onOpenSchedule} aria-label={t.schedule as string}>
            <CalendarDays size={17} />
          </Button>
        </div>
      </section>

      {todayClasses.length > 0 && (
        <CompactSection title={t.today as string}>
          <div className="space-y-2">
            {todayClasses.map((item) => (
              <ClassAgendaRow key={item.id} item={item} active={item.id === nextClass?.id} checkedIn={checkedInClassIds.includes(item.id)} onClick={() => onToggleCheckIn(item)} actionLabel={t.checkIn as string} checkedLabel={t.checkOut as string} />
            ))}
          </div>
        </CompactSection>
      )}

      <div className="grid grid-cols-3 gap-2">
        <MiniMetric label={t.hours as string} value={student ? String(student.totalHours) : String(dashboard?.stats.weeklyAttendance ?? 0)} />
        <MiniMetric label={t.streak as string} value={student ? String(student.streak) : "0"} />
        <MiniMetric label={t.points as string} value={student ? String(student.points) : "0"} />
      </div>

      {posts.length > 0 && (
        <CompactSection title={t.updates as string}>
          {posts.slice(0, 2).map((post) => <FeedCard key={post.id} post={post} />)}
        </CompactSection>
      )}

    </div>
  );
}

function ScheduleView({
  t,
  lang,
  classes,
  nextClass,
  checkedInClassIds,
  onToggleCheckIn,
}: {
  t: (typeof copy)[Lang];
  lang: Lang;
  classes: ClubClass[];
  nextClass: ClubClass | null;
  checkedInClassIds: string[];
  onToggleCheckIn: (classItem: ClubClass) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => startOfCalendarWeek(today), [today]);
  const todayDay = useMemo(() => dayLabelFromDate(today), [today]);
  const [selectedDay, setSelectedDay] = useState<DayLabel>(todayDay);
  const [selectedClass, setSelectedClass] = useState<ClubClass | null>(null);
  const selectedDayRef = useRef<HTMLButtonElement | null>(null);
  const rowData = useMemo(() => classes.filter((item) => item.day === selectedDay).sort((a, b) => a.time.localeCompare(b.time)), [classes, selectedDay]);
  const selectedIndex = dayOrder.indexOf(selectedDay);
  const selectedDate = addCalendarDays(weekStart, selectedIndex);
  const gridHeightClassName = rowData.length <= 1 ? "h-[132px] w-full" : rowData.length <= 3 ? "h-[316px] w-full" : "h-[min(540px,62vh)] min-h-[360px] w-full";

  useEffect(() => {
    selectedDayRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedDay]);
  const columnDefs = useMemo<ColDef<ClubClass>[]>(
    () => [
      {
        headerName: t.time as string,
        field: "time",
        width: 74,
        pinned: "left",
        cellRenderer: (params: { value: string }) => <span className="text-[15px] font-black text-[var(--accent)]">{params.value}</span>,
      },
      {
        headerName: t.class as string,
        field: "name",
        flex: 1,
        minWidth: 238,
        cellRenderer: (params: { data: ClubClass }) => <ScheduleClassCell item={params.data} active={params.data.id === nextClass?.id} checkedIn={checkedInClassIds.includes(params.data.id)} />,
      },
    ],
    [checkedInClassIds, nextClass?.id, t],
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
      </div>

      <div className="grid grid-cols-7 gap-1.5 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-2">
        {dayOrder.map((day, index) => {
          const dayClasses = classesForDay(classes, day);
          const count = dayClasses.length;
          const active = selectedDay === day;
          const date = addCalendarDays(weekStart, index);
          const isToday = isSameCalendarDay(date, today);
          return (
            <button
              type="button"
              key={day}
              ref={active ? selectedDayRef : undefined}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "min-h-[88px] rounded-2xl border px-1.5 py-2 text-center transition active:scale-[0.98]",
                active ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[var(--shadow)]" : "border-[var(--border)] bg-[var(--surface)]",
                isToday && !active ? "border-[var(--accent)]" : "",
              )}
            >
              <span className="flex items-center justify-center gap-1 text-[11px] font-black">
                {days[index]}
                {isToday && <span className={cn("size-1.5 rounded-full", active ? "bg-[var(--accent-foreground)]" : "bg-[var(--accent)]")} />}
              </span>
              <span className="mt-1 block text-lg font-black leading-none">{date.getDate()}</span>
              <span className="mt-1 flex justify-center gap-0.5">
                {dayClasses.slice(0, 3).map((item) => (
                  <span key={item.id} className={cn("size-1.5 rounded-full", checkedInClassIds.includes(item.id) ? "bg-[var(--status-live)]" : active ? "bg-[var(--accent-foreground)]/80" : "bg-[var(--accent)]")} />
                ))}
              </span>
              <span className="mt-1 block truncate text-[9px] font-semibold opacity-75">{count > 0 ? dayClasses[0].time : "-"}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {days[selectedIndex]} {selectedDate.toLocaleDateString(localeByLang[lang], { month: "short", day: "numeric" })}
          </p>
          <p className="text-xs text-[var(--muted)]">{formatClassCount(rowData.length, t)}</p>
        </div>
        {selectedDay !== todayDay && (
          <button type="button" className="text-xs font-semibold text-[var(--accent)]" onClick={() => setSelectedDay(todayDay)}>
            {t.today as string}
          </button>
        )}
      </div>

      {rowData.length > 0 ? (
        <AgGridHost className="oss-mobile-schedule-grid ag-theme-quartz" heightClassName={gridHeightClassName}>
          <AgGridReact<ClubClass>
            theme="legacy"
            rowData={rowData}
            columnDefs={columnDefs}
            rowHeight={92}
            headerHeight={38}
            defaultColDef={{ resizable: false, suppressMovable: true }}
            suppressCellFocus
            suppressMovableColumns
            domLayout="normal"
            onRowClicked={(event) => {
              if (event.data) setSelectedClass(event.data);
            }}
          />
        </AgGridHost>
      ) : (
        <CompactEmptySchedule t={t} selectedDate={selectedDate} lang={lang} />
      )}

      {selectedClass && (
        <ClassDetailSheet
          t={t}
          item={selectedClass}
          checkedIn={checkedInClassIds.includes(selectedClass.id)}
          onToggleCheckIn={() => onToggleCheckIn(selectedClass)}
          onClose={() => setSelectedClass(null)}
        />
      )}
    </div>
  );
}

function EventsView({ t, competitions, trainingCamps }: { t: (typeof copy)[Lang]; competitions: Competition[]; trainingCamps: TrainingCamp[] }) {
  const [selectedEvent, setSelectedEvent] = useState<StudentEvent | null>(null);

  return (
    <div className="space-y-5">
      {competitions.length > 0 && (
        <CompactSection title={t.competitions as string}>
          {competitions.map((event) => (
            <EventCard key={event.id} title={event.name} meta={`${event.date} · ${event.location}`} detail={event.type} status={event.status} onClick={() => setSelectedEvent({ ...event, category: "competition" })} />
          ))}
        </CompactSection>
      )}
      {trainingCamps.length > 0 && (
        <CompactSection title={t.camps as string}>
          {trainingCamps.map((camp) => (
            <EventCard key={camp.id} title={camp.name} meta={`${camp.date} · ${camp.city}`} detail={camp.type} status={camp.status} onClick={() => setSelectedEvent({ ...camp, category: "camp" })} />
          ))}
        </CompactSection>
      )}
      {selectedEvent && <EventDetailSheet t={t} event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
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
  onChooseClub,
  session,
  student,
  classes,
  checkedInClassIds,
}: {
  t: (typeof copy)[Lang];
  lang: Lang;
  onLanguageChange: (lang: Lang) => void;
  onChooseClub: () => void;
  session: MiniSession;
  student: Student | null;
  classes: ClubClass[];
  checkedInClassIds: string[];
}) {
  const [activeStat, setActiveStat] = useState<StatId | null>(null);

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
      <section className="grid grid-cols-2 gap-2">
        <Button type="button" variant="surface" className="h-11 justify-center" onClick={onChooseClub}>
          <Building2 size={16} />
          {t.chooseClub as string}
        </Button>
        <Button asChild variant="surface" className="h-11 justify-center">
          <a href="/api/auth/logout">
            <LogOut size={16} />
            {t.logout as string}
          </a>
        </Button>
      </section>
      <div className="grid grid-cols-2 gap-2">
        <Metric label={t.hours as string} value={student ? String(student.totalHours) : "0"} onClick={() => setActiveStat("hours")} />
        <Metric label={t.month as string} value={student ? String(student.classes30) : "0"} onClick={() => setActiveStat("attendance")} />
        <Metric label={t.streak as string} value={student ? String(student.streak) : "0"} onClick={() => setActiveStat("streak")} />
        <Metric label={t.points as string} value={student ? String(student.points) : "0"} onClick={() => setActiveStat("points")} />
      </div>
      {activeStat && (
        <StatDetailSheet
          t={t}
          stat={activeStat}
          student={student}
          classes={classes}
          checkedInClassIds={checkedInClassIds}
          onClose={() => setActiveStat(null)}
        />
      )}
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

function ClassAgendaRow({
  item,
  active,
  checkedIn,
  onClick,
  actionLabel,
  checkedLabel,
}: {
  item: ClubClass;
  active?: boolean;
  checkedIn?: boolean;
  onClick: () => void;
  actionLabel: string;
  checkedLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border bg-[var(--surface)] p-3 text-left transition active:scale-[0.99]",
        active ? "border-[var(--accent)]" : "border-[var(--border)]",
      )}
    >
      <span className="w-14 shrink-0 text-base font-black text-[var(--accent)]">{item.time}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{item.name}</span>
        <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{item.coach} · {item.mat}</span>
      </span>
      <span className={cn("shrink-0 rounded-full px-2 py-1 text-[10px] font-black", checkedIn ? "bg-[var(--status-live)] text-[var(--background)]" : "bg-[var(--panel)] text-[var(--muted)]")}>
        {checkedIn ? checkedLabel : actionLabel}
      </span>
    </button>
  );
}

function ScheduleClassCell({ item, active, checkedIn }: { item: ClubClass; active: boolean; checkedIn: boolean }) {
  return (
    <div className="flex h-full min-w-0 flex-col justify-center">
      <div className="flex items-center gap-2">
        {active && <span className="size-2 shrink-0 rounded-full bg-[var(--status-live)]" />}
        <p className="truncate text-sm font-semibold">{item.name}</p>
      </div>
      <p className="mt-1 truncate text-xs text-[var(--muted)]">{item.coach} · {item.mat}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="truncate text-[11px] font-semibold text-[var(--accent)]">{item.level}</span>
        {checkedIn && <span className="rounded-full bg-[var(--status-live)] px-2 py-0.5 text-[10px] font-black text-[var(--background)]">IN</span>}
      </div>
    </div>
  );
}

function CompactEmptySchedule({ t, selectedDate, lang }: { t: (typeof copy)[Lang]; selectedDate: Date; lang: Lang }) {
  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center">
      <p className="text-sm font-semibold">{t.noClass as string}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{selectedDate.toLocaleDateString(localeByLang[lang], { month: "short", day: "numeric" })}</p>
    </div>
  );
}

function ClassDetailSheet({
  t,
  item,
  checkedIn,
  onToggleCheckIn,
  onClose,
}: {
  t: (typeof copy)[Lang];
  item: ClubClass;
  checkedIn: boolean;
  onToggleCheckIn: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[color-mix(in_srgb,var(--background)_52%,transparent)] px-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-sm">
      <section className="w-full max-w-[500px] rounded-[28px] border border-[var(--border)] bg-[var(--panel-strong)] p-4 shadow-[var(--shadow)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-3xl font-black text-[var(--accent)]">{item.time}</p>
            <h2 className="mt-2 text-xl font-semibold leading-tight">{item.name}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{item.day} · {item.coach}</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric label={t.mat as string} value={item.mat} />
          <Metric label={t.level as string} value={item.level} />
        </div>

        <Button type="button" variant={checkedIn ? "surface" : "primary"} className="mt-4 h-12 w-full" onClick={onToggleCheckIn}>
          <ListChecks size={16} />
          {checkedIn ? t.checkOut as string : t.checkIn as string}
        </Button>
      </section>
    </div>
  );
}

function EventCard({ title, meta, detail, status, onClick }: { title: string; meta: string; detail: string; status: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition active:scale-[0.99]">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-semibold leading-5">{title}</p>
        <span className={cn("shrink-0 rounded-full border px-2 py-1 text-[10px] font-black", statusTone(status))}>{status}</span>
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">{meta}</p>
      <p className="mt-2 flex items-center justify-between gap-2 text-xs font-semibold text-[var(--accent)]">
        <span>{detail}</span>
        <ChevronRight size={15} />
      </p>
    </button>
  );
}

function EventDetailSheet({ t, event, onClose }: { t: (typeof copy)[Lang]; event: StudentEvent; onClose: () => void }) {
  const cost = "estimatedCost" in event ? event.estimatedCost : null;
  const spots = "spotsTotal" in event ? `${event.registered_students.length}/${event.spotsTotal}` : String(event.registered_students.length);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[color-mix(in_srgb,var(--background)_52%,transparent)] px-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-sm">
      <section className="w-full max-w-[500px] rounded-[28px] border border-[var(--border)] bg-[var(--panel-strong)] p-4 shadow-[var(--shadow)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={cn("inline-flex rounded-full border px-2 py-1 text-[10px] font-black", statusTone(event.status))}>{event.status}</span>
            <h2 className="mt-3 text-xl font-semibold leading-tight">{event.name}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{event.date}{event.category === "camp" && "endDate" in event ? ` - ${event.endDate}` : ""}</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric label="Location" value={event.city} />
          <Metric label="Type" value={event.type} />
          <Metric label="Venue" value={event.venue} />
          <Metric label={cost ? "Cost" : "Roster"} value={cost ?? spots} />
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-sm font-semibold">{getEventFocus(event)}</p>
          <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{event.notes}</p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{getEventHost(event)}</p>
            <p className="truncate text-xs text-[var(--muted)]">Deadline: {event.registration_deadline}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-black text-[var(--accent-foreground)]">{t.details as string}</span>
        </div>
      </section>
    </div>
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

function StatDetailSheet({
  t,
  stat,
  student,
  classes,
  checkedInClassIds,
  onClose,
}: {
  t: (typeof copy)[Lang];
  stat: StatId;
  student: Student | null;
  classes: ClubClass[];
  checkedInClassIds: string[];
  onClose: () => void;
}) {
  const detail = buildStatDetail(stat, t, student, classes, checkedInClassIds);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[color-mix(in_srgb,var(--background)_52%,transparent)] px-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-sm">
      <section className="w-full max-w-[500px] rounded-[28px] border border-[var(--border)] bg-[var(--panel-strong)] p-4 shadow-[var(--shadow)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{t.details as string}</p>
            <h2 className="mt-1 text-2xl font-semibold">{detail.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{detail.summary}</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {detail.rows.map((row) => (
            <div key={`${row.label}-${row.value}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
              <span className="min-w-0 truncate text-sm font-semibold">{row.label}</span>
              <span className="shrink-0 text-sm font-black text-[var(--accent)]">{row.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  const content = (
    <>
      <p className="truncate text-xl font-black">{value}</p>
      <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{label}</p>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition active:scale-[0.99]">
        {content}
      </button>
    );
  }

  return (
    <div className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
      {content}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-center">
      <p className="truncate text-base font-black">{value}</p>
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

function findStudentProfile(rankings: RankedMember[], user: PlatformUser) {
  const byName = rankings.find((member) => member.name.toLowerCase() === user.name.toLowerCase());
  if (byName) return byName;
  return rankings.find((member) => member.belt === user.belt && member.stripes === user.stripes) ?? null;
}

function buildStatDetail(stat: StatId, t: (typeof copy)[Lang], student: Student | null, classes: ClubClass[], checkedInClassIds: string[]) {
  const recentClasses = [...classes].sort((a, b) => nextClassOffset(a, 0, 0) - nextClassOffset(b, 0, 0)).slice(0, 4);
  const checkedClasses = classes.filter((item) => checkedInClassIds.includes(item.id));
  const fallbackClasses = checkedClasses.length > 0 ? checkedClasses : recentClasses;

  if (stat === "hours") {
    return {
      title: t.hours as string,
      summary: `${student?.totalHours ?? 0} mat hours from class attendance.`,
      rows: fallbackClasses.slice(0, 4).map((item) => ({
        label: `${item.day} ${item.time} · ${item.name}`,
        value: `${Math.round(item.durationMinutes / 60)}h`,
      })),
    };
  }

  if (stat === "attendance") {
    return {
      title: t.month as string,
      summary: `${student?.classes30 ?? 0} classes counted in the last 30 days.`,
      rows: fallbackClasses.slice(0, 4).map((item) => ({
        label: `${item.day} · ${item.name}`,
        value: checkedInClassIds.includes(item.id) ? "checked" : "recent",
      })),
    };
  }

  if (stat === "streak") {
    return {
      title: t.streak as string,
      summary: `${student?.streak ?? 0} class streak based on consecutive training days.`,
      rows: fallbackClasses.slice(0, Math.max(1, Math.min(student?.streak ?? 3, 4))).map((item, index) => ({
        label: `${item.day} · ${item.name}`,
        value: `#${index + 1}`,
      })),
    };
  }

  const points = student?.points ?? 0;
  const attendancePoints = Math.min(points, (student?.classes30 ?? 0) * 25);
  const streakPoints = Math.min(Math.max(points - attendancePoints, 0), (student?.streak ?? 0) * 30);
  const progressPoints = Math.max(points - attendancePoints - streakPoints, 0);

  return {
    title: t.points as string,
    summary: `${points} profile points from training consistency and progress.`,
    rows: [
      { label: "Attendance", value: String(attendancePoints) },
      { label: "Streak", value: String(streakPoints) },
      { label: "Progress", value: String(progressPoints) },
    ],
  };
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

function getCheckInStorageKey(session: MiniSession) {
  return `${checkedInClassesKey}:${session.activeClub?.slug ?? "no-club"}:${session.user.id}`;
}
