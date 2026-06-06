import type { NextResponse } from "next/server";
import { clubClasses } from "@/data/platform";
import { apiSupabaseError, requireApiAccess, requireApiRole, requireSupabasePersistence } from "@/lib/api-access";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getBackendClubId, getMockClubId } from "@/lib/backend";
import { deleteRows, isSupabaseConfigured, insertRow, selectRows, updateRows } from "@/lib/supabase/server";
import { toClubClass } from "@/lib/supabase/mappers";

const canonicalDays = {
  mon: "Mon",
  monday: "Mon",
  tue: "Tue",
  tuesday: "Tue",
  wed: "Wed",
  wednesday: "Wed",
  thu: "Thu",
  thursday: "Thu",
  fri: "Fri",
  friday: "Fri",
  sat: "Sat",
  saturday: "Sat",
  sun: "Sun",
  sunday: "Sun",
} as const;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiAccess(searchParams.get("club"));
  if (access.error) return access.error;
  const clubSlug = access.session.activeClub.slug;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(clubSlug);
      if (!clubId) return noStoreJson({ source: "supabase", classes: [] });

      const rows = await selectRows("club_classes", `select=*&club_id=eq.${clubId}&order=day.asc,time.asc`);
      return noStoreJson({ source: "supabase", classes: rows.map(toClubClass) });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  return noStoreJson({ source: "mock", classes: getMockClasses(clubSlug) });
}

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin", "coach"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateClassPayload(payload, "create");
  if (validation.error) return validation.error;
  const data = getWritableClassPayload(validation.data, access.session.activeRole, access.session.user.name);
  const className = data.name ?? "";
  const coach = data.coach ?? "";
  const day = data.day ?? "";
  const time = data.time ?? "";
  const durationMinutes = data.durationMinutes ?? 60;

  const normalizedDay = normalizeClassDay(day);
  const normalizedTime = normalizeClassField(time);

  const timeBoundaryError = getClassTimeBoundaryError(time, durationMinutes);
  if (timeBoundaryError) return validationError(timeBoundaryError);

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

      const existingClasses = await selectRows("club_classes", `select=*&club_id=eq.${clubId}`);
      const overlappingClass = findOverlappingClass(existingClasses, {
        day,
        time,
        mat: data.mat ?? "Main Mat",
        durationMinutes,
      });

      if (overlappingClass) {
        return noStoreJson(
          { ok: false, error: `${overlappingClass.name} already uses ${overlappingClass.mat} on ${day} at ${time}. Pick another time or mat.` },
          { status: 409 },
        );
      }

      const created = await insertRow("club_classes", {
        club_id: clubId,
        name: className,
        coach,
        day,
        time,
        mat: data.mat ?? "Main Mat",
        level: data.level ?? "all belts",
        duration_minutes: durationMinutes,
        checked_in: 0,
      });

      return noStoreJson({ ok: true, source: "supabase", class: toClubClass(created) });
    } catch (error) {
      const classError = getClassSupabaseValidationError(error);
      if (classError) return classError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Schedule CRUD");
  if (persistenceError) return persistenceError;

  const mockOverlap = getMockClassOverlap(access.session.activeClub.slug, normalizedDay, normalizedTime, durationMinutes, data.mat ?? "Main Mat");

  if (mockOverlap) {
    return noStoreJson(
      { ok: false, error: `${mockOverlap.name} already uses ${mockOverlap.mat} on ${day} at ${time}. Pick another time or mat.` },
      { status: 409 },
    );
  }

  return noStoreJson({ ok: true, source: "mock", class: data });
}

