"use client";

import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { type ColDef, type ICellRendererParams } from "ag-grid-community";
import { AlertTriangle, CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Loader2, RotateCcw } from "lucide-react";
import { CreateClassForm, type ClassFormValue } from "@/components/schedule/create-class-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AgGridHost } from "@/components/ag-grid-host";
import { useActiveClubState } from "@/components/use-active-club";

type SessionBlock = {
  time: string;
  name: string;
  coach: string;
  room: string;
  capacity: number;
  fill: number;
  level: string;
};

type ScheduleRow = {
  time: string;
  mon: SessionBlock[];
  tue: SessionBlock[];
  wed: SessionBlock[];
  thu: SessionBlock[];
  fri: SessionBlock[];
  sat: SessionBlock[];
  sun: SessionBlock[];
};

type ApiClass = {
  id?: string;
  name: string;
  coach: string;
  day: string;
  time: string;
  mat: string;
  level: string;
  checkedIn?: number;
};

const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type DayKey = (typeof dayKeys)[number];
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const initialRows: ScheduleRow[] = [
  {
    time: "06:30",
    mon: [session("06:30", "Dawn Patrol Gi", "Sofia Almeida", "Mat A", 28, 82, "Experienced")],
    tue: [session("06:30", "No-Gi Conditioning", "Noah Keller", "Mat B", 24, 68, "Basics")],
    wed: [session("06:30", "Dawn Patrol Gi", "Sofia Almeida", "Mat A", 28, 91, "Experienced")],
    thu: [session("06:30", "Wrestling Entries", "Lina Okafor", "Mat B", 22, 73, "Advanced basics")],
    fri: [session("06:30", "Open Mat", "Sofia Almeida", "Main Mat", 40, 62, "All levels")],
    sat: [],
    sun: [],
  },
  {
    time: "08:00",
    mon: [session("08:00", "Fundamentals", "Eli Morgan", "Mat B", 32, 56, "Beginners")],
    tue: [],
    wed: [session("08:00", "Fundamentals", "Eli Morgan", "Mat B", 32, 64, "Beginners")],
    thu: [],
    fri: [session("08:00", "Mobility + Drilling", "Noah Keller", "Mat A", 26, 58, "Basics")],
    sat: [session("08:00", "Weekend Beginners", "Eli Morgan", "Mat B", 30, 78, "Beginners")],
    sun: [],
  },
  {
    time: "12:00",
    mon: [session("12:00", "Lunch No-Gi", "Lina Okafor", "Mat B", 34, 74, "Basics")],
    tue: [session("12:00", "Gi Passing Lab", "Sofia Almeida", "Mat A", 28, 88, "Experienced")],
    wed: [session("12:00", "Lunch No-Gi", "Lina Okafor", "Mat B", 34, 69, "Basics")],
    thu: [session("12:00", "Leg Lock Systems", "Noah Keller", "Mat A", 24, 81, "Experienced")],
    fri: [session("12:00", "Competition Drills", "Sofia Almeida", "Main Mat", 36, 93, "Competition")],
    sat: [session("12:00", "Open Mat", "Lina Okafor", "Main Mat", 46, 87, "All levels")],
    sun: [session("12:00", "Recovery Flow", "Eli Morgan", "Mat B", 20, 44, "Basics")],
  },
  {
    time: "17:30",
    mon: [session("17:30", "Kids Competition", "Noah Keller", "Mat A", 22, 86, "Youth")],
    tue: [session("17:30", "Teen Advanced", "Lina Okafor", "Mat B", 18, 72, "Teen advanced")],
    wed: [session("17:30", "Kids Competition", "Noah Keller", "Mat A", 22, 91, "Youth")],
    thu: [session("17:30", "Youth Fundamentals", "Eli Morgan", "Mat B", 24, 67, "Youth basics")],
    fri: [session("17:30", "Teen Open Mat", "Noah Keller", "Mat A", 26, 79, "Teen all levels")],
    sat: [],
    sun: [],
  },
  {
    time: "19:00",
    mon: [session("19:00", "Advanced Sparring", "Sofia Almeida", "Main Mat", 46, 89, "Experienced")],
    tue: [session("19:00", "Fundamentals Gi", "Eli Morgan", "Mat A", 36, 76, "Beginners")],
    wed: [session("19:00", "Advanced Sparring", "Sofia Almeida", "Main Mat", 46, 96, "Experienced")],
    thu: [session("19:00", "No-Gi Advanced", "Lina Okafor", "Main Mat", 42, 84, "Experienced")],
    fri: [session("19:00", "Fight Night Rounds", "Sofia Almeida", "Main Mat", 50, 98, "Competition")],
    sat: [],
    sun: [],
  },
  {
    time: "20:30",
    mon: [session("20:30", "Open Mat", "Lina Okafor", "Mat B", 30, 61, "All levels")],
    tue: [session("20:30", "Women Only", "Camille Duran", "Mat B", 24, 70, "Basics")],
    wed: [session("20:30", "Guard Retention", "Maya Ribeiro", "Mat A", 28, 83, "Advanced basics")],
    thu: [session("20:30", "Open Mat", "Noah Keller", "Mat B", 34, 64, "All levels")],
    fri: [session("20:30", "Coaches Lab", "Sofia Almeida", "Mat A", 18, 72, "Experienced")],
    sat: [],
    sun: [],
  },
];

