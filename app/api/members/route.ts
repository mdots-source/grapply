import type { NextResponse } from "next/server";
import { compareMemberHierarchy, type Student } from "@/data/academy";
import { getClubRoster, platformUsers } from "@/data/platform";
import { apiSupabaseError, requireApiAccess, requireApiRole, requireSupabasePersistence } from "@/lib/api-access";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getBackendClubId, getMockClubId } from "@/lib/backend";
import { getReadableMemberIds } from "@/lib/member-visibility";
import { deleteRows, insertRow, isSupabaseConfigured, selectRows, updateRows } from "@/lib/supabase/server";
import { toAcademyMemberInsert, toStudent } from "@/lib/supabase/mappers";

const validBelts = new Set(["white", "blue", "purple", "brown", "black"]);
const validRoles = new Set(["member", "coach"]);
const validStatuses = new Set(["active", "inactive"]);
const memberIdPattern = /^[a-z0-9][a-z0-9_-]{1,63}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiAccess(searchParams.get("club"));
  if (access.error) return access.error;
  const clubSlug = access.session.activeClub.slug;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(clubSlug);
      if (!clubId) return noStoreJson({ source: "supabase", members: [] });

      const readable = await getReadableMemberIds({
        clubId,
        userId: access.session.user.id,
        userEmail: access.session.user.email,
        role: access.session.activeRole,
      });
      if ("error" in readable && readable.error) return readable.error;
      if ("empty" in readable && readable.empty) return noStoreJson({ source: "supabase", members: [] });

      const filters = [`club_id=eq.${clubId}`];
      if (readable.scope === "own") filters.push(`id=in.(${readable.memberIds.map(encodeURIComponent).join(",")})`);

      const rows = await selectRows(
        "academy_members",
        `select=*&${filters.join("&")}&order=role.asc,belt.desc,stripes.desc,name.asc`,
      );

      return noStoreJson({
        source: "supabase",
        members: rows.map(toStudent).sort(compareMemberHierarchy),
      });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  return noStoreJson({
    source: "mock",
    members: filterMockMembersForViewer(getMockMembers(clubSlug), {
      userId: access.session.user.id,
      userEmail: access.session.user.email,
      role: access.session.activeRole,
    }),
  });
}

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateMemberPayload(payload, "create");
  if (validation.error) return validation.error;
  const data = validation.data;

  const member: Student = {
    id: data.id ?? `st-${Date.now()}`,
    name: data.name ?? "",
    belt: data.belt ?? "white",
    stripes: data.stripes ?? 0,
    role: data.role ?? "member",
    status: data.status ?? "active",
    totalHours: data.totalHours ?? 0,
    classes30: data.classes30 ?? 0,
    streak: data.streak ?? 0,
    points: data.points ?? 0,
    wins: data.wins ?? 0,
    losses: data.losses ?? 0,
    lastSeen: data.lastSeen ?? "New member",
    focus: data.focus ?? "Onboarding",
    avatar: data.avatar ?? undefined,
  };

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

      const [existingByName] = await selectRows(
        "academy_members",
        `select=id&club_id=eq.${clubId}&name=eq.${encodeURIComponent(member.name)}&limit=1`,
      );
      if (existingByName) {
        return noStoreJson({ ok: false, error: "A member with this name already exists in this club." }, { status: 409 });
      }

      const [existingById] = await selectRows(
        "academy_members",
        `select=id,club_id&id=eq.${encodeURIComponent(member.id)}&limit=1`,
      );
      if (existingById) {
        return noStoreJson({ ok: false, error: "A member with this id already exists." }, { status: 409 });
      }

      const created = await insertRow("academy_members", toAcademyMemberInsert(member, clubId));
      return noStoreJson({ ok: true, source: "supabase", member: toStudent(created) });
    } catch (error) {
      const memberError = getMemberSupabaseValidationError(error);
      if (memberError) return memberError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Members CRUD");
  if (persistenceError) return persistenceError;

  const mockMembers = getMockMembers(access.session.activeClub.slug);
  if (mockMembers.some((item) => item.name.toLowerCase() === member.name.toLowerCase())) {
    return noStoreJson({ ok: false, error: "A member with this name already exists in this club." }, { status: 409 });
  }
  if (getClubRoster().some((item) => item.id === member.id)) {
    return noStoreJson({ ok: false, error: "A member with this id already exists." }, { status: 409 });
  }

  return noStoreJson({ ok: true, source: "mock", member });
}

