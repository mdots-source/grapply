import { inviteEmailBody, queueEmail } from "@/lib/email/outbox";
import { apiSupabaseError, requireApiRole, requireSupabasePersistence } from "@/lib/api-access";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getBackendClubId } from "@/lib/backend";
import { getRequestUrl } from "@/lib/request-origin";
import { insertRow, isSupabaseConfigured, selectRows, updateRows } from "@/lib/supabase/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validRoles = new Set(["admin", "coach", "member"]);
const validStatuses = new Set(["pending", "expired", "revoked"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiRole(["owner", "admin"], searchParams.get("club"));
  if (access.error) return access.error;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ source: "supabase", invites: [] });
      const roleFilter = access.session.activeRole === "admin" ? "&role=in.(coach,member)" : "";
      const rows = await selectRows("club_invites", `select=*&club_id=eq.${clubId}${roleFilter}&order=created_at.desc`);
      return noStoreJson({ source: "supabase", invites: rows });
    } catch (error) {
      const inviteError = getInviteSupabaseValidationError(error);
      if (inviteError) return inviteError;
      return apiSupabaseError(error, { clubId });
    }
  }

  return noStoreJson({ source: "mock", invites: [] });
}

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateInvitePayload(payload, "create");
  if (validation.error) return validation.error;
  const data = validation.data;
  const inviteEmail = data.email ?? "";
  const inviterId = getSafeUuid(access.session.user.id);

  if (access.session.activeRole !== "owner" && data.role === "admin") {
    return noStoreJson({ ok: false, error: "Only owners can invite admins." }, { status: 403 });
  }

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

      const [existingMembership] = await selectRows(
        "app_users",
        `select=*&email=eq.${encodeURIComponent(inviteEmail)}&limit=1`,
      );
      if (existingMembership) {
        const [membership] = await selectRows(
          "club_memberships",
          `select=*&club_id=eq.${clubId}&user_id=eq.${existingMembership.id}&limit=1`,
        );
        if (membership) {
          return noStoreJson({ ok: false, error: "This user is already in this club." }, { status: 409 });
        }
      }

      const [existingInvite] = await selectRows("club_invites", `select=*&club_id=eq.${clubId}&email=eq.${encodeURIComponent(inviteEmail)}&limit=1`);
      if (existingInvite?.role === "admin" && access.session.activeRole !== "owner") {
        return noStoreJson({ ok: false, error: "Only owners can manage admin invites." }, { status: 403 });
      }
      if (existingInvite?.status === "pending") {
        return noStoreJson({ ok: false, error: "An active invite already exists for this email.", invite: existingInvite }, { status: 409 });
      }

      if (existingInvite) {
        const [reopened] = await updateRows(
          "club_invites",
          {
            role: data.role ?? "member",
            invited_by: inviterId,
            status: "pending",
            token: createInviteToken(),
            expires_at: getInviteExpiry(),
            accepted_at: null,
          },
          `id=eq.${existingInvite.id}&club_id=eq.${clubId}`,
        );
        if (reopened) await queueInviteEmail(request, reopened, access.session.activeClub);
        return noStoreJson({ ok: true, source: "supabase", invite: reopened });
      }

      const row = await insertRow("club_invites", {
        club_id: clubId,
        email: inviteEmail,
        role: data.role ?? "member",
        invited_by: inviterId,
        status: "pending",
      });

      await queueInviteEmail(request, row, access.session.activeClub);
      return noStoreJson({ ok: true, source: "supabase", invite: row });
    } catch (error) {
      const inviteError = getInviteSupabaseValidationError(error);
      if (inviteError) return inviteError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Club invites");
  if (persistenceError) return persistenceError;

  return noStoreJson({ ok: true, source: "mock", invite: data });
}

