import type { Competition } from "@/data/competitions";
import { getClubRoster } from "@/data/platform";
import { apiSupabaseError, requireApiAccess, requireApiRole } from "@/lib/api-access";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getBackendClubId, getMockClubId } from "@/lib/backend";
import { getReadableMemberIds } from "@/lib/member-visibility";
import { getMockCompetitionsForClub, getVisibleMockCompetitionsForClub } from "@/lib/mock-club-content";
import { deleteRows, insertRow, isSupabaseConfigured, selectRows, updateRows } from "@/lib/supabase/server";
import { toCompetition, toCompetitionInsert } from "@/lib/supabase/mappers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiAccess(searchParams.get("club"));
  if (access.error) return access.error;
  const clubSlug = access.session.activeClub.slug;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(clubSlug);
      if (!clubId) return noStoreJson({ source: "supabase", competitions: [] });
      const rows = await selectRows("competitions", `select=*&club_id=eq.${clubId}&order=prep.desc`);
      const readable = await getReadableMemberIds({
        clubId,
        userId: access.session.user.id,
        userEmail: access.session.user.email,
        role: access.session.activeRole,
      });
      if ("error" in readable && readable.error) return readable.error;
      return noStoreJson({ source: "supabase", competitions: filterCompetitionRosters(rows.map(toCompetition), readable) });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  return noStoreJson({
    source: "mock",
    competitions: getVisibleMockCompetitionsForClub(clubSlug, {
      role: access.session.activeRole,
      userName: access.session.user.name,
    }),
  });
}

function filterCompetitionRosters(
  competitions: Competition[],
  readable: Awaited<ReturnType<typeof getReadableMemberIds>>,
) {
  if ("scope" in readable && readable.scope === "all") return competitions;
  const allowedIds = new Set("scope" in readable && readable.scope === "own" ? readable.memberIds : []);
  return competitions
    .filter((competition) => competition.registered_students.length === 0 || competition.registered_students.some((id) => allowedIds.has(id)))
    .map((competition) => ({
      ...competition,
      registered_students: competition.registered_students.filter((id) => allowedIds.has(id)),
    }));
}

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin", "coach"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateCompetitionPayload(payload);
  if (validation.error) return validation.error;
  const competition = validation.data;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const rosterError = await validateSupabaseRegisteredMembers(clubId, competition.registered_students);
      if (rosterError) return rosterError;
      const competitionId = await getAvailablePlanningId("competitions", clubId, competition.id, "cmp");
      if (!competitionId) return noStoreJson({ ok: false, error: "A competition with this id already exists in this club." }, { status: 409 });

      const row = await insertRow("competitions", toCompetitionInsert({ ...competition, id: competitionId }, clubId));
      return noStoreJson({ ok: true, source: "supabase", competition: toCompetition(row) });
    } catch (error) {
      const competitionError = getCompetitionSupabaseValidationError(error);
      if (competitionError) return competitionError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const mockCompetitions = getMockCompetitionsForClub(access.session.activeClub.slug);
  if (mockCompetitions.some((item) => item.id === competition.id)) {
    return noStoreJson({ ok: false, error: "A competition with this id already exists in this club." }, { status: 409 });
  }
  const mockRosterError = validateMockRegisteredMembers(access.session.activeClub.slug, competition.registered_students);
  if (mockRosterError) return mockRosterError;

  return noStoreJson({ ok: true, source: "mock", competition });
}