export async function PATCH(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateMemberPayload(payload, "update");
  if (validation.error) return validation.error;
  const data = validation.data;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

      const [existingMember] = await selectRows(
        "academy_members",
        `select=id,user_id&club_id=eq.${clubId}&id=eq.${encodeURIComponent(data.id)}&limit=1`,
      );
      if (!existingMember) return noStoreJson({ ok: false, error: "Member not found in this club." }, { status: 404 });

      if (existingMember.user_id && (data.role || data.status)) {
        return noStoreJson(
          {
            ok: false,
            error: "This roster profile is linked to a user account. Change club access from Team, or remove access before changing member role/status.",
          },
          { status: 409 },
        );
      }

      if (data.name) {
        const [duplicateName] = await selectRows(
          "academy_members",
          `select=id&club_id=eq.${clubId}&name=eq.${encodeURIComponent(data.name)}&id=neq.${encodeURIComponent(data.id)}&limit=1`,
        );
        if (duplicateName) {
          return noStoreJson({ ok: false, error: "Another member with this name already exists in this club." }, { status: 409 });
        }
      }

      const [updated] = await updateRows(
        "academy_members",
        {
          ...(data.name ? { name: data.name } : {}),
          ...(data.belt ? { belt: data.belt } : {}),
          ...(typeof data.stripes === "number" ? { stripes: data.stripes } : {}),
          ...(data.role ? { role: data.role } : {}),
          ...(data.status ? { status: data.status } : {}),
          ...(typeof data.totalHours === "number" ? { total_hours: data.totalHours } : {}),
          ...(typeof data.classes30 === "number" ? { classes_30: data.classes30 } : {}),
          ...(typeof data.streak === "number" ? { streak: data.streak } : {}),
          ...(typeof data.points === "number" ? { points: data.points } : {}),
          ...(typeof data.wins === "number" ? { wins: data.wins } : {}),
          ...(typeof data.losses === "number" ? { losses: data.losses } : {}),
          ...(data.lastSeen ? { last_seen: data.lastSeen } : {}),
          ...(data.focus ? { focus: data.focus } : {}),
          ...(data.avatar !== undefined ? { avatar_url: data.avatar ?? null } : {}),
        },
        `id=eq.${encodeURIComponent(data.id)}&club_id=eq.${clubId}`,
      );

      return noStoreJson({ ok: true, source: "supabase", member: toStudent(updated) });
    } catch (error) {
      const memberError = getMemberSupabaseValidationError(error);
      if (memberError) return memberError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Members CRUD");
  if (persistenceError) return persistenceError;

  const mockMembers = getMockMembers(access.session.activeClub.slug);
  const existing = mockMembers.find((item) => item.id === data.id);
  if (!existing) return noStoreJson({ ok: false, error: "Member not found in this club." }, { status: 404 });
  if (data.name && mockMembers.some((item) => item.id !== data.id && item.name.toLowerCase() === data.name?.toLowerCase())) {
    return noStoreJson({ ok: false, error: "Another member with this name already exists in this club." }, { status: 409 });
  }

  return noStoreJson({ ok: true, source: "mock", member: { ...existing, ...data } });
}

