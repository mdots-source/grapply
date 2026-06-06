import { apiSupabaseError, requireApiAccess, requireApiRole, requireSupabasePersistence } from "@/lib/api-access";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getBackendClubId } from "@/lib/backend";
import { getReadableMemberIds } from "@/lib/member-visibility";
import { deleteRows, insertRow, isSupabaseConfigured, selectRows, updateRows } from "@/lib/supabase/server";

const validGoalStatuses = new Set(["active", "completed", "paused", "archived"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiAccess(searchParams.get("club"));
  if (access.error) return access.error;

  const memberId = optionalString(searchParams.get("memberId"), "Member id", 120);
  if (memberId.error) return validationError(memberId.error);

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ source: "supabase", goals: [] });

      const filters = [`club_id=eq.${clubId}`];
      const readable = await getReadableMemberIds({
        clubId,
        requestedMemberId: memberId.value,
        userId: access.session.user.id,
        userEmail: access.session.user.email,
        role: access.session.activeRole,
      });
      if ("error" in readable && readable.error) return readable.error;
      if ("empty" in readable && readable.empty) return noStoreJson({ source: "supabase", goals: [] });
      if (readable.scope === "own") filters.push(`member_id=in.(${readable.memberIds.map(encodeURIComponent).join(",")})`);
      if (readable.scope === "all" && memberId.value) filters.push(`member_id=eq.${encodeURIComponent(memberId.value)}`);

      const rows = await selectRows("member_goals", `select=*&${filters.join("&")}&order=created_at.desc`);
      return noStoreJson({ source: "supabase", goals: rows });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  return noStoreJson({ source: "mock", goals: [] });
}

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin", "coach"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateGoalPayload(payload);
  if (validation.error) return validation.error;
  const goal = validation.data;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const [member] = await selectRows("academy_members", `select=id&club_id=eq.${clubId}&id=eq.${encodeURIComponent(goal.memberId)}&limit=1`);
      if (!member) return noStoreJson({ ok: false, error: "Member not found in this club." }, { status: 404 });

      const row = await insertRow("member_goals", {
        club_id: clubId,
        member_id: goal.memberId,
        title: goal.title,
        status: goal.status,
        target_date: goal.targetDate ?? null,
        completed_at: goal.status === "completed" ? new Date().toISOString() : null,
      });

      return noStoreJson({ ok: true, source: "supabase", goal: row });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Training goals");
  if (persistenceError) return persistenceError;

  return noStoreJson({ ok: true, source: "mock", goal });
}

