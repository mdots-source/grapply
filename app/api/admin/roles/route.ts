import { clubMemberships, clubs, roleDefinitions } from "@/data/platform";
import { apiSupabaseError, requireApiRole } from "@/lib/api-access";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getBackendClubId } from "@/lib/backend";
import { queueEmail, staffNotificationEmailBody } from "@/lib/email/outbox";
import { getRequestUrl } from "@/lib/request-origin";
import { deleteRows, isSupabaseConfigured, selectRows, updateRows } from "@/lib/supabase/server";

const validAssignableRoles = new Set(["admin", "coach", "member"]);

function isUuid(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiRole(["owner", "admin"], searchParams.get("club"));
  if (access.error) return access.error;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ source: "supabase", roles: [], memberships: [], classes: [] });

      const membershipRoleFilter = access.session.activeRole === "admin" ? "&role=in.(coach,member)" : "";
      const [roles, memberships, classes] = await Promise.all([
        selectRows("role_definitions"),
        selectRows("club_memberships", `select=*&club_id=eq.${clubId}${membershipRoleFilter}`),
        selectRows("club_classes", `select=*&club_id=eq.${clubId}`),
      ]);

      return noStoreJson({
        source: "supabase",
        roles: access.session.activeRole === "admin" ? roles.filter((role) => role.role === "coach" || role.role === "member") : roles,
        memberships,
        classes,
      });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  return noStoreJson({
    source: "mock",
    roles: roleDefinitions,
    memberships: clubMemberships.filter((membership) => membership.clubId === getMockClubId(access.session.activeClub.slug)),
  });
}

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  return noStoreJson({
    ok: false,
    error: "Direct club access assignment is disabled. Invite the user from Admin, then update their role after they join.",
  }, { status: 405 });
}

export async function PATCH(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateRolePayload(payload, "update");
  if (validation.error) return validation.error;
  const data = validation.data;

  if (!validAssignableRoles.has(data.role ?? "")) {
    return noStoreJson({ ok: false, error: "Role must be admin, coach, or member." }, { status: 400 });
  }

  if (access.session.activeRole === "admin" && data.role === "admin") {
    return noStoreJson({ ok: false, error: "Only owners can assign admin access." }, { status: 403 });
  }

  if (!isUuid(data.membershipId)) {
    if (isSupabaseConfigured()) {
      return noStoreJson({ ok: false, error: "Membership id must be a valid id." }, { status: 400 });
    }

    const mockClubId = getMockClubId(access.session.activeClub.slug);
    const mockMembership = clubMemberships.find((membership) => membership.id === data.membershipId && membership.clubId === mockClubId);
    if (!mockMembership) return noStoreJson({ ok: false, error: "Membership not found in this club." }, { status: 404 });
    const permissionError = getRoleManagementError({
      actorRole: access.session.activeRole,
      actorUserId: access.session.user.id,
      targetRole: mockMembership.role,
      targetUserId: mockMembership.userId,
      nextRole: data.role ?? "member",
      action: "update",
    });
    if (permissionError) return permissionError;
    return noStoreJson({ ok: true, source: "mock", membership: data });
  }

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

      const [existing] = await selectRows(
        "club_memberships",
        `select=*&id=eq.${encodeURIComponent(data.membershipId)}&club_id=eq.${clubId}&limit=1`,
      );

      if (!existing) return noStoreJson({ ok: false, error: "Membership not found in this club." }, { status: 404 });
      const permissionError = getRoleManagementError({
        actorRole: access.session.activeRole,
        actorUserId: access.session.user.id,
        targetRole: existing.role,
        targetUserId: existing.user_id,
        nextRole: data.role ?? "member",
        action: "update",
      });
      if (permissionError) return permissionError;

      const [membership] = await updateRows(
        "club_memberships",
        { role: data.role ?? "member" },
        `id=eq.${encodeURIComponent(data.membershipId)}&club_id=eq.${clubId}`,
      );
      await updateRows(
        "academy_members",
        { role: getRosterRole(data.role ?? "member"), status: "active" },
        `club_id=eq.${clubId}&user_id=eq.${encodeURIComponent(existing.user_id)}`,
      );
      await queueRoleChangeEmail(request, {
        clubId,
        clubName: access.session.activeClub.name,
        userId: existing.user_id,
        nextRole: data.role ?? "member",
        destination: `/${access.session.activeClub.slug}/dashboard`,
      });

      return noStoreJson({ ok: true, source: "supabase", membership });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  return noStoreJson({ ok: true, source: "mock", membership: data });
}