export async function DELETE(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const memberId = optionalMemberId(payload.id);
  if (memberId.error || !memberId.value) return validationError(memberId.error ?? "Missing member id.");

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const [member] = await selectRows("academy_members", `select=id,name,user_id&club_id=eq.${clubId}&id=eq.${encodeURIComponent(memberId.value)}&limit=1`);
      if (!member) return noStoreJson({ ok: false, error: "Member not found in this club." }, { status: 404 });

      if (member.user_id) {
        return noStoreJson(
          {
            ok: false,
            error: "This member is linked to a user account. Remove their club access from Team first, or mark the roster profile inactive instead.",
          },
          { status: 409 },
        );
      }

      const removed = await deleteRows("academy_members", `id=eq.${encodeURIComponent(memberId.value)}&club_id=eq.${clubId}`);
      if (removed.length === 0) return noStoreJson({ ok: false, error: "Member not found in this club." }, { status: 404 });
      return noStoreJson({ ok: true, source: "supabase", removed });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Members CRUD");
  if (persistenceError) return persistenceError;

  const mockMember = getMockMembers(access.session.activeClub.slug).find((item) => item.id === memberId.value);
  if (!mockMember) return noStoreJson({ ok: false, error: "Member not found in this club." }, { status: 404 });

  return noStoreJson({ ok: true, source: "mock", id: memberId.value });
}

function getMockMembers(clubSlug: string) {
  return getClubRoster(getMockClubId(clubSlug)).sort(compareMemberHierarchy);
}

function filterMockMembersForViewer(
  members: Student[],
  viewer: { userId?: string | null; userEmail?: string | null; role: string },
) {
  if (viewer.role === "owner" || viewer.role === "admin" || viewer.role === "coach") return members;
  const user = platformUsers.find((candidate) =>
    candidate.id === viewer.userId || candidate.email.toLowerCase() === viewer.userEmail?.toLowerCase(),
  );
  if (!user) return [];
  return members.filter((member) => member.name.toLowerCase() === user.name.toLowerCase());
}

type MemberValidationMode = "create" | "update";
type ValidatedMemberPayload = Partial<Student> & { id: string; clubSlug?: string | null };
type FieldResult<T> = { value: T; error?: never } | { value?: never; error: string };

function validateMemberPayload(payload: Record<string, unknown>, mode: MemberValidationMode): { data: ValidatedMemberPayload; error?: never } | { data?: never; error: NextResponse } {
  const id = optionalMemberId(payload.id);
  const name = optionalString(payload.name, "Member name");
  const belt = optionalEnum(payload.belt, validBelts, "Belt");
  const role = optionalEnum(payload.role, validRoles, "Role");
  const status = optionalEnum(payload.status, validStatuses, "Status");
  const stripes = optionalInteger(payload.stripes, "Stripes", 0, 4);
  const totalHours = optionalInteger(payload.totalHours, "Total hours", 0);
  const classes30 = optionalInteger(payload.classes30, "Classes in last 30 days", 0);
  const streak = optionalInteger(payload.streak, "Streak", 0);
  const points = optionalInteger(payload.points, "Points", 0);
  const wins = optionalInteger(payload.wins, "Wins", 0);
  const losses = optionalInteger(payload.losses, "Losses", 0);
  const lastSeen = optionalString(payload.lastSeen, "Last seen");
  const focus = optionalString(payload.focus, "Focus");
  const avatar = optionalNullableString(payload.avatar, "Avatar");
  const clubSlug = optionalString(payload.clubSlug, "Club slug");

  const firstError = [id, name, belt, role, status, stripes, totalHours, classes30, streak, points, wins, losses, lastSeen, focus, avatar, clubSlug]
    .find((item) => item.error);
  if (firstError?.error) return { error: validationError(firstError.error) };

  if (mode === "create" && (!name.value || !belt.value)) {
    return { error: validationError("Member name and belt are required.") };
  }

  if (mode === "update" && !id.value) {
    return { error: validationError("Member id is required.") };
  }

  return {
    data: {
      id: id.value ?? `st-${Date.now()}`,
      ...(clubSlug.value ? { clubSlug: clubSlug.value } : {}),
      ...(name.value ? { name: name.value } : {}),
      ...(belt.value ? { belt: belt.value as Student["belt"] } : {}),
      ...(typeof stripes.value === "number" ? { stripes: stripes.value } : {}),
      ...(role.value ? { role: role.value as Student["role"] } : {}),
      ...(status.value ? { status: status.value as Student["status"] } : {}),
      ...(typeof totalHours.value === "number" ? { totalHours: totalHours.value } : {}),
      ...(typeof classes30.value === "number" ? { classes30: classes30.value } : {}),
      ...(typeof streak.value === "number" ? { streak: streak.value } : {}),
      ...(typeof points.value === "number" ? { points: points.value } : {}),
      ...(typeof wins.value === "number" ? { wins: wins.value } : {}),
      ...(typeof losses.value === "number" ? { losses: losses.value } : {}),
      ...(lastSeen.value ? { lastSeen: lastSeen.value } : {}),
      ...(focus.value ? { focus: focus.value } : {}),
      ...(avatar.value !== undefined ? { avatar: avatar.value ?? undefined } : {}),
    },
  };
}

