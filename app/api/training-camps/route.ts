import type { TrainingCamp } from "@/data/training-camps";
import { getClubRoster } from "@/data/platform";
import { apiSupabaseError, requireApiAccess, requireApiRole, requireSupabaseBackendData, requireSupabasePersistence } from "@/lib/api-access";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getBackendClubId, getMockClubId } from "@/lib/backend";
import { getReadableMemberIds } from "@/lib/member-visibility";
import { getMockTrainingCampsForClub, getVisibleMockTrainingCampsForClub } from "@/lib/mock-club-content";
import { deleteRows, insertRow, isSupabaseConfigured, selectRows, updateRows } from "@/lib/supabase/server";
import { toTrainingCamp, toTrainingCampInsert } from "@/lib/supabase/mappers";

const validCampStatuses = new Set(["Registration open", "Planning", "Early bird", "Waitlist", "Closed", "Completed", "Cancelled"]);
const validCampTypes = new Set(["Gi", "No-Gi", "Gi / No-Gi"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiAccess(searchParams.get("club"));
  if (access.error) return access.error;
  const backendError = requireSupabaseBackendData("Training camps");
  if (backendError) return backendError;
  const clubSlug = access.session.activeClub.slug;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(clubSlug);
      if (!clubId) return noStoreJson({ source: "supabase", camps: [] });
      const rows = await selectRows("training_camps", `select=*&club_id=eq.${clubId}&order=prep.desc`);
      const readable = await getReadableMemberIds({
        clubId,
        userId: access.session.user.id,
        userEmail: access.session.user.email,
        role: access.session.activeRole,
      });
      if ("error" in readable && readable.error) return readable.error;
      return noStoreJson({ source: "supabase", camps: filterCampRosters(rows.map(toTrainingCamp), readable) });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  return noStoreJson({
    source: "mock",
    camps: getVisibleMockTrainingCampsForClub(clubSlug, {
      role: access.session.activeRole,
      userName: access.session.user.name,
    }),
  });
}

function filterCampRosters(
  camps: TrainingCamp[],
  readable: Awaited<ReturnType<typeof getReadableMemberIds>>,
) {
  if ("scope" in readable && readable.scope === "all") return camps;
  const allowedIds = new Set("scope" in readable && readable.scope === "own" ? readable.memberIds : []);
  return camps
    .filter((camp) => camp.registered_students.length === 0 || camp.registered_students.some((id) => allowedIds.has(id)))
    .map((camp) => ({
      ...camp,
      registered_students: camp.registered_students.filter((id) => allowedIds.has(id)),
    }));
}

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateTrainingCampPayload(payload);
  if (validation.error) return validation.error;
  const camp = validation.data;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const rosterError = await validateSupabaseRegisteredMembers(clubId, camp.registered_students);
      if (rosterError) return rosterError;
      const campId = await getAvailablePlanningId("training_camps", clubId, camp.id, "camp");
      if (!campId) return noStoreJson({ ok: false, error: "A camp with this id already exists in this club." }, { status: 409 });

      const row = await insertRow("training_camps", toTrainingCampInsert({ ...camp, id: campId }, clubId));
      return noStoreJson({ ok: true, source: "supabase", camp: toTrainingCamp(row) });
    } catch (error) {
      const campError = getCampSupabaseValidationError(error);
      if (campError) return campError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Training camps");
  if (persistenceError) return persistenceError;

  const mockCamps = getMockTrainingCampsForClub(access.session.activeClub.slug);
  if (mockCamps.some((item) => item.id === camp.id)) {
    return noStoreJson({ ok: false, error: "A camp with this id already exists in this club." }, { status: 409 });
  }
  const mockRosterError = validateMockRegisteredMembers(access.session.activeClub.slug, camp.registered_students);
  if (mockRosterError) return mockRosterError;

  return noStoreJson({ ok: true, source: "mock", camp });
}

export async function PATCH(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateTrainingCampPayload(payload);
  if (validation.error) return validation.error;
  const camp = validation.data;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const rosterError = await validateSupabaseRegisteredMembers(clubId, camp.registered_students);
      if (rosterError) return rosterError;
      const [existingCamp] = await selectRows("training_camps", `select=id&club_id=eq.${clubId}&id=eq.${encodeURIComponent(camp.id)}&limit=1`);
      if (!existingCamp) return noStoreJson({ ok: false, error: "Camp not found in this club." }, { status: 404 });

      const [row] = await updateRows("training_camps", toTrainingCampInsert(camp, clubId), `id=eq.${encodeURIComponent(camp.id)}&club_id=eq.${clubId}`);
      return noStoreJson({ ok: true, source: "supabase", camp: toTrainingCamp(row) });
    } catch (error) {
      const campError = getCampSupabaseValidationError(error);
      if (campError) return campError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Training camps");
  if (persistenceError) return persistenceError;

  const mockCamps = getMockTrainingCampsForClub(access.session.activeClub.slug);
  if (!mockCamps.some((item) => item.id === camp.id)) {
    return noStoreJson({ ok: false, error: "Camp not found in this club." }, { status: 404 });
  }
  const mockRosterError = validateMockRegisteredMembers(access.session.activeClub.slug, camp.registered_students);
  if (mockRosterError) return mockRosterError;

  return noStoreJson({ ok: true, source: "mock", camp });
}