export async function PATCH(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin", "coach"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateCompetitionPayload(payload);
  if (validation.error) return validation.error;
  const competition = validation.data;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const rosterError = await validateSupabaseRegisteredMembers(clubId, competition.registered_students);
      if (rosterError) return rosterError;
      const [existingCompetition] = await selectRows("competitions", `select=id&club_id=eq.${clubId}&id=eq.${encodeURIComponent(competition.id)}&limit=1`);
      if (!existingCompetition) return noStoreJson({ ok: false, error: "Competition not found in this club." }, { status: 404 });

      const [row] = await updateRows("competitions", toCompetitionInsert(competition, clubId), `id=eq.${encodeURIComponent(competition.id)}&club_id=eq.${clubId}`);
      return noStoreJson({ ok: true, source: "supabase", competition: toCompetition(row) });
    } catch (error) {
      const competitionError = getCompetitionSupabaseValidationError(error);
      if (competitionError) return competitionError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const mockCompetitions = getMockCompetitionsForClub(access.session.activeClub.slug);
  if (!mockCompetitions.some((item) => item.id === competition.id)) {
    return noStoreJson({ ok: false, error: "Competition not found in this club." }, { status: 404 });
  }
  const mockRosterError = validateMockRegisteredMembers(access.session.activeClub.slug, competition.registered_students);
  if (mockRosterError) return mockRosterError;

  return noStoreJson({ ok: true, source: "mock", competition });
}

export async function DELETE(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const id = requiredString(payload.id, "Competition id", 120);
  if (id.error) return validationError(id.error);
  const competitionId = id.value ?? "";

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const removed = await deleteRows("competitions", `id=eq.${encodeURIComponent(competitionId)}&club_id=eq.${clubId}`);
      if (removed.length === 0) return noStoreJson({ ok: false, error: "Competition not found in this club." }, { status: 404 });
      return noStoreJson({ ok: true, source: "supabase", removed });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  if (!getMockCompetitionsForClub(access.session.activeClub.slug).some((item) => item.id === competitionId)) {
    return noStoreJson({ ok: false, error: "Competition not found in this club." }, { status: 404 });
  }

  return noStoreJson({ ok: true, source: "mock", id: competitionId });
}

async function getAvailablePlanningId(table: "competitions", clubId: string, requestedId: string, prefix: string) {
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

function validateCompetitionPayload(payload: Record<string, unknown>): { data: Competition; error?: never } | { data?: never; error: Response } {
  const id = requiredString(payload.id, "Competition id", 120);
  const name = requiredString(payload.name, "Competition name", 160);
  const date = requiredString(payload.date, "Date", 120);
  const location = requiredString(payload.location, "Location", 160);
  const city = requiredString(payload.city, "City", 120);
  const venue = requiredString(payload.venue, "Venue", 160);
  const registeredStudents = optionalStringArray(payload.registered_students, "Registered members", 200, 120);
  const registrationDeadline = requiredString(payload.registration_deadline, "Registration deadline", 120);
  const status = requiredString(payload.status, "Status", 80);
  const notes = requiredString(payload.notes, "Notes", 1200);
  const type = requiredString(payload.type, "Type", 80);
  const prep = requiredInteger(payload.prep, "Prep", 0, 100);

  const firstError = [id, name, date, location, city, venue, registeredStudents, registrationDeadline, status, notes, type, prep].find((item) => item.error);
  if (firstError?.error) return { error: validationError(firstError.error) };

  return {
    data: {
      id: id.value ?? "",
      name: name.value ?? "",
      date: date.value ?? "",
      location: location.value ?? "",
      city: city.value ?? "",
      venue: venue.value ?? "",
      registered_students: registeredStudents.value ?? [],
      registration_deadline: registrationDeadline.value ?? "",
      status: status.value ?? "",
      notes: notes.value ?? "",
      type: type.value ?? "",
      prep: prep.value ?? 0,
    },
  };
}

type FieldResult<T> = { value: T; error?: never } | { value?: never; error: string };

function validationError(error: string) {
  return validationErrorJson(error);
}

function getCompetitionSupabaseValidationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("competitions_prep_valid")) {
    return noStoreJson({ ok: false, error: "Competition prep must be between 0 and 100." }, { status: 400 });
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

function requiredInteger(value: unknown, label: string, min: number, max: number): FieldResult<number> {
  if (typeof value !== "number" || !Number.isInteger(value)) return { error: `${label} must be a whole number.` };
  if (value < min || value > max) return { error: `${label} must be between ${min} and ${max}.` };
  return { value };
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
