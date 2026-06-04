"use client";

import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { type ColDef, type ICellRendererParams } from "ag-grid-community";
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import { CreateClassForm, type ClassFormValue } from "@/components/schedule/create-class-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Drawer, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AgGridHost } from "@/components/ag-grid-host";
import { useActiveClubState } from "@/components/use-active-club";

type SessionBlock = {
  time: string;
  name: string;
  coach: string;
  room: string;
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

type ApiCompetition = {
  id: string;
  name: string;
  date: string;
  city: string;
  venue: string;
  type: string;
  status: string;
};

type TrainingDrawerDefaults = Partial<ClassFormValue> & {
  title?: string;
  original?: {
    day: string;
    time: string;
    name: string;
    coach: string;
    room: string;
  };
};

const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type DayKey = (typeof dayKeys)[number];
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const initialRows: ScheduleRow[] = [
  {
    time: "06:30",
    mon: [session("06:30", "Dawn Patrol Gi", "Sofia Almeida", "Mat A", "Experienced")],
    tue: [session("06:30", "No-Gi Conditioning", "Noah Keller", "Mat B", "Basics")],
    wed: [session("06:30", "Dawn Patrol Gi", "Sofia Almeida", "Mat A", "Experienced")],
    thu: [session("06:30", "Wrestling Entries", "Lina Okafor", "Mat B", "Advanced basics")],
    fri: [session("06:30", "Open Mat", "Sofia Almeida", "Main Mat", "All levels")],
    sat: [],
    sun: [],
  },
  {
    time: "08:00",
    mon: [session("08:00", "Fundamentals", "Eli Morgan", "Mat B", "Beginners")],
    tue: [],
    wed: [session("08:00", "Fundamentals", "Eli Morgan", "Mat B", "Beginners")],
    thu: [],
    fri: [session("08:00", "Mobility + Drilling", "Noah Keller", "Mat A", "Basics")],
    sat: [session("08:00", "Weekend Beginners", "Eli Morgan", "Mat B", "Beginners")],
    sun: [],
  },
  {
    time: "12:00",
    mon: [session("12:00", "Lunch No-Gi", "Lina Okafor", "Mat B", "Basics")],
    tue: [session("12:00", "Gi Passing Lab", "Sofia Almeida", "Mat A", "Experienced")],
    wed: [session("12:00", "Lunch No-Gi", "Lina Okafor", "Mat B", "Basics")],
    thu: [session("12:00", "Leg Lock Systems", "Noah Keller", "Mat A", "Experienced")],
    fri: [session("12:00", "Competition Drills", "Sofia Almeida", "Main Mat", "Competition")],
    sat: [session("12:00", "Open Mat", "Lina Okafor", "Main Mat", "All levels")],
    sun: [session("12:00", "Recovery Flow", "Eli Morgan", "Mat B", "Basics")],
  },
  {
    time: "17:30",
    mon: [session("17:30", "Kids Competition", "Noah Keller", "Mat A", "Youth")],
    tue: [session("17:30", "Teen Advanced", "Lina Okafor", "Mat B", "Teen advanced")],
    wed: [session("17:30", "Kids Competition", "Noah Keller", "Mat A", "Youth")],
    thu: [session("17:30", "Youth Fundamentals", "Eli Morgan", "Mat B", "Youth basics")],
    fri: [session("17:30", "Teen Open Mat", "Noah Keller", "Mat A", "Teen all levels")],
    sat: [],
    sun: [],
  },
  {
    time: "19:00",
    mon: [session("19:00", "Advanced Sparring", "Sofia Almeida", "Main Mat", "Experienced")],
    tue: [session("19:00", "Fundamentals Gi", "Eli Morgan", "Mat A", "Beginners")],
    wed: [session("19:00", "Advanced Sparring", "Sofia Almeida", "Main Mat", "Experienced")],
    thu: [session("19:00", "No-Gi Advanced", "Lina Okafor", "Main Mat", "Experienced")],
    fri: [session("19:00", "Fight Night Rounds", "Sofia Almeida", "Main Mat", "Competition")],
    sat: [],
    sun: [],
  },
  {
    time: "20:30",
    mon: [session("20:30", "Open Mat", "Lina Okafor", "Mat B", "All levels")],
    tue: [session("20:30", "Women Only", "Camille Duran", "Mat B", "Basics")],
    wed: [session("20:30", "Guard Retention", "Maya Ribeiro", "Mat A", "Advanced basics")],
    thu: [session("20:30", "Open Mat", "Noah Keller", "Mat B", "All levels")],
    fri: [session("20:30", "Coaches Lab", "Sofia Almeida", "Mat A", "Experienced")],
    sat: [],
    sun: [],
  },
];

function session(time: string, name: string, coach: string, room: string, level: string): SessionBlock {
  return { time, name, coach, room, level };
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
  return session(value.time, value.name, value.coach, value.mat, value.level);
}

function classApiToSessionBlock(value: ApiClass): SessionBlock {
  return session(value.time, value.name, value.coach, value.mat, value.level);
}

function normalizeScheduleValue(value: string) {
  return value.trim().toLowerCase();
}

function classesToScheduleRows(classes?: ApiClass[]) {
  const rows = new Map<string, ScheduleRow>();

  for (const initialRow of initialRows) {
    rows.set(initialRow.time, {
      time: initialRow.time,
      mon: [...initialRow.mon],
      tue: [...initialRow.tue],
      wed: [...initialRow.wed],
      thu: [...initialRow.thu],
      fri: [...initialRow.fri],
      sat: [...initialRow.sat],
      sun: [...initialRow.sun],
    });
  }

  for (const classItem of classes ?? []) {
    const time = classItem.time;
    const day = dayKeyFromLabel(classItem.day);
    const block = classApiToSessionBlock(classItem);
    const row = rows.get(time) ?? emptyRow(time);
    const alreadyShown = row[day].some(
      (item) => item.time === block.time && item.name === block.name && item.coach === block.coach && item.room === block.room,
    );

    if (!alreadyShown) row[day] = [...row[day], block];
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

function dayKeyForDate(date: Date): DayKey {
  return dayKeys[(date.getDay() + 6) % 7];
}

function parseCalendarDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function levelTone(level: string) {
  const normalized = level.toLowerCase();
  if (normalized.includes("beginner") || normalized.includes("white")) return "border-sky-400/20 bg-sky-400/10 text-sky-200";
  if (normalized.includes("competition")) return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  if (normalized.includes("experienced") || normalized.includes("purple") || normalized.includes("black")) {
    return "border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]";
  }
  if (normalized.includes("youth") || normalized.includes("teen") || normalized.includes("kids")) return "border-violet-400/20 bg-violet-400/10 text-violet-200";
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
  const [competitionEvents, setCompetitionEvents] = useState<ApiCompetition[]>([]);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfWeek(new Date()));
  const [trainingDrawerOpen, setTrainingDrawerOpen] = useState(initialCreateClass);
  const [trainingDefaults, setTrainingDefaults] = useState<TrainingDrawerDefaults>({
    day: "Mon",
    time: "18:00",
    title: "Add training",
  });
  const { activeClub, loading: loadingClub } = useActiveClubState();

  const selectedDay = useMemo(() => addDays(weekStart, 3), [weekStart]);
  const isCurrentWeek = weekStart.getTime() === startOfWeek(new Date()).getTime();

  const hasClasses = useMemo(() => {
    const allSessions = scheduleRows.flatMap((row) => dayKeys.flatMap((key) => row[key]));
    return allSessions.length > 0;
  }, [scheduleRows]);

  const competitionsByDay = useMemo(() => {
    const events = new Map<DayKey, ApiCompetition[]>();

    for (const competition of competitionEvents) {
      const date = parseCalendarDate(competition.date);
      if (!date || !isDateInWeek(date, weekStart)) continue;
      const key = dayKeyForDate(date);
      events.set(key, [...(events.get(key) ?? []), competition]);
    }

    return events;
  }, [competitionEvents, weekStart]);

  const hasCompetitionEvents = competitionsByDay.size > 0;

  const saveClassToTimetable = (value: ClassFormValue) => {
    const day = dayKeyFromLabel(value.day);
    const block = classToSessionBlock(value);
    const original = trainingDefaults.original;

    setScheduleRows((current) => {
      const rowsWithoutOriginal = original
        ? current.map((row) => {
            if (normalizeScheduleValue(row.time) !== normalizeScheduleValue(original.time)) return row;
            const originalDay = dayKeyFromLabel(original.day);
            return {
              ...row,
              [originalDay]: row[originalDay].filter(
                (item) =>
                  item.name !== original.name ||
                  item.coach !== original.coach ||
                  item.room !== original.room ||
                  normalizeScheduleValue(item.time) !== normalizeScheduleValue(original.time),
              ),
            };
          })
        : current;

      const rowExists = rowsWithoutOriginal.some((row) => row.time === value.time);
      const rowsWithTime = rowExists
        ? rowsWithoutOriginal
        : [...rowsWithoutOriginal, emptyRow(value.time)].sort((a, b) => compareTimes(a.time, b.time));

      return rowsWithTime.map((row) => {
        if (row.time !== value.time) return row;
        const alreadyShown = row[day].some(
          (item) => item.time === block.time && item.name === block.name && item.coach === block.coach && item.room === block.room,
        );
        return {
          ...row,
          [day]: alreadyShown ? row[day] : [...row[day], block],
        };
      });
    });
  };

  const validateClassOverlap = (value: ClassFormValue) => {
    const day = dayKeyFromLabel(value.day);
    const requestedTime = normalizeScheduleValue(value.time);
    const row = scheduleRows.find((item) => normalizeScheduleValue(item.time) === requestedTime);
    const existingClass = row?.[day]?.[0];
    const original = trainingDefaults.original;

    if (!existingClass) return null;
    if (
      original &&
      dayKeyFromLabel(original.day) === day &&
      normalizeScheduleValue(original.time) === requestedTime &&
      existingClass.name === original.name &&
      existingClass.coach === original.coach &&
      existingClass.room === original.room
    ) {
      return null;
    }

    return `${existingClass.name} already uses ${value.day} at ${value.time}. Pick another time before saving.`;
  };

  const openTrainingDrawer = (defaults?: TrainingDrawerDefaults) => {
    if (!canManageClasses) return;
    setTrainingDefaults({
      day: defaults?.day ?? "Mon",
      time: defaults?.time ?? "18:00",
      title: defaults?.title ?? "Add training",
      ...defaults,
    });
    setTrainingDrawerOpen(true);
  };

  const openTrainingEditor = (day: string, block: SessionBlock) => {
    openTrainingDrawer({
      name: block.name,
      coach: block.coach,
      day,
      time: block.time,
      mat: block.room,
      level: block.level,
      title: `Edit ${block.name}`,
      original: {
        day,
        time: block.time,
        name: block.name,
        coach: block.coach,
        room: block.room,
      },
    });
  };

  useEffect(() => {
    if (loadingClub) return;

    const controller = new AbortController();
    const params = new URLSearchParams();
    if (activeClub?.slug) params.set("club", activeClub.slug);

    setClassesError(null);

    fetch(`/api/classes${params.size ? `?${params}` : ""}`, { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Could not load classes."))))
      .then((payload: { classes?: ApiClass[] }) => {
        setScheduleRows(classesToScheduleRows(payload.classes));
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setClassesError(error.message);
          setScheduleRows(initialRows);
        }
      });

    fetch(`/api/competitions${params.size ? `?${params}` : ""}`, { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Could not load competitions."))))
      .then((payload: { competitions?: ApiCompetition[] }) => {
        setCompetitionEvents(payload.competitions ?? []);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setCompetitionEvents([]);
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
      cellRendererParams: {
        day: dayLabels[index],
        canManageClasses,
        onOpenSlot: (time: string) => openTrainingDrawer({ day: dayLabels[index], time, title: `Add ${dayLabels[index]} training` }),
        onEditBlock: (block: SessionBlock) => openTrainingEditor(dayLabels[index], block),
      },
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
  }, [canManageClasses, weekStart]);

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">{formatRange(weekStart)}</h2>
              <Button
                variant="surface"
                size="icon"
                onClick={() => {
                  const next = addDays(weekStart, -7);
                  setWeekStart(next);
                  setCalendarMonth(next);
                }}
                aria-label="Previous week"
              >
                <ChevronLeft size={16} />
              </Button>
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
              <Button
                variant="surface"
                size="icon"
                onClick={() => {
                  const next = addDays(weekStart, 7);
                  setWeekStart(next);
                  setCalendarMonth(next);
                }}
                aria-label="Next week"
              >
                <ChevronRight size={16} />
              </Button>
              <Button
                variant={isCurrentWeek ? "primary" : "ghost"}
                size="sm"
                onClick={() => {
                  const today = startOfWeek(new Date());
                  setWeekStart(today);
                  setCalendarMonth(today);
                }}
              >
                <RotateCcw size={16} />
                This week
              </Button>
            </div>
          </div>
          <div className="w-full lg:max-w-[340px]">
            {canManageClasses ? (
              <Button variant="primary" className="w-full justify-center" onClick={() => openTrainingDrawer()}>
                <CalendarPlus size={16} />
                Add training
              </Button>
            ) : (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-3 text-xs leading-5 text-[var(--muted)]">
                Class changes are managed by academy admins.
              </div>
            )}
          </div>
        </div>
      </Card>

      {hasCompetitionEvents && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Trophy size={16} className="text-[var(--accent)]" />
            <p className="text-sm font-semibold text-[var(--foreground)]">Competition events this week</p>
          </div>
          <div className="grid gap-2 md:grid-cols-7">
            {dayKeys.map((key, index) => {
              const date = addDays(weekStart, index);
              const events = competitionsByDay.get(key) ?? [];
              if (!events.length) return null;

              return (
                <div key={key} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <p className="text-xs font-semibold text-[var(--foreground)]">
                    {dayLabels[index]} {date.getDate()}
                  </p>
                  <div className="mt-3 space-y-2">
                    {events.map((event) => (
                      <div key={event.id} className="rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/10 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="accent">
                            <Trophy size={12} />
                            {event.type}
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs font-semibold leading-4 text-[var(--foreground)]">{event.name}</p>
                        <p className="mt-1 text-[11px] leading-4 text-[var(--muted)]">{event.city || event.venue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Class timetable</p>
            <p className="text-xs text-[var(--muted)]">
              {classesError ?? "Horizontal scroll keeps the full week readable."}
            </p>
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
                  <Button variant="primary" onClick={() => openTrainingDrawer()}>
                    <CalendarPlus size={16} />
                    Add training
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Drawer open={trainingDrawerOpen} onOpenChange={setTrainingDrawerOpen}>
        <DrawerHeader onClose={() => setTrainingDrawerOpen(false)}>
          <DrawerTitle>{trainingDefaults.title ?? "Add training"}</DrawerTitle>
          <DrawerDescription>
            {trainingDefaults.original ? "Update this training session from the weekly schedule." : "Create a class directly from the weekly schedule."}
          </DrawerDescription>
        </DrawerHeader>
        <div className="mt-6">
          <CreateClassForm
            forceOpen
            initialValue={trainingDefaults}
            onCreate={saveClassToTimetable}
            validateClass={validateClassOverlap}
            onCancel={() => setTrainingDrawerOpen(false)}
            onSaved={() => setTrainingDrawerOpen(false)}
          />
        </div>
      </Drawer>
    </div>
  );
}

function ScheduleCell(
  params: ICellRendererParams<ScheduleRow, SessionBlock[]> & {
    day?: string;
    canManageClasses?: boolean;
    onOpenSlot?: (time: string) => void;
    onEditBlock?: (block: SessionBlock) => void;
  },
) {
  const blocks = params.value ?? [];

  if (!blocks.length) {
    return (
      <div className="grid h-full w-full place-items-center">
        {params.canManageClasses ? (
          <button
            type="button"
            className="rounded-full border border-dashed border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--accent)]/45 hover:text-[var(--foreground)]"
            onClick={() => params.onOpenSlot?.(params.data?.time ?? "")}
          >
            Add training
          </button>
        ) : (
          <span className="rounded-full border border-dashed border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">Open slot</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-center py-2">
      {blocks.map((block) => (
        <button
          key={`${block.name}-${block.room}`}
          type="button"
          className="grid h-[74px] w-full grid-rows-[auto_1fr_auto] rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-left transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)] disabled:cursor-default"
          onClick={() => params.onEditBlock?.(block)}
          disabled={!params.canManageClasses}
          aria-label={params.canManageClasses ? `Edit ${block.name}` : block.name}
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
        </button>
      ))}
    </div>
  );
}