export async function DELETE(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const forbidden = getForbiddenCampField(payload, "delete");
  if (forbidden) return validationError(`${forbidden} is assigned by the server.`);

  const id = requiredString(payload.id, "Camp id", 120);
  if (id.error) return validationError(id.error);
  const campId = id.value ?? "";

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const removed = await deleteRows("training_camps", `id=eq.${encodeURIComponent(campId)}&club_id=eq.${clubId}`);
      if (removed.length === 0) return noStoreJson({ ok: false, error: "Camp not found in this club." }, { status: 404 });
      return noStoreJson({ ok: true, source: "supabase", removed });
    } catch (error) {
      const campError = getCampSupabaseValidationError(error);
      if (campError) return campError;
      return apiSupabaseError(error, { clubId });
    }
  }

  if (!getMockTrainingCampsForClub(access.session.activeClub.slug).some((item) => item.id === campId)) {
    return noStoreJson({ ok: false, error: "Camp not found in this club." }, { status: 404 });
  }

  const persistenceError = requireSupabasePersistence("Training camps");
  if (persistenceError) return persistenceError;

  return noStoreJson({ ok: true, source: "mock", id: campId });
}

async function getAvailablePlanningId(table: "training_camps", clubId: string, requestedId: string, prefix: string) {
  const [existing] = await selectRows(table, `select=id,club_id&id=eq.${encodeURIComponent(requestedId)}&limit=1`);
  if (!existing) return requestedId;
  if (existing.club_id === clubId) return null;
  return `${prefix}-${clubId.slice(0, 8)}-${crypto.randomUUID().slice(0, 8)}`;
}

async function validateSupabaseRegisteredMembers(clubId: string, memberIds: string[]) {
  if (memberIds.length === 0) return null;
  const uniqueIds = Array.from(new Set(memberIds));
  const rows = await selectRows("academy_members", `select=id&club_id=eq.${clubId}&id=in.(${uniqueIds.map(encodeURIComponent).join(",")})`);
  if (rows.length !== uniqueIds.length) {
    return noStoreJson({ ok: false, error: "Registered members must belong to this club." }, { status: 400 });
  }
  return null;
}

function validateMockRegisteredMembers(clubSlug: string, memberIds: string[]) {
  if (memberIds.length === 0) return null;
  const rosterIds = new Set(getClubRoster(getMockClubId(clubSlug)).map((member) => member.id));
  if (memberIds.some((id) => !rosterIds.has(id))) {
    return noStoreJson({ ok: false, error: "Registered members must belong to this club." }, { status: 400 });
  }
  return null;
}

function validateTrainingCampPayload(payload: Record<string, unknown>): { data: TrainingCamp; error?: never } | { data?: never; error: Response } {
  const forbidden = getForbiddenCampField(payload, "write");
  if (forbidden) return { error: validationError(`${forbidden} is assigned by the server.`) };

  const id = requiredString(payload.id, "Camp id", 120);
  const name = requiredString(payload.name, "Camp name", 160);
  const date = requiredString(payload.date, "Start date", 120);
  const endDate = requiredString(payload.endDate, "End date", 120);
  const location = requiredString(payload.location, "Location", 160);
  const city = requiredString(payload.city, "City", 120);
  const venue = requiredString(payload.venue, "Venue", 160);
  const host = requiredString(payload.host, "Host", 160);
  const focus = requiredString(payload.focus, "Focus", 240);
  const registeredStudents = optionalStringArray(payload.registered_students, "Registered members", 200, 120);
  const registrationDeadline = requiredString(payload.registration_deadline, "Registration deadline", 120);
  const status = requiredPlanningValue(payload.status, validCampStatuses, "Status");
  const notes = requiredString(payload.notes, "Notes", 1200);
  const type = requiredPlanningValue(payload.type, validCampTypes, "Type");
  const prep = requiredInteger(payload.prep, "Prep", 0, 100);
  const spotsTotal = requiredInteger(payload.spotsTotal, "Spots total", 1, 10000);
  const estimatedCost = requiredString(payload.estimatedCost, "Estimated cost", 80);

  const firstError = [
    id,
    name,
    date,
    endDate,
    location,
    city,
    venue,
    host,
    focus,
    registeredStudents,
    registrationDeadline,
    status,
    notes,
    type,
    prep,
    spotsTotal,
    estimatedCost,
  ].find((item) => item.error);
  if (firstError?.error) return { error: validationError(firstError.error) };
  const dateOrderError = getCampDateError(date.value, endDate.value, registrationDeadline.value);
  if (dateOrderError) return { error: validationError(dateOrderError) };

  return {
    data: {
      id: id.value ?? "",
      name: name.value ?? "",
      date: date.value ?? "",
      endDate: endDate.value ?? "",
      location: location.value ?? "",
      city: city.value ?? "",
      venue: venue.value ?? "",
      host: host.value ?? "",
      focus: focus.value ?? "",
      registered_students: registeredStudents.value ?? [],
      registration_deadline: registrationDeadline.value ?? "",
      status: status.value ?? "",
      notes: notes.value ?? "",
      type: type.value ?? "",
      prep: prep.value ?? 0,
      spotsTotal: spotsTotal.value ?? 1,
      estimatedCost: estimatedCost.value ?? "",
    },
  };
}