export async function PATCH(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin", "coach"], requestedClubSlug);
  if (access.error) return access.error;

  const id = requiredString(payload.id, "Goal id", 120);
  if (id.error) return validationError(id.error);
  const validation = validateGoalPayload(payload);
  if (validation.error) return validation.error;
  const goal = validation.data;
  const goalId = id.value ?? "";

  if (isSupabaseConfigured()) {
    if (!isUuid(goalId)) return noStoreJson({ ok: false, error: "Goal id must be a valid id." }, { status: 400 });

    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const [member] = await selectRows("academy_members", `select=id&club_id=eq.${clubId}&id=eq.${encodeURIComponent(goal.memberId)}&limit=1`);
      if (!member) return noStoreJson({ ok: false, error: "Member not found in this club." }, { status: 404 });
      const [existingGoal] = await selectRows("member_goals", `select=id,member_id,completed_at&club_id=eq.${clubId}&id=eq.${encodeURIComponent(goalId)}&limit=1`);
      if (!existingGoal) return noStoreJson({ ok: false, error: "Goal not found in this club." }, { status: 404 });
      if (access.session.activeRole === "coach" && existingGoal.member_id !== goal.memberId) {
        return noStoreJson({ ok: false, error: "Coaches cannot move goals between members. Ask an owner or admin to reassign this goal." }, { status: 403 });
      }

      const [row] = await updateRows(
        "member_goals",
        {
          member_id: goal.memberId,
          title: goal.title,
          status: goal.status,
          target_date: goal.targetDate ?? null,
          completed_at: goal.status === "completed" ? existingGoal.completed_at ?? new Date().toISOString() : null,
        },
        `id=eq.${encodeURIComponent(goalId)}&club_id=eq.${clubId}`,
      );

      return noStoreJson({ ok: true, source: "supabase", goal: row });
    } catch (error) {
      const goalError = getGoalSupabaseValidationError(error);
      if (goalError) return goalError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Training goals");
  if (persistenceError) return persistenceError;

  return noStoreJson({ ok: true, source: "mock", goal: { id: goalId, ...goal } });
}

export async function DELETE(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const id = requiredString(payload.id, "Goal id", 120);
  if (id.error) return validationError(id.error);
  const goalId = id.value ?? "";

  if (isSupabaseConfigured()) {
    if (!isUuid(goalId)) return noStoreJson({ ok: false, error: "Goal id must be a valid id." }, { status: 400 });

    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const removed = await deleteRows("member_goals", `id=eq.${encodeURIComponent(goalId)}&club_id=eq.${clubId}`);
      if (removed.length === 0) return noStoreJson({ ok: false, error: "Goal not found in this club." }, { status: 404 });
      return noStoreJson({ ok: true, source: "supabase", removed });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Training goals");
  if (persistenceError) return persistenceError;

  return noStoreJson({ ok: true, source: "mock", id: goalId });
}

type GoalPayload = {
  memberId: string;
  title: string;
  status: string;
  targetDate?: string;
};

function validateGoalPayload(payload: Record<string, unknown>): { data: GoalPayload; error?: never } | { data?: never; error: Response } {
  const memberId = requiredString(payload.memberId, "Member id", 120);
  const title = requiredString(payload.title, "Goal title", 180);
  const status = optionalGoalStatus(payload.status);
  const targetDate = optionalDate(payload.targetDate, "Target date");

  const firstError = [memberId, title, status, targetDate].find((item) => item.error);
  if (firstError?.error) return { error: validationError(firstError.error) };

  return {
    data: {
      memberId: memberId.value ?? "",
      title: title.value ?? "",
      status: status.value ?? "active",
      ...(targetDate.value ? { targetDate: targetDate.value } : {}),
    },
  };
}

type FieldResult<T> = { value: T; error?: never } | { value?: never; error: string };

function validationError(error: string) {
  return validationErrorJson(error);
}

function getGoalSupabaseValidationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("coaches cannot move goals between members")) {
    return noStoreJson(
      { ok: false, error: "Coaches cannot move goals between members. Ask an owner or admin to reassign this goal." },
      { status: 403 },
    );
  }
  return null;
}

function requiredString(value: unknown, label: string, maxLength: number): FieldResult<string> {
  if (typeof value !== "string" || !value.trim()) return { error: `${label} is required.` };
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return { error: `${label} is too long.` };
  return { value: trimmed };
}

function optionalString(value: unknown, label: string, maxLength: number): FieldResult<string | undefined> {
  if (value === undefined || value === null || value === "") return { value: undefined as string | undefined };
  return requiredString(value, label, maxLength);
}

function optionalDate(value: unknown, label: string): FieldResult<string | undefined> {
  const text = optionalString(value, label, 10);
  if (text.error || !text.value) return text;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text.value)) return { error: `${label} must use YYYY-MM-DD.` };
  const date = new Date(`${text.value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text.value) {
    return { error: `${label} must be a real date.` };
  }
  return { value: text.value };
}

function optionalGoalStatus(value: unknown): FieldResult<string | undefined> {
  if (value === undefined || value === null || value === "") return { value: undefined as string | undefined };
  if (typeof value !== "string" || !validGoalStatuses.has(value)) return { error: "Goal status is not supported." };
  return { value };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