export async function PATCH(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin", "coach"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateClassPayload(payload, "update");
  if (validation.error) return validation.error;
  const data = getWritableClassPayload(validation.data, access.session.activeRole, access.session.user.name);

  if (isSupabaseConfigured()) {
    if (!isUuid(data.id)) return noStoreJson({ ok: false, error: "Class id must be a valid id." }, { status: 400 });

    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

      const [existing] = await selectRows("club_classes", `select=*&id=eq.${encodeURIComponent(data.id)}&club_id=eq.${clubId}&limit=1`);
      if (!existing) return noStoreJson({ ok: false, error: "Class not found in this club." }, { status: 404 });
      if (!canManageClass(access.session.activeRole, access.session.user.name, existing)) {
        return noStoreJson({ ok: false, error: "Coaches can only update classes assigned to them." }, { status: 403 });
      }

      const nextClass = {
        day: data.day ?? existing.day,
        time: data.time ?? existing.time,
        mat: data.mat ?? existing.mat,
        durationMinutes: data.durationMinutes ?? existing.duration_minutes ?? 60,
      };
      const timeBoundaryError = getClassTimeBoundaryError(nextClass.time, nextClass.durationMinutes);
      if (timeBoundaryError) return validationError(timeBoundaryError);

      if (data.day || data.time || data.mat || typeof data.durationMinutes === "number") {
        const sameDayClasses = await selectRows("club_classes", `select=*&club_id=eq.${clubId}&id=neq.${encodeURIComponent(data.id)}`);
        const overlappingClass = findOverlappingClass(sameDayClasses, nextClass);

        if (overlappingClass) {
          return noStoreJson(
            { ok: false, error: `${overlappingClass.name} already uses ${overlappingClass.mat} on ${nextClass.day} at ${nextClass.time}. Pick another time or mat.` },
            { status: 409 },
          );
        }
      }

      const [updated] = await updateRows(
        "club_classes",
        {
          ...(data.name ? { name: data.name } : {}),
          ...(data.coach ? { coach: data.coach } : {}),
          ...(data.day ? { day: data.day } : {}),
          ...(data.time ? { time: data.time } : {}),
          ...(data.mat ? { mat: data.mat } : {}),
          ...(data.level ? { level: data.level } : {}),
          ...(typeof data.durationMinutes === "number" ? { duration_minutes: data.durationMinutes } : {}),
        },
        `id=eq.${encodeURIComponent(data.id)}&club_id=eq.${clubId}`,
      );

      if (!updated) return noStoreJson({ ok: false, error: "Class not found in this club." }, { status: 404 });
      return noStoreJson({ ok: true, source: "supabase", class: toClubClass(updated) });
    } catch (error) {
      const classError = getClassSupabaseValidationError(error);
      if (classError) return classError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Schedule CRUD");
  if (persistenceError) return persistenceError;

  const mockClasses = getMockClasses(access.session.activeClub.slug);
  const existing = mockClasses.find((item) => item.id === data.id);
  if (!existing) return noStoreJson({ ok: false, error: "Class not found in this club." }, { status: 404 });
  if (!canManageClass(access.session.activeRole, access.session.user.name, existing)) {
    return noStoreJson({ ok: false, error: "Coaches can only update classes assigned to them." }, { status: 403 });
  }

  const nextClass = {
    day: data.day ?? existing.day,
    time: data.time ?? existing.time,
    mat: data.mat ?? existing.mat,
    durationMinutes: data.durationMinutes ?? existing.durationMinutes ?? 60,
  };
  const timeBoundaryError = getClassTimeBoundaryError(nextClass.time, nextClass.durationMinutes);
  if (timeBoundaryError) return validationError(timeBoundaryError);

  if (data.day || data.time || data.mat || typeof data.durationMinutes === "number") {
    const overlappingClass = findOverlappingClass(
      mockClasses.filter((item) => item.id !== data.id),
      nextClass,
    );

    if (overlappingClass) {
      return noStoreJson(
        { ok: false, error: `${overlappingClass.name} already uses ${overlappingClass.mat} on ${nextClass.day} at ${nextClass.time}. Pick another time or mat.` },
        { status: 409 },
      );
    }
  }

  return noStoreJson({ ok: true, source: "mock", class: { ...existing, ...data } });
}

export async function DELETE(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin", "coach"], requestedClubSlug);
  if (access.error) return access.error;

  if (typeof payload.id !== "string" || !payload.id.trim()) {
    return noStoreJson({ ok: false, error: "Missing class id." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    if (!isUuid(payload.id)) return noStoreJson({ ok: false, error: "Class id must be a valid id." }, { status: 400 });

    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

      const [existing] = await selectRows("club_classes", `select=*&id=eq.${encodeURIComponent(payload.id)}&club_id=eq.${clubId}&limit=1`);
      if (!existing) return noStoreJson({ ok: false, error: "Class not found in this club." }, { status: 404 });
      if (!canManageClass(access.session.activeRole, access.session.user.name, existing)) {
        return noStoreJson({ ok: false, error: "Coaches can only delete classes assigned to them." }, { status: 403 });
      }

      const [existingCheckIn] = await selectRows(
        "class_checkins",
        `select=id&club_id=eq.${clubId}&class_id=eq.${encodeURIComponent(payload.id)}&limit=1`,
      );
      if (existingCheckIn) {
        return noStoreJson(
          { ok: false, error: "This class already has attendance history. Remove the check-ins first or edit the class instead of deleting it." },
          { status: 409 },
        );
      }

      const removed = await deleteRows("club_classes", `id=eq.${encodeURIComponent(payload.id)}&club_id=eq.${clubId}`);
      if (removed.length === 0) return noStoreJson({ ok: false, error: "Class not found in this club." }, { status: 404 });
      return noStoreJson({ ok: true, source: "supabase", removed });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Schedule CRUD");
  if (persistenceError) return persistenceError;

  const mockClass = getMockClasses(access.session.activeClub.slug).find((item) => item.id === payload.id);
  if (!mockClass) return noStoreJson({ ok: false, error: "Class not found in this club." }, { status: 404 });
  if (!canManageClass(access.session.activeRole, access.session.user.name, mockClass)) {
    return noStoreJson({ ok: false, error: "Coaches can only delete classes assigned to them." }, { status: 403 });
  }

  return noStoreJson({ ok: true, source: "mock", id: payload.id });
}

function getMockClasses(clubSlug?: string | null) {
  if (!clubSlug) return clubClasses;
  const clubId = getMockClubId(clubSlug);
  return clubClasses.filter((item) => item.clubId === clubId);
}

function getMockClassOverlap(clubSlug: string | undefined, normalizedDay: string, normalizedTime: string, durationMinutes: number, mat = "Main Mat") {
  const normalizedMat = normalizeClassField(mat);
  return getMockClasses(clubSlug).find(
    (item) =>
      normalizeClassDay(item.day) === normalizedDay &&
      normalizeClassField(item.mat) === normalizedMat &&
      intervalsOverlap(
        timeToMinutes(item.time),
        timeToMinutes(item.time) + (item.durationMinutes ?? 60),
        timeToMinutes(normalizedTime),
        timeToMinutes(normalizedTime) + durationMinutes,
      ),
  );
}

function getWritableClassPayload(data: ValidatedClassPayload, role: string, userName: string): ValidatedClassPayload {
  if (role !== "coach") return data;
  return { ...data, coach: userName };
}

function canManageClass(role: string, userName: string, classRow: { coach?: string | null }) {
  if (role === "owner" || role === "admin") return true;
  if (role !== "coach") return false;
  return normalizeClassField(classRow.coach) === normalizeClassField(userName);
}

function normalizeClassField(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeClassDay(value: unknown) {
  return canonicalDays[normalizeClassField(value) as keyof typeof canonicalDays] ?? "";
}

type ClassValidationMode = "create" | "update";
type ValidatedClassPayload = {
  id: string;
  clubSlug?: string;
  name?: string;
  coach?: string;
  day?: string;
  time?: string;
  mat?: string;
  level?: string;
  durationMinutes?: number;
};

function validateClassPayload(payload: Record<string, unknown>, mode: ClassValidationMode): { data: ValidatedClassPayload; error?: never } | { data?: never; error: NextResponse } {
  if (payload.checkedIn !== undefined || payload.checked_in !== undefined) {
    return { error: validationError("Checked-in count is managed by attendance check-ins.") };
  }

  const id = optionalString(payload.id, "Class id");
  const clubSlug = optionalString(payload.clubSlug, "Club slug");
  const name = optionalString(payload.name, "Class name");
  const coach = optionalString(payload.coach, "Coach");
  const day = optionalDay(payload.day);
  const time = optionalTime(payload.time);
  const mat = optionalString(payload.mat, "Mat");
  const level = optionalString(payload.level, "Level");
  const durationMinutes = optionalInteger(payload.durationMinutes, "Duration", 15, 240);

  const firstError = [id, clubSlug, name, coach, day, time, mat, level, durationMinutes].find((item) => item.error);
  if (firstError?.error) return { error: validationError(firstError.error) };

  if (mode === "create" && (!name.value || !coach.value || !day.value || !time.value)) {
    return { error: validationError("Class name, coach, day, and time are required.") };
  }

  if (mode === "update" && !id.value) {
    return { error: validationError("Class id is required.") };
  }

  return {
    data: {
      id: id.value ?? `class-${Date.now()}`,
      ...(clubSlug.value ? { clubSlug: clubSlug.value } : {}),
      ...(name.value ? { name: name.value } : {}),
      ...(coach.value ? { coach: coach.value } : {}),
      ...(day.value ? { day: day.value } : {}),
      ...(time.value ? { time: time.value } : {}),
      ...(mat.value ? { mat: mat.value } : {}),
      ...(level.value ? { level: level.value } : {}),
      ...(typeof durationMinutes.value === "number" ? { durationMinutes: durationMinutes.value } : {}),
    },
  };
}

type FieldResult<T> = { value: T; error?: never } | { value?: never; error: string };

function validationError(error: string) {
  return validationErrorJson(error);
}

function getClassTimeBoundaryError(time: string, durationMinutes: number) {
  if (timeToMinutes(time) + durationMinutes > 24 * 60) {
    return "Class duration cannot run past the end of the day.";
  }

  return null;
}

function getClassSupabaseValidationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Class overlaps with existing class")) {
    return noStoreJson({ ok: false, error: extractSupabaseMessage(message) }, { status: 409 });
  }
  if (message.includes("Class duration cannot run past") || message.includes("Class time must use")) {
    return noStoreJson({ ok: false, error: extractSupabaseMessage(message) }, { status: 400 });
  }
  if (message.includes("club_classes_text_nonempty")) {
    return noStoreJson({ ok: false, error: "Class name, coach, mat, and level are required." }, { status: 400 });
  }
  if (message.includes("club_classes_time_valid")) {
    return noStoreJson({ ok: false, error: "Time must use 24-hour HH:MM format." }, { status: 400 });
  }
  if (message.includes("class checked_in is managed by attendance check-ins")) {
    return noStoreJson({ ok: false, error: "Checked-in count is managed by attendance check-ins." }, { status: 400 });
  }

  return null;
}

function extractSupabaseMessage(message: string) {
  const jsonStart = message.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(message.slice(jsonStart)) as { message?: unknown };
      if (typeof parsed.message === "string" && parsed.message.trim()) return parsed.message;
    } catch {
      // Fall back to the raw message below.
    }
  }

  return message;
}

function optionalString(value: unknown, label: string): FieldResult<string | undefined> {
  if (value === undefined || value === null) return { value: undefined as string | undefined };
  if (typeof value !== "string") return { error: `${label} must be text.` };
  const trimmed = value.trim();
  if (!trimmed) return { error: `${label} cannot be empty.` };
  if (trimmed.length > 160) return { error: `${label} is too long.` };
  return { value: trimmed };
}

function optionalDay(value: unknown): FieldResult<string | undefined> {
  if (value === undefined || value === null) return { value: undefined as string | undefined };
  if (typeof value !== "string") return { error: "Day must be a valid weekday." };
  const normalized = normalizeClassDay(value);
  if (!normalized) return { error: "Day must be a valid weekday." };
  return { value: normalized };
}

function optionalTime(value: unknown): FieldResult<string | undefined> {
  if (value === undefined || value === null) return { value: undefined as string | undefined };
  if (typeof value !== "string" || !timePattern.test(value.trim())) return { error: "Time must use 24-hour HH:MM format." };
  return { value: value.trim() };
}

function optionalInteger(value: unknown, label: string, min: number, max = Number.MAX_SAFE_INTEGER): FieldResult<number | undefined> {
  if (value === undefined || value === null) return { value: undefined as number | undefined };
  if (typeof value !== "number" || !Number.isInteger(value)) return { error: `${label} must be a whole number.` };
  if (value < min || value > max) return { error: `${label} must be between ${min} and ${max}.` };
  return { value };
}

function findOverlappingClass<T extends { id?: string; day: string; time: string; mat: string; duration_minutes?: number; durationMinutes?: number; name: string }>(
  classes: T[],
  candidate: { day: string; time: string; mat: string; durationMinutes: number },
) {
  const candidateStart = timeToMinutes(candidate.time);
  const candidateEnd = candidateStart + candidate.durationMinutes;
  const normalizedDay = normalizeClassDay(candidate.day);
  const normalizedMat = normalizeClassField(candidate.mat);

  return classes.find((item) => {
    if (normalizeClassDay(item.day) !== normalizedDay) return false;
    if (normalizeClassField(item.mat) !== normalizedMat) return false;
    const start = timeToMinutes(item.time);
    const duration = item.duration_minutes ?? item.durationMinutes ?? 60;
    return intervalsOverlap(start, start + duration, candidateStart, candidateEnd);
  });
}

function timeToMinutes(value: string) {
  const normalized = value.trim();
  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
}

function intervalsOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

function isUuid(value: unknown) {
  return typeof value === "string" && uuidPattern.test(value);
}