type FieldResult<T> = { value: T; error?: never } | { value?: never; error: string };

function validationError(error: string) {
  return validationErrorJson(error);
}

function getForbiddenCampField(payload: Record<string, unknown>, mode: "write" | "delete") {
  const serverLabels: Record<string, string> = {
    clubId: "Camp club",
    club_id: "Camp club",
    createdAt: "Camp creation time",
    created_at: "Camp creation time",
    updatedAt: "Camp update time",
    updated_at: "Camp update time",
  };
  const deleteOnlyLabels: Record<string, string> = mode === "delete"
    ? {
        city: "City",
        date: "Start date",
        endDate: "End date",
        estimatedCost: "Estimated cost",
        focus: "Focus",
        host: "Host",
        location: "Location",
        name: "Camp name",
        notes: "Notes",
        prep: "Prep",
        registeredStudents: "Registered members",
        registered_students: "Registered members",
        registered_member_ids: "Registered members",
        registration_deadline: "Registration deadline",
        spotsTotal: "Spots total",
        status: "Status",
        type: "Type",
        venue: "Venue",
      }
    : {
        registered_member_ids: "Registered members",
      };
  const labels = { ...serverLabels, ...deleteOnlyLabels };
  const field = Object.keys(labels).find((key) => payload[key] !== undefined);
  return field ? labels[field] : null;
}

function getCampSupabaseValidationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("training_camps_prep_valid")) {
    return noStoreJson({ ok: false, error: "Camp prep must be between 0 and 100." }, { status: 400 });
  }
  if (message.includes("training_camps_spots_total_valid")) {
    return noStoreJson({ ok: false, error: "Camp spots must be at least 1 and cannot be lower than registered members." }, { status: 400 });
  }
  if (message.includes("training_camps_status_valid")) {
    return noStoreJson({ ok: false, error: "Camp status is not supported." }, { status: 400 });
  }
  if (message.includes("training_camps_type_valid")) {
    return noStoreJson({ ok: false, error: "Camp type is not supported." }, { status: 400 });
  }
  if (message.includes("registered_member_ids must be unique")) {
    return noStoreJson({ ok: false, error: "Registered members cannot contain duplicates." }, { status: 400 });
  }
  if (message.includes("registered_member_ids must belong")) {
    return noStoreJson({ ok: false, error: "Registered members must belong to this club." }, { status: 400 });
  }

  return null;
}

function requiredString(value: unknown, label: string, maxLength: number): FieldResult<string> {
  if (typeof value !== "string" || !value.trim()) return { error: `${label} is required.` };
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return { error: `${label} is too long.` };
  return { value: trimmed };
}

function requiredPlanningValue(value: unknown, allowedValues: Set<string>, label: string): FieldResult<string> {
  const text = requiredString(value, label, 80);
  if (text.error) return text;
  const nextValue = text.value ?? "";
  if (!allowedValues.has(nextValue)) return { error: `${label} is not supported.` };
  return { value: nextValue };
}

function requiredInteger(value: unknown, label: string, min: number, max: number): FieldResult<number> {
  if (typeof value !== "number" || !Number.isInteger(value)) return { error: `${label} must be a whole number.` };
  if (value < min || value > max) return { error: `${label} must be between ${min} and ${max}.` };
  return { value };
}

function getCampDateError(startDate?: string, endDate?: string, registrationDeadline?: string) {
  const startTime = parseDateTime(startDate);
  if (startTime === null) return "Camp start date must be a real date.";
  const endTime = parseDateTime(endDate);
  if (endTime === null) return "Camp end date must be a real date.";
  const deadlineTime = parseDateTime(registrationDeadline);
  if (deadlineTime === null) return "Registration deadline must be a real date.";
  if (endTime < startTime) return "Camp end date cannot be before the start date.";
  if (deadlineTime > startTime) return "Registration deadline cannot be after the camp starts.";
  return null;
}

function parseDateTime(value?: string) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

function optionalStringArray(value: unknown, label: string, maxItems: number, maxLength: number): FieldResult<string[] | undefined> {
  if (value === undefined || value === null) return { value: undefined as string[] | undefined };
  if (!Array.isArray(value)) return { error: `${label} must be a list.` };
  if (value.length > maxItems) return { error: `${label} has too many items.` };
  const next = value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
  if (next.length !== value.length) return { error: `${label} must contain text values.` };
  if (next.some((item) => item.length > maxLength)) return { error: `${label} contains an item that is too long.` };
  if (new Set(next).size !== next.length) return { error: `${label} cannot contain duplicates.` };
  return { value: next.length ? next : undefined };
}
