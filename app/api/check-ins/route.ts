import { clubClasses, getClubRoster } from "@/data/platform";
import { apiSupabaseError, requireApiAccess, requireApiRole, requireSupabasePersistence } from "@/lib/api-access";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getBackendClubId, getMockClubId } from "@/lib/backend";
import { getReadableMemberIds } from "@/lib/member-visibility";
import { toClubClass } from "@/lib/supabase/mappers";
import { deleteRows, insertRow, isSupabaseConfigured, selectRows } from "@/lib/supabase/server";
import type { TableRow } from "@/lib/supabase/types";

const validSources = new Set(["manual", "qr", "kiosk", "strava"]);

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiAccess(searchParams.get("club"));
  if (access.error) return access.error;
  const classId = searchParams.get("classId");
  const memberId = searchParams.get("memberId");

  if (classId !== null && !isNonEmptyText(classId)) {
    return validationError("Class id cannot be empty.");
  }

  if (memberId !== null && !isNonEmptyText(memberId)) {
    return validationError("Member id cannot be empty.");
  }

  if (isSupabaseConfigured()) {
    if (classId && !isUuid(classId)) return noStoreJson({ ok: false, error: "Class id must be a valid id." }, { status: 400 });

    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ source: "supabase", checkIns: [] });

      const filters = [`club_id=eq.${clubId}`];
      if (classId) filters.push(`class_id=eq.${encodeURIComponent(classId)}`);
      const readable = await getReadableMemberIds({
        clubId,
        requestedMemberId: memberId,
        userId: access.session.user.id,
        userEmail: access.session.user.email,
        role: access.session.activeRole,
      });
      if ("error" in readable && readable.error) return readable.error;
      if ("empty" in readable && readable.empty) return noStoreJson({ source: "supabase", checkIns: [] });
      if (readable.scope === "own") filters.push(`member_id=in.(${readable.memberIds.map(encodeURIComponent).join(",")})`);
      if (readable.scope === "all" && memberId) filters.push(`member_id=eq.${encodeURIComponent(memberId)}`);

      const rows = await selectRows("class_checkins", `select=*&${filters.join("&")}&order=checked_in_at.desc`);
      return noStoreJson({ source: "supabase", checkIns: await enrichCheckIns(clubId, rows) });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  return noStoreJson({ source: "mock", checkIns: [] });
}

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin", "coach"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateCheckInPayload(payload);
  if (validation.error) return validation.error;
  const data = validation.data;

  if (isSupabaseConfigured()) {
    if (!isUuid(data.classId)) return noStoreJson({ ok: false, error: "Class id must be a valid id." }, { status: 400 });

    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

      const [classRow] = await selectRows("club_classes", `select=*&id=eq.${encodeURIComponent(data.classId)}&club_id=eq.${clubId}&limit=1`);
      if (!classRow) return noStoreJson({ ok: false, error: "Class not found in this club." }, { status: 404 });
      if (!canCoachManageClassAttendance(access.session.activeRole, access.session.user.id, access.session.user.name, classRow)) {
        return noStoreJson({ ok: false, error: "Coaches can only check members into classes assigned to them." }, { status: 403 });
      }
      const [memberRow] = await selectRows("academy_members", `select=id&club_id=eq.${clubId}&id=eq.${encodeURIComponent(data.memberId)}&limit=1`);
      if (!memberRow) return noStoreJson({ ok: false, error: "Member not found in this club." }, { status: 404 });

      const [existingCheckIn] = await selectRows(
        "class_checkins",
        `select=*&club_id=eq.${clubId}&class_id=eq.${encodeURIComponent(data.classId)}&member_id=eq.${encodeURIComponent(data.memberId)}&checked_in_date=eq.${getCheckInDate()}&limit=1`,
      );

      if (existingCheckIn) {
        return noStoreJson({ ok: false, error: "This member is already checked into this class today.", checkIn: (await enrichCheckIns(clubId, [existingCheckIn]))[0] }, { status: 409 });
      }

      const row = await insertRow("class_checkins", {
        club_id: clubId,
        class_id: data.classId,
        member_id: data.memberId,
        checked_in_by: isUuid(access.session.user.id) ? access.session.user.id : null,
        source: data.source,
        checked_in_date: getCheckInDate(),
        notes: data.notes ?? null,
      });

      const [updatedClass] = await selectRows("club_classes", `select=*&id=eq.${encodeURIComponent(data.classId)}&club_id=eq.${clubId}&limit=1`);

      return noStoreJson({ ok: true, source: "supabase", checkIn: (await enrichCheckIns(clubId, [row]))[0], class: updatedClass ? toClubClass(updatedClass) : null });
    } catch (error) {
      const checkInError = getCheckInSupabaseValidationError(error);
      if (checkInError) return checkInError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Check-ins");
  if (persistenceError) return persistenceError;

  const mockClubId = getMockClubId(access.session.activeClub.slug);
  const mockClass = clubClasses.find((item) => item.clubId === mockClubId && item.id === data.classId);
  if (!mockClass) return noStoreJson({ ok: false, error: "Class not found in this club." }, { status: 404 });
  if (!canCoachManageClassAttendance(access.session.activeRole, access.session.user.id, access.session.user.name, mockClass)) {
    return noStoreJson({ ok: false, error: "Coaches can only check members into classes assigned to them." }, { status: 403 });
  }

  const mockMember = getClubRoster(mockClubId).find((item) => item.id === data.memberId);
  if (!mockMember) return noStoreJson({ ok: false, error: "Member not found in this club." }, { status: 404 });

  return noStoreJson({
    ok: true,
    source: "mock",
    checkIn: {
      ...data,
      checkedInDate: getCheckInDate(),
      class: {
        id: mockClass.id,
        name: mockClass.name,
        day: mockClass.day,
        time: mockClass.time,
        coach: mockClass.coach,
        mat: mockClass.mat,
      },
      member: { id: mockMember.id, name: mockMember.name },
    },
    class: toClubClass({
      id: mockClass.id,
      club_id: mockClass.clubId,
      user_id: null,
      name: mockClass.name,
      coach: mockClass.coach,
      day: mockClass.day,
      time: mockClass.time,
      mat: mockClass.mat,
      level: mockClass.level,
      duration_minutes: mockClass.durationMinutes,
      checked_in: mockClass.checkedIn + 1,
      created_at: new Date().toISOString(),
    }),
  });
}

