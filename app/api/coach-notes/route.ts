import { getClubRoster } from "@/data/platform";
import { apiSupabaseError, requireApiAccess, requireApiRole, requireSupabasePersistence } from "@/lib/api-access";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getBackendClubId, getMockClubId } from "@/lib/backend";
import { deleteRows, insertRow, isSupabaseConfigured, selectRows, updateRows } from "@/lib/supabase/server";

const validVisibility = new Set(["staff", "private"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiRole(["owner", "admin", "coach"], searchParams.get("club"));
  if (access.error) return access.error;
  const memberId = searchParams.get("memberId");

  if (memberId !== null && !isNonEmptyText(memberId)) {
    return validationError("Member id cannot be empty.");
  }

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ source: "supabase", notes: [] });

      const filters = [`club_id=eq.${clubId}`];
      if (memberId) filters.push(`member_id=eq.${encodeURIComponent(memberId)}`);

      const rows = await selectRows("coach_notes", `select=*&${filters.join("&")}&order=created_at.desc`);
      return noStoreJson({ source: "supabase", notes: filterReadableCoachNotes(rows, access.session.activeRole, access.session.user.id) });
    } catch (error) {
      const noteError = getCoachNoteSupabaseValidationError(error);
      if (noteError) return noteError;
      return apiSupabaseError(error, { clubId });
    }
  }

  return noStoreJson({ source: "mock", notes: [] });
}

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin", "coach"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateCoachNotePayload(payload, "create");
  if (validation.error) return validation.error;
  const data = validation.data;
  const memberId = data.memberId ?? "";
  const coachName = access.session.user.name;
  const body = data.body ?? "";

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const [member] = await selectRows("academy_members", `select=id&club_id=eq.${clubId}&id=eq.${encodeURIComponent(memberId)}&limit=1`);
      if (!member) return noStoreJson({ ok: false, error: "Member not found in this club." }, { status: 404 });

      const row = await insertRow("coach_notes", {
        club_id: clubId,
        member_id: memberId,
        coach_user_id: isUuid(access.session.user.id) ? access.session.user.id : null,
        coach_name: coachName,
        body,
        visibility: data.visibility ?? "staff",
      });

      return noStoreJson({ ok: true, source: "supabase", note: row });
    } catch (error) {
      const noteError = getCoachNoteSupabaseValidationError(error);
      if (noteError) return noteError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Coach notes");
  if (persistenceError) return persistenceError;

  const mockClubId = getMockClubId(access.session.activeClub.slug);
  const mockMember = getClubRoster(mockClubId).find((member) => member.id === memberId);
  if (!mockMember) return noStoreJson({ ok: false, error: "Member not found in this club." }, { status: 404 });

  return noStoreJson({
    ok: true,
    source: "mock",
    note: {
      id: `mock-note-${Date.now()}`,
      club_id: mockClubId,
      member_id: memberId,
      coach_user_id: isUuid(access.session.user.id) ? access.session.user.id : null,
      coach_name: coachName,
      body,
      visibility: data.visibility ?? "staff",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  });
}

export async function PATCH(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin", "coach"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateCoachNotePayload(payload, "update");
  if (validation.error) return validation.error;
  const data = validation.data;

  if (isSupabaseConfigured()) {
    if (!isUuid(data.id)) return noStoreJson({ ok: false, error: "Note id must be a valid id." }, { status: 400 });

    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const [existing] = await selectRows("coach_notes", `select=*&id=eq.${encodeURIComponent(data.id)}&club_id=eq.${clubId}&limit=1`);
      if (!existing) return noStoreJson({ ok: false, error: "Note not found in this club." }, { status: 404 });
      if (access.session.activeRole === "coach" && existing.coach_user_id !== access.session.user.id) {
        return noStoreJson({ ok: false, error: "Coaches can only edit their own notes." }, { status: 403 });
      }
      const [updated] = await updateRows(
        "coach_notes",
        {
          ...(data.body ? { body: data.body } : {}),
          ...(data.visibility ? { visibility: data.visibility } : {}),
        },
        `id=eq.${encodeURIComponent(data.id)}&club_id=eq.${clubId}`,
      );
      return noStoreJson({ ok: true, source: "supabase", note: updated });
    } catch (error) {
      const noteError = getCoachNoteSupabaseValidationError(error);
      if (noteError) return noteError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Coach notes");
  if (persistenceError) return persistenceError;

  return noStoreJson({ ok: false, source: "mock", error: "Coach notes are not persisted in mock mode." }, { status: 404 });
}

export async function DELETE(request: Request) {
  const payload = await readJsonObject(request);
  const forbidden = getForbiddenCoachNoteField(payload, "delete");
  if (forbidden) return validationError(`${forbidden} is assigned by the server.`);

  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin", "coach"], requestedClubSlug);
  if (access.error) return access.error;

  const id = requiredString(payload.id, "Note id");
  if (id.error) return validationError(id.error);
  const noteId = id.value ?? "";

  if (isSupabaseConfigured()) {
    if (!isUuid(noteId)) return noStoreJson({ ok: false, error: "Note id must be a valid id." }, { status: 400 });

    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const [existing] = await selectRows("coach_notes", `select=*&id=eq.${encodeURIComponent(noteId)}&club_id=eq.${clubId}&limit=1`);
      if (!existing) return noStoreJson({ ok: false, error: "Note not found in this club." }, { status: 404 });
      if (access.session.activeRole === "coach" && existing.coach_user_id !== access.session.user.id) {
        return noStoreJson({ ok: false, error: "Coaches can only delete their own notes." }, { status: 403 });
      }
      const removed = await deleteRows("coach_notes", `id=eq.${encodeURIComponent(noteId)}&club_id=eq.${clubId}`);
      return noStoreJson({ ok: true, source: "supabase", removed });
    } catch (error) {
      const noteError = getCoachNoteSupabaseValidationError(error);
      if (noteError) return noteError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Coach notes");
  if (persistenceError) return persistenceError;

  return noStoreJson({ ok: false, source: "mock", error: "Coach notes are not persisted in mock mode." }, { status: 404 });
}

type CoachNotePayload = {
  id: string;
  clubSlug?: string;
  memberId?: string;
  body?: string;
  visibility?: string;
};

function validateCoachNotePayload(payload: Record<string, unknown>, mode: "create" | "update"): { data: CoachNotePayload; error?: never } | { data?: never; error: Response } {
  const forbidden = getForbiddenCoachNoteField(payload, mode);
  if (forbidden) return { error: validationError(`${forbidden} is assigned by the server.`) };

  const id = optionalString(payload.id, "Note id");
  const clubSlug = optionalString(payload.clubSlug, "Club slug");
  const memberId = optionalString(payload.memberId, "Member id");
  const body = optionalString(payload.body, "Coach note", 2000);
  const visibility = optionalVisibility(payload.visibility);

  const firstError = [id, clubSlug, memberId, body, visibility].find((item) => item.error);
  if (firstError?.error) return { error: validationError(firstError.error) };

  if (mode === "create" && (!memberId.value || !body.value)) {
    return { error: validationError("Member id and note body are required.") };
  }

  if (mode === "update" && !id.value) {
    return { error: validationError("Note id is required.") };
  }

  if (mode === "update" && !body.value && !visibility.value) {
    return { error: validationError("Nothing to update.") };
  }

  return {
    data: {
      id: id.value ?? "",
      ...(clubSlug.value ? { clubSlug: clubSlug.value } : {}),
      ...(memberId.value ? { memberId: memberId.value } : {}),
      ...(body.value ? { body: body.value } : {}),
      ...(visibility.value ? { visibility: visibility.value } : {}),
    },
  };
}

type FieldResult<T> = { value: T; error?: never } | { value?: never; error: string };

function validationError(error: string) {
  return validationErrorJson(error);
}

function getForbiddenCoachNoteField(payload: Record<string, unknown>, mode: "create" | "update" | "delete") {
  const labels: Record<string, string> = {
    clubId: "Coach note club",
    club_id: "Coach note club",
    coachName: "Coach note author",
    coach_name: "Coach note author",
    coachUserId: "Coach note author",
    coach_user_id: "Coach note author",
    createdAt: "Coach note creation time",
    created_at: "Coach note creation time",
    updatedAt: "Coach note update time",
    updated_at: "Coach note update time",
  };
  const modeLabels: Record<string, string> =
    mode === "create"
      ? {}
      : mode === "update"
        ? { memberId: "Coach note member", member_id: "Coach note member" }
        : {
            body: "Coach note body",
            memberId: "Coach note member",
            member_id: "Coach note member",
            visibility: "Coach note visibility",
          };
  const allLabels = { ...labels, ...modeLabels };
  const field = Object.keys(allLabels).find((key) => payload[key] !== undefined);
  return field ? allLabels[field] : null;
}

function getCoachNoteSupabaseValidationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("coach note identity fields cannot be changed")) {
    return noStoreJson({ ok: false, error: "Coach notes cannot be moved to another member or author." }, { status: 400 });
  }
  return null;
}

function filterReadableCoachNotes<T extends { visibility: string; coach_user_id: string | null }>(
  rows: T[],
  role: "owner" | "admin" | "coach" | "member",
  userId: string,
) {
  if (role === "owner" || role === "admin") return rows;
  if (role !== "coach") return [];
  return rows.filter((row) => row.visibility !== "private" || row.coach_user_id === userId);
}

function isNonEmptyText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function requiredString(value: unknown, label: string, maxLength = 160): FieldResult<string> {
  if (typeof value !== "string" || !value.trim()) return { error: `${label} is required.` };
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return { error: `${label} is too long.` };
  return { value: trimmed };
}

function optionalString(value: unknown, label: string, maxLength = 160): FieldResult<string | undefined> {
  if (value === undefined || value === null) return { value: undefined as string | undefined };
  return requiredString(value, label, maxLength);
}

function optionalVisibility(value: unknown): FieldResult<string | undefined> {
  if (value === undefined || value === null) return { value: undefined as string | undefined };
  if (typeof value !== "string" || !validVisibility.has(value)) return { error: "Note visibility is not supported." };
  return { value };
}

function isUuid(value: unknown) {
  return typeof value === "string" && uuidPattern.test(value);
}