export async function DELETE(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const membershipId = requiredString(payload.membershipId, "Membership id");
  if (membershipId.error) return validationError(membershipId.error);
  const membershipIdValue = membershipId.value ?? "";

  if (!isUuid(membershipIdValue)) {
    if (isSupabaseConfigured()) {
      return noStoreJson({ ok: false, error: "Membership id must be a valid id." }, { status: 400 });
    }

    const mockClubId = getMockClubId(access.session.activeClub.slug);
    const mockMembership = clubMemberships.find((membership) => membership.id === membershipIdValue && membership.clubId === mockClubId);
    if (!mockMembership) return noStoreJson({ ok: false, error: "Membership not found in this club." }, { status: 404 });
    if (mockMembership?.role === "owner") {
      return noStoreJson({ ok: false, error: "Owner access cannot be removed from this screen." }, { status: 400 });
    }
    const mockPermissionError = getRoleManagementError({
      actorRole: access.session.activeRole,
      actorUserId: access.session.user.id,
      targetRole: mockMembership.role,
      targetUserId: mockMembership.userId,
      action: "remove",
    });
    if (mockPermissionError) return mockPermissionError;
    return noStoreJson({ ok: true, source: "mock", membershipId: membershipIdValue });
  }

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

      const [membership] = await selectRows(
        "club_memberships",
        `select=*&id=eq.${encodeURIComponent(membershipIdValue)}&club_id=eq.${clubId}&limit=1`,
      );

      if (!membership) {
        return noStoreJson({ ok: false, error: "Membership not found in this club." }, { status: 404 });
      }

      if (membership.role === "owner") {
        return noStoreJson({ ok: false, error: "Owner access cannot be removed from this screen." }, { status: 400 });
      }
      const permissionError = getRoleManagementError({
        actorRole: access.session.activeRole,
        actorUserId: access.session.user.id,
        targetRole: membership.role,
        targetUserId: membership.user_id,
        action: "remove",
      });
      if (permissionError) return permissionError;

      await updateRows(
        "academy_members",
        { user_id: null, status: "inactive" },
        `club_id=eq.${clubId}&user_id=eq.${encodeURIComponent(membership.user_id)}`,
      );
      const removed = await deleteRows("club_memberships", `id=eq.${encodeURIComponent(membershipIdValue)}&club_id=eq.${clubId}`);
      await queueAccessRemovedEmail({
        clubId,
        clubName: access.session.activeClub.name,
        userId: membership.user_id,
      });
      return noStoreJson({ ok: true, source: "supabase", removed });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  return noStoreJson({ ok: true, source: "mock", membershipId: membershipIdValue });
}

function getRoleManagementError(input: {
  actorRole: "owner" | "admin" | "coach" | "member";
  actorUserId: string;
  targetRole: "owner" | "admin" | "coach" | "member" | null;
  targetUserId: string;
  nextRole?: "admin" | "coach" | "member";
  action: "assign" | "update" | "remove";
}) {
  if (input.targetRole === "owner") {
    return noStoreJson({ ok: false, error: "Owner access cannot be changed from this screen." }, { status: 400 });
  }

  if (input.targetUserId && input.targetUserId === input.actorUserId) {
    return noStoreJson({ ok: false, error: "You cannot change your own access." }, { status: 403 });
  }

  if (input.actorRole !== "owner" && input.targetRole === "admin") {
    return noStoreJson({ ok: false, error: "Only owners can manage admin access." }, { status: 403 });
  }

  if (input.actorRole !== "owner" && input.nextRole === "admin") {
    return noStoreJson({ ok: false, error: "Only owners can assign admin access." }, { status: 403 });
  }

  if (input.action === "remove" && input.actorRole !== "owner" && input.targetRole !== "coach" && input.targetRole !== "member") {
    return noStoreJson({ ok: false, error: "Only owners can remove this access." }, { status: 403 });
  }

  return null;
}

function getRosterRole(role: "admin" | "coach" | "member"): "member" | "coach" {
  return role === "member" ? "member" : "coach";
}

