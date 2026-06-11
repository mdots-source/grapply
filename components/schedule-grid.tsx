"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { type ColDef, type ICellRendererParams } from "ag-grid-community";
import { AlertTriangle, CalendarDays, CalendarPlus, CheckCircle2, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { CreateClassForm, type ClassFormValue } from "@/components/schedule/create-class-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Drawer, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AgGridHost } from "@/components/ag-grid-host";
import { useActiveClubState } from "@/components/use-active-club";
import { formatApiError, readApiJson } from "@/lib/api-client";

type SessionBlock = {
  id?: string;
  userId?: string | null;
  time: string;
  name: string;
  coach: string;
  room: string;
  level: string;
  durationMinutes: number;
  checkedIn?: number;
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

export type ScheduleApiClass = {
  id?: string;
  userId?: string | null;
  name: string;
  coach: string;
  day: string;
  time: string;
  mat: string;
  level: string;
  durationMinutes?: number;
  checkedIn?: number;
};

export type ScheduleApiMember = {
  id: string;
  name: string;
  belt?: string;
  role?: string;
};

type TrainingDrawerDefaults = Partial<ClassFormValue> & {
  title?: string;
  original?: {
    id?: string;
    userId?: string | null;
    day: string;
    time: string;
    name: string;
    coach: string;
    room: string;
    durationMinutes?: number;
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

function session(
  time: string,
  name: string,
  coach: string,
  room: string,
  level: string,
  id?: string,
  checkedIn?: number,
  durationMinutes = 60,
  userId?: string | null,
): SessionBlock {
  return { id, userId, time, name, coach, room, level, durationMinutes, checkedIn };
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
  return session(value.time, value.name, value.coach, value.mat, value.level, value.id, value.checkedIn, value.durationMinutes, value.userId);
}

function classApiToSessionBlock(value: ScheduleApiClass): SessionBlock {
  return session(value.time, value.name, value.coach, value.mat, value.level, value.id, value.checkedIn, value.durationMinutes ?? 60, value.userId);
}

function normalizeScheduleValue(value: string) {
  return value.trim().toLowerCase();
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function intervalsOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

function classesToScheduleRows(classes?: ScheduleApiClass[], includeSeedRows = true) {
  const rows = new Map<string, ScheduleRow>();

  if (includeSeedRows) {
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

function updateCheckedIn(blocks: SessionBlock[], classId: string, checkedIn: number) {
  return blocks.map((block) => (block.id === classId ? { ...block, checkedIn } : block));
}

function findClassBlock(rows: ScheduleRow[], classId: string) {
  for (const row of rows) {
    for (const [index, key] of dayKeys.entries()) {
      const block = row[key].find((item) => item.id === classId);
      if (block) return { day: dayLabels[index], block };
    }
  }
  return null;
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

function formatLevelLabel(level: string) {
  const normalized = level.toLowerCase();
  if (normalized.includes("all")) return "All belts";
  if (normalized.includes("competition")) return "Comp";
  if (normalized.includes("kids") || normalized.includes("youth")) return "Youth";
  if (normalized.includes("teen")) return "Teen";
  if (normalized.includes("purple") && normalized.includes("brown") && normalized.includes("black")) return "Advanced";
  if (normalized.includes("blue") && normalized.includes("purple") && normalized.includes("brown")) return "Advanced";
  if (normalized.includes("white") && normalized.includes("blue")) return "Basics";
  return level;
}

export function ScheduleGrid({
  initialCheckInClassId,
  initialCreateClass = false,
  canManageClasses = false,
  initialClasses,
  initialMembers,
  initialScheduleError = null,
  initialClubSlug,
  classManagementScope = "none",
  currentUserId,
  currentUserName,
}: {
  initialCheckInClassId?: string;
  initialCreateClass?: boolean;
  canManageClasses?: boolean;
  classManagementScope?: "all" | "own" | "none";
  currentUserId?: string;
  currentUserName?: string;
  initialClasses?: ScheduleApiClass[];
  initialMembers?: ScheduleApiMember[];
  initialScheduleError?: string | null;
  initialClubSlug?: string;
}) {
  const hasInitialSchedule = Array.isArray(initialClasses);
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>(() => classesToScheduleRows(initialClasses, false));
  const [members, setMembers] = useState<ScheduleApiMember[]>(() => initialMembers ?? []);
  const [loadingSchedule, setLoadingSchedule] = useState(!hasInitialSchedule && !initialScheduleError);
  const [scheduleReloadKey, setScheduleReloadKey] = useState(0);
  const [classesError, setClassesError] = useState<string | null>(initialScheduleError);
  const [pendingCheckInClassId, setPendingCheckInClassId] = useState(initialCheckInClassId ?? null);
  const [classActionMessage, setClassActionMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [classActionLoading, setClassActionLoading] = useState<"delete" | "check-in" | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
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
  const resolvedClubSlug = activeClub?.slug ?? initialClubSlug;

  const selectedDay = useMemo(() => addDays(weekStart, 3), [weekStart]);
  const canManageBlock = useCallback((block: SessionBlock) => {
    if (!canManageClasses || classManagementScope === "none") return false;
    if (classManagementScope === "all") return true;
    if (block.userId) return Boolean(currentUserId && block.userId === currentUserId);
    return Boolean(currentUserName && normalizeScheduleValue(block.coach) === normalizeScheduleValue(currentUserName));
  }, [canManageClasses, classManagementScope, currentUserId, currentUserName]);

  const hasClasses = useMemo(() => {
    const allSessions = scheduleRows.flatMap((row) => dayKeys.flatMap((key) => row[key]));
    return allSessions.length > 0;
  }, [scheduleRows]);

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
                  (original.id && item.id !== original.id) ||
                  item.name !== original.name ||
                  item.coach !== original.coach ||
                  item.room !== original.room ||
                  item.durationMinutes !== (original.durationMinutes ?? 60) ||
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
          (item) =>
            (block.id && item.id === block.id) ||
            (item.time === block.time && item.name === block.name && item.coach === block.coach && item.room === block.room),
        );
        return {
          ...row,
          [day]: alreadyShown ? row[day].map((item) => (block.id && item.id === block.id ? block : item)) : [...row[day], block],
        };
      });
    });
  };

  const validateClassOverlap = (value: ClassFormValue) => {
    const day = dayKeyFromLabel(value.day);
    const requestedStart = timeToMinutes(value.time);
    const requestedEnd = requestedStart + value.durationMinutes;
    const requestedMat = normalizeScheduleValue(value.mat);
    const original = trainingDefaults.original;
    const existingClass = scheduleRows
      .flatMap((row) => row[day])
      .find((item) => {
        if (normalizeScheduleValue(item.room) !== requestedMat) return false;
        if (original?.id && item.id === original.id) return false;
        if (
          original &&
          !original.id &&
          dayKeyFromLabel(original.day) === day &&
          normalizeScheduleValue(item.time) === normalizeScheduleValue(original.time) &&
          item.name === original.name &&
          item.coach === original.coach &&
          item.room === original.room &&
          item.durationMinutes === (original.durationMinutes ?? 60)
        ) {
          return false;
        }
        const existingStart = timeToMinutes(item.time);
        const existingEnd = existingStart + item.durationMinutes;
        return intervalsOverlap(existingStart, existingEnd, requestedStart, requestedEnd);
      });

    if (!existingClass) return null;

    return `${existingClass.name} already uses ${value.mat} on ${value.day} during this time. Pick another mat or time before saving.`;
  };

  const openTrainingDrawer = (defaults?: TrainingDrawerDefaults) => {
    if (!canManageClasses) return;
    setClassActionMessage(null);
    setSelectedMemberId("");
    setDeleteConfirm(false);
    setTrainingDefaults({
      day: defaults?.day ?? "Mon",
      time: defaults?.time ?? "18:00",
      title: defaults?.title ?? "Add training",
      ...defaults,
    });
    setTrainingDrawerOpen(true);
  };

  const openTrainingEditor = (day: string, block: SessionBlock) => {
    if (!canManageBlock(block)) {
      setClassActionMessage({
        tone: "error",
        text: "Coaches can only manage classes assigned to them.",
      });
      return;
    }

    openTrainingDrawer({
      name: block.name,
      coach: block.coach,
      day,
      time: block.time,
      mat: block.room,
      level: block.level,
      durationMinutes: block.durationMinutes,
      id: block.id,
      userId: block.userId,
      checkedIn: block.checkedIn,
      title: `Edit ${block.name}`,
      original: {
        id: block.id,
        userId: block.userId,
        day,
        time: block.time,
        name: block.name,
        coach: block.coach,
        room: block.room,
        durationMinutes: block.durationMinutes,
      },
    });
  };

  useEffect(() => {
    setPendingCheckInClassId(initialCheckInClassId ?? null);
  }, [initialCheckInClassId]);

  useEffect(() => {
    if (!pendingCheckInClassId || !canManageClasses) return;

    const match = findClassBlock(scheduleRows, pendingCheckInClassId);
    if (!match) {
      if (!loadingSchedule) setPendingCheckInClassId(null);
      return;
    }

    if (!canManageBlock(match.block)) {
      setClassActionMessage({
        tone: "error",
        text: "Coaches can only check members into classes assigned to them.",
      });
      setPendingCheckInClassId(null);
      return;
    }

    openTrainingEditor(match.day, match.block);
    setClassActionMessage({
      tone: "success",
      text: "This class was opened from the check-in link. Pick a member to mark attendance.",
    });
    setPendingCheckInClassId(null);
  }, [canManageBlock, canManageClasses, loadingSchedule, pendingCheckInClassId, scheduleRows]);

  const deleteClass = async () => {
    const classId = trainingDefaults.id ?? trainingDefaults.original?.id;
    if (!classId) {
      setClassActionMessage({ tone: "error", text: "This class is not saved in Supabase yet." });
      return;
    }

    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setClassActionMessage({ tone: "error", text: "Click delete again to confirm removing this training." });
      return;
    }

    setClassActionLoading("delete");
    setClassActionMessage(null);

    try {
      const response = await fetch("/api/classes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: classId, ...(resolvedClubSlug ? { clubSlug: resolvedClubSlug } : {}) }),
      });
      const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string }>(response, "Class deletion failed.");
      if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Class deletion failed.", payload.requestId));

      setScheduleRows((current) =>
        current.map((row) => {
          const day = dayKeyFromLabel(trainingDefaults.day ?? trainingDefaults.original?.day ?? "Mon");
          return { ...row, [day]: row[day].filter((item) => item.id !== classId) };
        }),
      );
      setTrainingDrawerOpen(false);
      setDeleteConfirm(false);
    } catch (error) {
      setClassActionMessage({ tone: "error", text: error instanceof Error ? error.message : "Class deletion failed." });
    } finally {
      setClassActionLoading(null);
    }
  };

  const checkInMember = async () => {
    const classId = trainingDefaults.id ?? trainingDefaults.original?.id;
    if (!classId || !selectedMemberId) {
      setClassActionMessage({ tone: "error", text: "Pick a member before saving check-in." });
      return;
    }

    setClassActionLoading("check-in");
    setClassActionMessage(null);

    try {
      const response = await fetch("/api/check-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          memberId: selectedMemberId,
          source: "manual",
          notes: `Checked in from ${trainingDefaults.name ?? trainingDefaults.original?.name ?? "schedule"}.`,
          ...(resolvedClubSlug ? { clubSlug: resolvedClubSlug } : {}),
        }),
      });
      const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string; class?: ScheduleApiClass }>(response, "Check-in failed.");
      if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Check-in failed.", payload.requestId));

      const nextCheckedIn = payload.class?.checkedIn ?? (trainingDefaults.checkedIn ?? 0) + 1;
      setTrainingDefaults((current) => ({ ...current, checkedIn: nextCheckedIn }));
      setScheduleRows((current) =>
        current.map((row) => ({
          ...row,
          mon: updateCheckedIn(row.mon, classId, nextCheckedIn),
          tue: updateCheckedIn(row.tue, classId, nextCheckedIn),
          wed: updateCheckedIn(row.wed, classId, nextCheckedIn),
          thu: updateCheckedIn(row.thu, classId, nextCheckedIn),
          fri: updateCheckedIn(row.fri, classId, nextCheckedIn),
          sat: updateCheckedIn(row.sat, classId, nextCheckedIn),
          sun: updateCheckedIn(row.sun, classId, nextCheckedIn),
        })),
      );
      const checkedInMember = members.find((member) => member.id === selectedMemberId);
      setSelectedMemberId("");
      setClassActionMessage({
        tone: "success",
        text: `${checkedInMember?.name ?? "Member"} checked in. This will appear in their member profile history.`,
      });
    } catch (error) {
      setClassActionMessage({ tone: "error", text: error instanceof Error ? error.message : "Check-in failed." });
    } finally {
      setClassActionLoading(null);
    }
  };

  useEffect(() => {
    if (loadingClub && !resolvedClubSlug) return;

    if (hasInitialSchedule && scheduleReloadKey === 0 && resolvedClubSlug === initialClubSlug) {
      setLoadingSchedule(false);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams();

    setLoadingSchedule(true);
    setClassesError(null);

    if (!resolvedClubSlug) {
      setScheduleRows([]);
      setMembers([]);
      setClassesError("Choose an academy to load the schedule.");
      setLoadingSchedule(false);
      return () => controller.abort();
    }

    params.set("club", resolvedClubSlug);

    fetch(`/api/classes${params.size ? `?${params}` : ""}`, { cache: "no-store", signal: controller.signal })
      .then((response) => readApiJson<{ classes?: ScheduleApiClass[] }>(response, "Could not load classes."))
      .then((payload: { classes?: ScheduleApiClass[] }) => {
        setScheduleRows(classesToScheduleRows(payload.classes, false));
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setClassesError(error.message);
          setScheduleRows([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSchedule(false);
      });

    fetch(`/api/members${params.size ? `?${params}` : ""}`, { cache: "no-store", signal: controller.signal })
      .then((response) => readApiJson<{ members?: ScheduleApiMember[] }>(response, "Could not load members."))
      .then((payload: { members?: ScheduleApiMember[] }) => {
        setMembers(payload.members ?? []);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setMembers([]);
      });

    return () => controller.abort();
  }, [hasInitialSchedule, initialClubSlug, loadingClub, resolvedClubSlug, scheduleReloadKey]);

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
        canManageBlock,
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
  }, [canManageBlock, canManageClasses, weekStart]);

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">{formatRange(weekStart)}</h2>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarDays size={16} />
                    Pick day
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
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

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        {classesError && resolvedClubSlug && (
          <div className="flex items-center justify-end border-b border-[var(--border)] px-4 py-3">
            <Button type="button" variant="surface" size="sm" onClick={() => setScheduleReloadKey((value) => value + 1)}>
              <RefreshCw size={14} />
              Try again
            </Button>
          </div>
        )}
        {classesError && (
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)]">
            <AlertTriangle size={16} className="shrink-0 text-[var(--accent-coral)]" />
            <span>{classesError}</span>
          </div>
        )}
        {loadingSchedule ? (
          <ScheduleLoadingState />
        ) : hasClasses ? (
          <AgGridHost className="oss-schedule-grid ag-theme-quartz h-[690px] w-full">
            <AgGridReact<ScheduleRow>
              rowData={scheduleRows}
              columnDefs={columnDefs}
              defaultColDef={{ resizable: true, suppressMovable: true }}
              theme="legacy"
              suppressCellFocus={false}
              animateRows
              getRowHeight={(params) => {
                const row = params.data;
                if (!row) return 104;
                const maxBlocks = Math.max(...dayKeys.map((key) => row[key].length));
                return Math.max(104, maxBlocks * 88 + 24);
              }}
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
            clubSlug={resolvedClubSlug}
          />
          {trainingDefaults.original && (
            <div className="mt-4 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Class actions</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Check in a member or remove this training session from the active club schedule.
                </p>
              </div>
              {classActionMessage && (
                <div
                  className={
                    classActionMessage.tone === "success"
                      ? "flex items-start gap-2 rounded-lg border border-[var(--status-success)]/25 bg-[var(--status-success)]/10 px-3 py-2 text-xs font-semibold text-[var(--foreground)]"
                      : "flex items-start gap-2 rounded-lg border border-[var(--status-danger)]/25 bg-[var(--status-danger)]/10 px-3 py-2 text-xs font-semibold text-[var(--foreground)]"
                  }
                >
                  {classActionMessage.tone === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  <span>{classActionMessage.text}</span>
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="sr-only" htmlFor="schedule-check-in-member">
                  Member
                </label>
                <select
                  id="schedule-check-in-member"
                  value={selectedMemberId}
                  onChange={(event) => setSelectedMemberId(event.target.value)}
                  className="h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                >
                  <option value="">Select member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id} className="bg-[var(--panel-strong)] text-[var(--foreground)]">
                      {member.name}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="surface" disabled={!selectedMemberId || classActionLoading === "check-in"} onClick={checkInMember}>
                  {classActionLoading === "check-in" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Check in
                </Button>
              </div>
              <Button type="button" variant={deleteConfirm ? "primary" : "outline"} className="w-full justify-center" disabled={classActionLoading === "delete"} onClick={deleteClass}>
                {classActionLoading === "delete" ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleteConfirm ? "Confirm delete training" : "Delete training"}
              </Button>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}

function ScheduleLoadingState() {
  return (
    <div className="grid min-h-[420px] place-items-center px-6 py-10">
      <div className="text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--accent)]">
          <Loader2 size={26} strokeWidth={1.6} className="animate-spin" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-[var(--foreground)]">Loading schedule</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">Getting the current class timetable from this academy.</p>
      </div>
    </div>
  );
}

function ScheduleCell(
  params: ICellRendererParams<ScheduleRow, SessionBlock[]> & {
    day?: string;
    canManageClasses?: boolean;
    canManageBlock?: (block: SessionBlock) => boolean;
    onOpenSlot?: (time: string) => void;
    onEditBlock?: (block: SessionBlock) => void;
  },
) {
  const blocks = params.value ?? [];

  if (!blocks.length) {
    return <div className="h-full w-full" />;
  }

  return (
    <div className="flex h-full w-full flex-col justify-center gap-2 py-2">
      {blocks.map((block) => {
        const canManageThisBlock = params.canManageBlock?.(block) ?? Boolean(params.canManageClasses);
        return (
          <button
            key={block.id ?? `${block.name}-${block.room}`}
            type="button"
            className="grid min-h-[76px] w-full grid-rows-[auto_1fr_auto] rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-left transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)] disabled:cursor-default disabled:opacity-75"
            onClick={() => params.onEditBlock?.(block)}
            disabled={!canManageThisBlock}
            aria-label={canManageThisBlock ? `Edit ${block.name}` : block.name}
          >
            <div className="flex min-w-0 items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-bold leading-none text-[var(--accent)]">{block.time}</span>
              <span className={`max-w-[94px] shrink-0 truncate rounded-full border px-2 py-0.5 text-[10px] font-medium ${levelTone(block.level)}`}>{formatLevelLabel(block.level)}</span>
            </div>
            <div className="min-w-0 pt-1">
              <p className="truncate text-[13px] font-semibold leading-4 text-[var(--foreground)]">{block.name}</p>
              <p className="mt-0.5 truncate text-[11px] leading-4 text-[var(--muted)]">{block.coach}</p>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-2">
              <p className="truncate text-[11px] leading-none text-[var(--muted)]">
                {block.room} · {block.durationMinutes} min
              </p>
              {typeof block.checkedIn === "number" && block.checkedIn > 0 && (
                <span className="shrink-0 rounded-full bg-[var(--accent)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                  {block.checkedIn} in
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