function validationError(error: string) {
  return validationErrorJson(error);
}

function getMemberSupabaseValidationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("academy_members_club_lower_name_key")) {
    return noStoreJson({ ok: false, error: "A member with this name already exists in this club." }, { status: 409 });
  }
  if (message.includes("academy_members_stripes_valid")) {
    return noStoreJson({ ok: false, error: "Stripes must be between 0 and 4." }, { status: 400 });
  }
  if (message.includes("academy_members_metrics_nonnegative")) {
    return noStoreJson({ ok: false, error: "Member stats cannot be negative." }, { status: 400 });
  }
  if (message.includes("linked roster role and status are managed by club memberships")) {
    return noStoreJson(
      {
        ok: false,
        error: "This roster profile is linked to a user account. Change club access from Team, or remove access before changing member role/status.",
      },
      { status: 409 },
    );
  }

  return null;
}

function optionalString(value: unknown, label: string): FieldResult<string | undefined> {
  if (value === undefined || value === null) return { value: undefined as string | undefined };
  if (typeof value !== "string") return { error: `${label} must be text.` };
  const trimmed = value.trim();
  if (!trimmed) return { error: `${label} cannot be empty.` };
  if (trimmed.length > 160) return { error: `${label} is too long.` };
  return { value: trimmed };
}

function optionalMemberId(value: unknown): FieldResult<string | undefined> {
  if (value === undefined || value === null) return { value: undefined as string | undefined };
  const id = optionalString(value, "Member id");
  if (id.error) return id;
  if (!id.value || !memberIdPattern.test(id.value)) {
    return { error: "Member id must be 2 to 64 letters, numbers, dashes, or underscores." };
  }
  return id;
}

function optionalNullableString(value: unknown, label: string): FieldResult<string | null | undefined> {
  if (value === undefined) return { value: undefined as string | null | undefined };
  if (value === null) return { value: null };
  return optionalString(value, label);
}

function optionalEnum(value: unknown, allowed: Set<string>, label: string): FieldResult<string | undefined> {
  if (value === undefined || value === null) return { value: undefined as string | undefined };
  if (typeof value !== "string" || !allowed.has(value)) return { error: `${label} is not supported.` };
  return { value };
}

function optionalInteger(value: unknown, label: string, min: number, max = Number.MAX_SAFE_INTEGER): FieldResult<number | undefined> {
  if (value === undefined || value === null) return { value: undefined as number | undefined };
  if (typeof value !== "number" || !Number.isInteger(value)) return { error: `${label} must be a whole number.` };
  if (value < min || value > max) return { error: `${label} must be between ${min} and ${max}.` };
  return { value };
}