async function queueRoleChangeEmail(
  request: Request,
  input: {
    clubId: string;
    clubName: string;
    userId: string;
    nextRole: "admin" | "coach" | "member";
    destination: string;
  },
) {
  const [user] = await selectRows("app_users", `select=*&id=eq.${encodeURIComponent(input.userId)}&limit=1`);
  if (!user?.email) return;

  await queueEmail({
    clubId: input.clubId,
    toEmail: user.email,
    template: "admin_notification",
    subject: `Your ${input.clubName} role changed`,
    body: staffNotificationEmailBody({
      title: `Your role in ${input.clubName} was updated`,
      message: `Your Grapply access is now ${input.nextRole}.`,
      destinationUrl: getRequestUrl(input.destination, request).toString(),
    }),
    metadata: {
      userId: input.userId,
      role: input.nextRole,
      event: "role_changed",
    },
  });
}

async function queueAccessRemovedEmail(input: {
  clubId: string;
  clubName: string;
  userId: string;
}) {
  const [user] = await selectRows("app_users", `select=*&id=eq.${encodeURIComponent(input.userId)}&limit=1`);
  if (!user?.email) return;

  await queueEmail({
    clubId: input.clubId,
    toEmail: user.email,
    template: "admin_notification",
    subject: `${input.clubName} access removed`,
    body: staffNotificationEmailBody({
      title: `${input.clubName} access removed`,
      message: "Your Grapply access to this academy was removed by an owner or admin.",
    }),
    metadata: {
      userId: input.userId,
      event: "access_removed",
    },
  });
}

type RolePayload = {
  clubSlug?: string;
  membershipId: string;
  userId?: string;
  role?: "admin" | "coach" | "member";
  invitedBy?: string | null;
};

function validateRolePayload(payload: Record<string, unknown>, mode: "assign" | "update"): { data: RolePayload; error?: never } | { data?: never; error: Response } {
  const clubSlug = optionalString(payload.clubSlug, "Club slug");
  const membershipId = optionalString(payload.membershipId, "Membership id");
  const userId = optionalUuid(payload.user_id ?? payload.userId, "User id");
  const role = optionalRole(payload.role);
  const invitedBy = optionalUuid(payload.invited_by ?? payload.invitedBy, "Invited by");

  const firstError = [clubSlug, membershipId, userId, role, invitedBy].find((item) => item.error);
  if (firstError?.error) return { error: validationError(firstError.error) };

  if (mode === "assign" && (!userId.value || !role.value)) {
    return { error: validationError("User id and role are required.") };
  }

  if (mode === "update" && (!membershipId.value || !role.value)) {
    return { error: validationError("Membership id and role are required.") };
  }

  return {
    data: {
      membershipId: membershipId.value ?? "",
      ...(clubSlug.value ? { clubSlug: clubSlug.value } : {}),
      ...(userId.value ? { userId: userId.value } : {}),
      ...(role.value ? { role: role.value } : {}),
      ...(invitedBy.value !== undefined ? { invitedBy: invitedBy.value } : {}),
    },
  };
}

type FieldResult<T> = { value: T; error?: never } | { value?: never; error: string };

function validationError(error: string) {
  return validationErrorJson(error);
}

function requiredString(value: unknown, label: string): FieldResult<string> {
  if (typeof value !== "string" || !value.trim()) return { error: `${label} is required.` };
  return { value: value.trim() };
}

function optionalString(value: unknown, label: string): FieldResult<string | undefined> {
  if (value === undefined || value === null) return { value: undefined as string | undefined };
  return requiredString(value, label);
}

function optionalUuid(value: unknown, label: string): FieldResult<string | null | undefined> {
  if (value === undefined) return { value: undefined as string | null | undefined };
  if (value === null) return { value: null };
  if (typeof value !== "string" || !isUuid(value)) return { error: `${label} must be a valid id.` };
  return { value };
}

function optionalRole(value: unknown): FieldResult<RolePayload["role"] | undefined> {
  if (value === undefined || value === null) return { value: undefined as RolePayload["role"] | undefined };
  if (typeof value !== "string" || !validAssignableRoles.has(value)) return { error: "Role must be admin, coach, or member." };
  return { value: value as RolePayload["role"] };
}

function getMockClubId(slug: string) {
  return clubs.find((club) => club.slug === slug)?.id ?? slug;
}