export async function PATCH(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateInvitePayload(payload, "update");
  if (validation.error) return validation.error;
  const data = validation.data;

  if (access.session.activeRole !== "owner" && data.role === "admin") {
    return noStoreJson({ ok: false, error: "Only owners can manage admin invites." }, { status: 403 });
  }

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

      const [existingInvite] = await selectRows("club_invites", `select=*&id=eq.${encodeURIComponent(data.id)}&club_id=eq.${clubId}&limit=1`);
      if (!existingInvite) return noStoreJson({ ok: false, error: "Invite not found in this club." }, { status: 404 });
      if (access.session.activeRole !== "owner" && existingInvite.role === "admin") {
        return noStoreJson({ ok: false, error: "Only owners can manage admin invites." }, { status: 403 });
      }
      if (existingInvite.status === "accepted") {
        return noStoreJson({ ok: false, error: "Accepted invites cannot be edited. Revoke the invite or change the member role from Admin." }, { status: 409 });
      }
      if (data.status === "pending" || data.email) {
        const nextEmail = data.email ?? existingInvite.email;
        const inviteConflict = await getInviteEmailConflict(clubId, nextEmail, existingInvite.id);
        if (inviteConflict) return inviteConflict;
      }

      const [row] = await updateRows(
        "club_invites",
        {
          status: data.status,
          ...(data.role ? { role: data.role } : {}),
          ...(data.email ? { email: data.email } : {}),
          ...(data.status === "pending" ? { token: createInviteToken(), expires_at: getInviteExpiry(), accepted_at: null } : {}),
        },
        `id=eq.${encodeURIComponent(data.id)}&club_id=eq.${clubId}`,
      );

      if (row && data.status === "pending") await queueInviteEmail(request, row, access.session.activeClub);
      return noStoreJson({ ok: true, source: "supabase", invite: row });
    } catch (error) {
      const inviteError = getInviteSupabaseValidationError(error);
      if (inviteError) return inviteError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Club invites");
  if (persistenceError) return persistenceError;

  return noStoreJson({ ok: true, source: "mock", invite: data });
}

export async function DELETE(request: Request) {
  const payload = await readJsonObject(request);
  const forbidden = getClientControlledInviteField(payload);
  if (forbidden) return validationError(`${forbidden} is assigned by the server.`);

  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const id = requiredInviteId(payload.id);
  if (id.error) return validationError(id.error);
  const inviteId = id.value ?? "";

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const [existingInvite] = await selectRows("club_invites", `select=*&id=eq.${encodeURIComponent(inviteId)}&club_id=eq.${clubId}&limit=1`);
      if (!existingInvite) return noStoreJson({ ok: false, error: "Invite not found in this club." }, { status: 404 });
      if (access.session.activeRole !== "owner" && existingInvite.role === "admin") {
        return noStoreJson({ ok: false, error: "Only owners can revoke admin invites." }, { status: 403 });
      }
      const [invite] = await updateRows(
        "club_invites",
        { status: "revoked" },
        `id=eq.${encodeURIComponent(inviteId)}&club_id=eq.${clubId}`,
      );
      return noStoreJson({ ok: true, source: "supabase", invite });
    } catch (error) {
      const inviteError = getInviteSupabaseValidationError(error);
      if (inviteError) return inviteError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Club invites");
  if (persistenceError) return persistenceError;

  return noStoreJson({ ok: true, source: "mock", id: inviteId });
}

type InvitePayload = {
  id: string;
  clubSlug?: string;
  email?: string;
  role?: "admin" | "coach" | "member";
  status?: "pending" | "expired" | "revoked";
};

function validateInvitePayload(payload: Record<string, unknown>, mode: "create" | "update"): { data: InvitePayload; error?: never } | { data?: never; error: Response } {
  const forbidden = getClientControlledInviteField(payload);
  if (forbidden) return { error: validationError(`${forbidden} is assigned by the server.`) };

  const id = mode === "update" ? optionalInviteId(payload.id) : optionalString(payload.id, "Invite id");
  const clubSlug = optionalString(payload.clubSlug, "Club slug");
  const email = optionalEmail(payload.email);
  const role = optionalRole(payload.role);
  const status = optionalStatus(payload.status);

  const firstError = [id, clubSlug, email, role, status].find((item) => item.error);
  if (firstError?.error) return { error: validationError(firstError.error) };

  if (mode === "create" && !email.value) {
    return { error: validationError("Invite email is required.") };
  }

  if (mode === "update" && !id.value) {
    return { error: validationError("Invite id is required.") };
  }

  if (mode === "update" && !email.value && !role.value && !status.value) {
    return { error: validationError("Invite email, role, or status is required.") };
  }

  return {
    data: {
      id: id.value ?? "",
      ...(clubSlug.value ? { clubSlug: clubSlug.value } : {}),
      ...(email.value ? { email: email.value } : {}),
      ...(role.value ? { role: role.value } : {}),
      ...(status.value ? { status: status.value } : {}),
    },
  };
}

type FieldResult<T> = { value: T; error?: never } | { value?: never; error: string };

function validationError(error: string) {
  return validationErrorJson(error);
}

function getClientControlledInviteField(payload: Record<string, unknown>) {
  const labels: Record<string, string> = {
    acceptedAt: "Invite acceptance",
    accepted_at: "Invite acceptance",
    clubId: "Invite club",
    club_id: "Invite club",
    expiresAt: "Invite expiry",
    expires_at: "Invite expiry",
    invitedBy: "Invite author",
    invited_by: "Invite author",
    token: "Invite token",
  };

  const field = Object.keys(labels).find((key) => payload[key] !== undefined);
  return field ? labels[field] : null;
}

function getInviteSupabaseValidationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("club_invites_club_lower_email_key") || message.includes("club_invites_club_id_email_key")) {
    return noStoreJson({ ok: false, error: "An invite already exists for this email in this club." }, { status: 409 });
  }
  if (message.includes("club_invites_role_allowed_for_membership") || message.includes("club_invites_role_not_owner")) {
    return noStoreJson({ ok: false, error: "Invite role is not supported." }, { status: 400 });
  }
  if (message.includes("club_invites_accepted_at_status_consistent")) {
    return noStoreJson({ ok: false, error: "Invite acceptance is managed by the invite link." }, { status: 400 });
  }
  return null;
}

function getInviteExpiry() {
  return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
}

function createInviteToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function getInviteEmailConflict(clubId: string, email: string, currentInviteId?: string) {
  const [existingUser] = await selectRows("app_users", `select=id&email=eq.${encodeURIComponent(email)}&limit=1`);
  if (existingUser) {
    const [membership] = await selectRows(
      "club_memberships",
      `select=id&club_id=eq.${clubId}&user_id=eq.${existingUser.id}&limit=1`,
    );
    if (membership) {
      return noStoreJson({ ok: false, error: "This user is already in this club." }, { status: 409 });
    }
  }

  const [pendingInvite] = await selectRows(
    "club_invites",
    `select=*&club_id=eq.${clubId}&email=eq.${encodeURIComponent(email)}&status=eq.pending&limit=1`,
  );
  if (pendingInvite && pendingInvite.id !== currentInviteId) {
    return noStoreJson({ ok: false, error: "An active invite already exists for this email.", invite: pendingInvite }, { status: 409 });
  }

  return null;
}

function requiredString(value: unknown, label: string): FieldResult<string> {
  if (typeof value !== "string" || !value.trim()) return { error: `${label} is required.` };
  return { value: value.trim() };
}

function requiredInviteId(value: unknown): FieldResult<string> {
  const id = requiredString(value, "Invite id");
  if (id.error) return id;
  const inviteId = id.value;
  if (!inviteId || !uuidPattern.test(inviteId)) return { error: "Invite id must be a valid id." };
  return { value: inviteId };
}

function optionalString(value: unknown, label: string): FieldResult<string | undefined> {
  if (value === undefined || value === null) return { value: undefined as string | undefined };
  return requiredString(value, label);
}

function optionalInviteId(value: unknown): FieldResult<string | undefined> {
  if (value === undefined || value === null) return { value: undefined as string | undefined };
  return requiredInviteId(value);
}

function optionalEmail(value: unknown): FieldResult<string | undefined> {
  if (value === undefined || value === null) return { value: undefined as string | undefined };
  if (typeof value !== "string") return { error: "Invite email must be text." };
  const email = value.trim().toLowerCase();
  if (!emailPattern.test(email)) return { error: "Invite email is not valid." };
  if (email.length > 254) return { error: "Invite email is too long." };
  return { value: email };
}

function optionalRole(value: unknown): FieldResult<InvitePayload["role"] | undefined> {
  if (value === undefined || value === null) return { value: undefined as InvitePayload["role"] | undefined };
  if (typeof value !== "string" || !validRoles.has(value)) return { error: "Invite role is not supported." };
  return { value: value as InvitePayload["role"] };
}

function optionalStatus(value: unknown): FieldResult<InvitePayload["status"] | undefined> {
  if (value === undefined || value === null) return { value: undefined as InvitePayload["status"] | undefined };
  if (typeof value !== "string" || !validStatuses.has(value)) return { error: "Invite status is not supported." };
  return { value: value as InvitePayload["status"] };
}

function getSafeUuid(value: unknown) {
  return typeof value === "string" && uuidPattern.test(value) ? value : null;
}

async function queueInviteEmail(
  request: Request,
  invite: {
    club_id: string;
    email: string;
    role: string;
    token: string;
  },
  club: { name: string; slug: string },
) {
  const inviteUrl = getRequestUrl("/invite", request);
  inviteUrl.searchParams.set("invite", invite.token);
  inviteUrl.searchParams.set("returnTo", `/${club.slug}/schedule`);

  await queueEmail({
    clubId: invite.club_id,
    toEmail: invite.email,
    template: "club_invite",
    subject: `${club.name} invited you to Grapply`,
    body: inviteEmailBody({
      clubName: club.name,
      role: invite.role,
      inviteUrl: inviteUrl.toString(),
    }),
    metadata: {
      inviteToken: invite.token,
      role: invite.role,
    },
  });
}