export async function DELETE(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin", "coach"], requestedClubSlug);
  if (access.error) return access.error;

  const id = requiredString(payload.id, "Check-in id");
  if (id.error) return validationError(id.error);
  const checkInId = id.value ?? "";

  if (isSupabaseConfigured()) {
    if (!isUuid(checkInId)) return noStoreJson({ ok: false, error: "Check-in id must be a valid id." }, { status: 400 });

    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

      const [checkIn] = await selectRows("class_checkins", `select=*&id=eq.${encodeURIComponent(checkInId)}&club_id=eq.${clubId}&limit=1`);
      if (!checkIn) return noStoreJson({ ok: false, error: "Check-in not found in this club." }, { status: 404 });

      const [classRow] = await selectRows("club_classes", `select=*&id=eq.${encodeURIComponent(checkIn.class_id)}&club_id=eq.${clubId}&limit=1`);
      if (!classRow) return noStoreJson({ ok: false, error: "Class not found in this club." }, { status: 404 });

      if (
        access.session.activeRole === "coach" &&
        (
          !canCoachManageClassAttendance(access.session.activeRole, access.session.user.id, access.session.user.name, classRow) ||
          !canCoachDeleteCheckIn(access.session.user.id, checkIn)
        )
      ) {
        return noStoreJson(
          { ok: false, error: "Coaches can only remove today's check-ins they created for classes assigned to them. Ask an admin to edit other attendance history." },
          { status: 403 },
        );
      }

      const removed = await deleteRows("class_checkins", `id=eq.${encodeURIComponent(checkInId)}&club_id=eq.${clubId}`);
      const [updatedClass] = await selectRows("club_classes", `select=*&id=eq.${encodeURIComponent(checkIn.class_id)}&club_id=eq.${clubId}&limit=1`);

      return noStoreJson({ ok: true, source: "supabase", removed, class: updatedClass ? toClubClass(updatedClass) : null });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Check-ins");
  if (persistenceError) return persistenceError;

  return noStoreJson({ ok: true, source: "mock", id: checkInId });
}

type CheckInPayload = {
  classId: string;
  memberId: string;
  clubSlug?: string;
  source: "manual" | "qr" | "kiosk" | "strava";
  notes?: string | null;
};

function validateCheckInPayload(payload: Record<string, unknown>): { data: CheckInPayload; error?: never } | { data?: never; error: Response } {
  const classId = requiredString(payload.classId, "Class id");
  const memberId = requiredString(payload.memberId, "Member id");
  const clubSlug = optionalString(payload.clubSlug, "Club slug");
  const source = optionalSource(payload.source);
  const notes = optionalNullableString(payload.notes, "Notes", 500);

  const firstError = [classId, memberId, clubSlug, source, notes].find((item) => item.error);
  if (firstError?.error) return { error: validationError(firstError.error) };
  if (!classId.value || !memberId.value) return { error: validationError("Class id and member id are required.") };

  return {
    data: {
      classId: classId.value,
      memberId: memberId.value,
      ...(clubSlug.value ? { clubSlug: clubSlug.value } : {}),
      source: source.value ?? "manual",
      ...(notes.value !== undefined ? { notes: notes.value } : {}),
    },
  };
}

type FieldResult<T> = { value: T; error?: never } | { value?: never; error: string };

function validationError(error: string) {
  return validationErrorJson(error);
}

function canCoachDeleteCheckIn(userId: string, checkIn: TableRow<"class_checkins">) {
  return checkIn.checked_in_by === userId && checkIn.checked_in_date === getCheckInDate();
}

function canCoachManageClassAttendance(
  role: string,
  userId: string,
  userName: string,
  classRow: { coach?: string | null; user_id?: string | null },
) {
  if (role === "owner" || role === "admin") return true;
  if (role !== "coach") return false;
  if (classRow.user_id) return isUuid(userId) && classRow.user_id === userId;
  return normalizeText(classRow.coach) === normalizeText(userName);
}

async function enrichCheckIns(clubId: string, rows: TableRow<"class_checkins">[]) {
  if (rows.length === 0) return rows;

  const classIds = Array.from(new Set(rows.map((row) => row.class_id).filter(Boolean)));
  const memberIds = Array.from(new Set(rows.map((row) => row.member_id).filter(Boolean)));
  const [classes, members] = await Promise.all([
    classIds.length
      ? selectRows("club_classes", `select=id,name,day,time,coach,mat&club_id=eq.${clubId}&id=in.(${classIds.map(encodeURIComponent).join(",")})`)
      : Promise.resolve([]),
    memberIds.length
      ? selectRows("academy_members", `select=id,name,belt,stripes,role&club_id=eq.${clubId}&id=in.(${memberIds.map(encodeURIComponent).join(",")})`)
      : Promise.resolve([]),
  ]);
  const classesById = new Map(classes.map((item) => [item.id, item]));
  const membersById = new Map(members.map((item) => [item.id, item]));

  return rows.map((row) => {
    const classRow = classesById.get(row.class_id);
    const memberRow = membersById.get(row.member_id);
    return {
      ...row,
      class: classRow
        ? {
            id: classRow.id,
            name: classRow.name,
            day: classRow.day,
            time: classRow.time,
            coach: classRow.coach,
            mat: classRow.mat,
          }
        : null,
      member: memberRow
        ? {
            id: memberRow.id,
            name: memberRow.name,
            belt: memberRow.belt,
            stripes: memberRow.stripes,
            role: memberRow.role,
          }
        : null,
    };
  });
}

function getCheckInDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCheckInSupabaseValidationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("class_checkins_one_member_per_class_day") || message.includes("duplicate key")) {
    return noStoreJson({ ok: false, error: "This member is already checked into this class today." }, { status: 409 });
  }
  if (message.includes("check-in identity fields cannot be changed")) {
    return noStoreJson({ ok: false, error: "Check-in history cannot be moved to another class, member, date, or author." }, { status: 409 });
  }

  return null;
}

function isNonEmptyText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function requiredString(value: unknown, label: string): FieldResult<string> {
  if (typeof value !== "string" || !value.trim()) return { error: `${label} is required.` };
  const trimmed = value.trim();
  if (trimmed.length > 160) return { error: `${label} is too long.` };
  return { value: trimmed };
}

function optionalString(value: unknown, label: string): FieldResult<string | undefined> {
  if (value === undefined || value === null) return { value: undefined as string | undefined };
  return requiredString(value, label);
}

function optionalNullableString(value: unknown, label: string, maxLength: number): FieldResult<string | null | undefined> {
  if (value === undefined) return { value: undefined as string | null | undefined };
  if (value === null) return { value: null };
  if (typeof value !== "string") return { error: `${label} must be text.` };
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return { error: `${label} is too long.` };
  return { value: trimmed || null };
}

function optionalSource(value: unknown): FieldResult<CheckInPayload["source"] | undefined> {
  if (value === undefined || value === null) return { value: undefined as CheckInPayload["source"] | undefined };
  if (typeof value !== "string" || !validSources.has(value)) return { error: "Check-in source is not supported." };
  return { value: value as CheckInPayload["source"] };
}

function isUuid(value: string) {
  return uuidPattern.test(value);
}