function session(time: string, name: string, coach: string, room: string, capacity: number, fill: number, level: string): SessionBlock {
  return { time, name, coach, room, capacity, fill, level };
}

function emptyRow(time: string): ScheduleRow {
  return { time, mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
}

function dayKeyFromLabel(day: string): DayKey {
  const normalized = day.trim().slice(0, 3).toLowerCase();
  if (dayKeys.includes(normalized as DayKey)) return normalized as DayKey;
  return "mon";
}

function compareTimes(a: string, b: string) {
  return a.localeCompare(b, "en-US", { numeric: true });
}

function classToSessionBlock(value: ClassFormValue): SessionBlock {
  return session(value.time, value.name, value.coach, value.mat, 28, 0, value.level);
}

function classApiToSessionBlock(value: ApiClass): SessionBlock {
  return session(value.time, value.name, value.coach, value.mat, 28, 0, value.level);
}

function classesToRows(classes: ApiClass[]) {
  const rows = new Map<string, ScheduleRow>();

  for (const classItem of classes) {
    const time = classItem.time;
    const day = dayKeyFromLabel(classItem.day);
    const row = rows.get(time) ?? emptyRow(time);
    row[day] = [...row[day], classApiToSessionBlock(classItem)];
    rows.set(time, row);
  }

  return Array.from(rows.values()).sort((a, b) => compareTimes(a.time, b.time));
}

function startOfWeek(date: Date) {
  const value = new Date(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function formatRange(start: Date) {
  const end = addDays(start, 6);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function isDateInWeek(date: Date, weekStart: Date) {
  const start = weekStart.getTime();
  const end = addDays(weekStart, 6);
  end.setHours(23, 59, 59, 999);
  const value = new Date(date);
  value.setHours(12, 0, 0, 0);
  return value.getTime() >= start && value.getTime() <= end.getTime();
}

function weekOffsetFrom(start: Date) {
  const current = startOfWeek(new Date()).getTime();
  return Math.round((start.getTime() - current) / (7 * 24 * 60 * 60 * 1000));
}

function levelTone(level: string) {
  if (level.includes("Beginner")) return "border-sky-400/20 bg-sky-400/10 text-sky-200";
  if (level.includes("Competition")) return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  if (level.includes("Experienced")) return "border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]";
  if (level.includes("Youth") || level.includes("Teen")) return "border-violet-400/20 bg-violet-400/10 text-violet-200";
  return "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]";
}

export function ScheduleGrid({
  initialCreateClass = false,
  canManageClasses = false,
}: {
  initialCreateClass?: boolean;
  canManageClasses?: boolean;
}) {
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>(initialRows);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfWeek(new Date()));
  const { activeClub, loading: loadingClub } = useActiveClubState();

  const weekOffset = useMemo(() => weekOffsetFrom(weekStart), [weekStart]);
  const selectedDay = useMemo(() => addDays(weekStart, 3), [weekStart]);
  const isCurrentWeek = weekOffset === 0;

  const weekSummary = useMemo(() => {
    const allSessions = scheduleRows.flatMap((row) => dayKeys.flatMap((key) => row[key]));
    const rooms = new Set(allSessions.map((block) => block.room)).size;
    return { classes: allSessions.length, rooms };
  }, [scheduleRows]);
  const clubLabel = activeClub?.name ?? "Club workspace";
  const hasClasses = weekSummary.classes > 0;

  const addClassToTimetable = (value: ClassFormValue) => {
    const day = dayKeyFromLabel(value.day);
    const block = classToSessionBlock(value);

    setScheduleRows((current) => {
      const rowExists = current.some((row) => row.time === value.time);
      const rowsWithTime = rowExists ? current : [...current, emptyRow(value.time)].sort((a, b) => compareTimes(a.time, b.time));

      return rowsWithTime.map((row) => {
        if (row.time !== value.time) return row;
        return {
          ...row,
          [day]: [...row[day], block],
        };
      });
    });
  };

  useEffect(() => {
    if (loadingClub) return;

    const controller = new AbortController();
    const params = new URLSearchParams();
    if (activeClub?.slug) params.set("club", activeClub.slug);

    setLoadingClasses(true);
    setClassesError(null);

    fetch(`/api/classes${params.size ? `?${params}` : ""}`, { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Could not load classes."))))
      .then((payload: { classes?: ApiClass[] }) => {
        const rows = classesToRows(payload.classes ?? []);
        setScheduleRows(rows);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setClassesError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingClasses(false);
      });

    return () => controller.abort();
  }, [activeClub?.slug, loadingClub]);

  const columnDefs = useMemo<ColDef<ScheduleRow>[]>(() => {
    const dayColumns = dayKeys.map((key, index): ColDef<ScheduleRow> => ({
      field: key,
      headerName: `${dayLabels[index]} ${addDays(weekStart, index).getDate()}`,
      flex: 1,
      minWidth: 260,
      sortable: false,
      filter: false,
      cellDataType: false,
      cellRenderer: ScheduleCell,
      headerClass: "schedule-day-header",
    }));

    return [
      {
        field: "time",
        headerName: "Time",
        pinned: "left",
        width: 92,
        sortable: false,
        filter: false,
        cellClass: "font-mono text-xs text-[var(--muted)]",
      },
      ...dayColumns,
    ];
  }, [weekStart]);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">Weekly planner</Badge>
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">
                {loadingClub ? "Loading workspace" : loadingClasses ? `${clubLabel} · refreshing` : clubLabel}
              </span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">
                {isCurrentWeek ? "Current week" : weekOffset > 0 ? `+${weekOffset} week` : `${weekOffset} week`}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">{formatRange(weekStart)}</h2>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarDays size={16} />
                    Pick week
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <div className="border-b border-[var(--border)] px-4 py-3">
                    <p className="text-sm font-semibold text-[var(--foreground)]">Jump to week</p>
                    <p className="text-xs text-[var(--muted)]">Select any day to open that week in the planner.</p>
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDay}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    onSelect={(date) => {
                      if (!date) return;
                      setWeekStart(startOfWeek(date));
                      setCalendarMonth(startOfWeek(date));
                      setCalendarOpen(false);
                    }}
                    modifiers={{
                      inSelectedWeek: (date) => isDateInWeek(date, weekStart),
                    }}
                    modifiersClassNames={{
                      inSelectedWeek: "in-selected-week",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Metric label="Classes" value={weekSummary.classes.toString()} />
              <Metric label="Rooms in use" value={weekSummary.rooms.toString()} />
            </div>
          </div>
          <div className="flex flex-col justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 lg:min-w-[330px] lg:border-l lg:border-t-0">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="surface"
                className="px-3"
                onClick={() => {
                  const next = addDays(weekStart, -7);
                  setWeekStart(next);
                  setCalendarMonth(next);
                }}
                aria-label="Previous week"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="ghost"
                className="px-3"
                aria-label="Go to current week"
                onClick={() => {
                  const today = startOfWeek(new Date());
                  setWeekStart(today);
                  setCalendarMonth(today);
                }}
              >
                <RotateCcw size={16} /> Today
              </Button>
              <Button
                variant="surface"
                className="px-3"
                onClick={() => {
                  const next = addDays(weekStart, 7);
                  setWeekStart(next);
                  setCalendarMonth(next);
                }}
                aria-label="Next week"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
            {canManageClasses ? (
              <CreateClassForm initialOpen={initialCreateClass} onCreate={addClassToTimetable} />
            ) : (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-3 text-xs leading-5 text-[var(--muted)]">
                Class changes are managed by coaches and academy staff.
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-2 md:grid-cols-7">
        {dayKeys.map((key, index) => {
          const count = scheduleRows.reduce((sum, row) => sum + row[key].length, 0);
          return (
            <div key={key} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs font-medium text-[var(--muted)]">{dayNames[index]}</p>
              <div className="mt-1 flex items-end justify-between">
                <p className="text-lg font-semibold text-[var(--foreground)]">{addDays(weekStart, index).getDate()}</p>
                <p className="text-xs text-[var(--accent)]">{count} classes</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Class timetable</p>
            <p className="text-xs text-[var(--muted)]">
              {classesError ?? "Horizontal scroll keeps the full week readable."}
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            {loadingClasses && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
                <Loader2 size={13} className="animate-spin" />
                Syncing
              </span>
            )}
            {classesError && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent-coral)]">
                <AlertTriangle size={13} />
                Offline fallback
              </span>
            )}
          </div>
        </div>
        {hasClasses ? (
          <AgGridHost className="oss-schedule-grid ag-theme-quartz h-[690px] w-full">
            <AgGridReact<ScheduleRow>
              rowData={scheduleRows}
              columnDefs={columnDefs}
              defaultColDef={{ resizable: true, suppressMovable: true }}
              theme="legacy"
              suppressCellFocus={false}
              animateRows
              rowHeight={104}
              headerHeight={50}
            />
          </AgGridHost>
        ) : (
          <div className="grid min-h-[420px] place-items-center px-6 py-10">
            <div className="max-w-sm text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--accent)]">
                <CalendarPlus size={26} strokeWidth={1.6} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[var(--foreground)]">No classes scheduled this week.</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {canManageClasses
                  ? "Create the first class for this academy week, then it will appear in the timetable."
                  : "Academy staff has not published classes for this week yet."}
              </p>
              {canManageClasses && (
                <div className="mt-6">
                  <CreateClassForm initialOpen={false} onCreate={addClassToTimetable} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function ScheduleCell(params: ICellRendererParams<ScheduleRow, SessionBlock[]>) {
  const blocks = params.value ?? [];

  if (!blocks.length) {
    return (
      <div className="grid h-full w-full place-items-center">
        <span className="rounded-full border border-dashed border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">Open slot</span>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-center py-2">
      {blocks.map((block) => (
        <div
          key={`${block.name}-${block.room}`}
          className="grid h-[74px] grid-rows-[auto_1fr_auto] rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)]"
        >
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-bold leading-none text-[var(--accent)]">{block.time}</span>
            <span className={`max-w-[116px] shrink-0 truncate rounded-full border px-2 py-0.5 text-[10px] font-medium ${levelTone(block.level)}`}>{block.level}</span>
          </div>
          <div className="min-w-0 pt-1">
            <p className="truncate text-[13px] font-semibold leading-4 text-[var(--foreground)]">{block.name}</p>
            <p className="mt-0.5 truncate text-[11px] leading-4 text-[var(--muted)]">{block.coach}</p>
          </div>
          <p className="truncate text-[11px] leading-none text-[var(--muted)]">{block.room}</p>
        </div>
      ))}
    </div>
  );
}
