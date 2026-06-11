import { NextResponse } from "next/server";
import { setActiveClubCookie, setAuthCookies } from "@/lib/auth-cookies";
import { recordAuthFailure } from "@/lib/auth-observability";
import { isMockAuthFallbackAllowed, isProductionRuntime } from "@/lib/auth-mode";
import { getAuthEmailError, getPasswordError, normalizeAuthEmail } from "@/lib/auth-validation";
import { inviteAcceptedEmailBody, queueEmail, welcomeEmailBody } from "@/lib/email/outbox";
import { createAuthUser, signInWithPassword } from "@/lib/supabase/auth";
import { noStoreJson, readJsonObject } from "@/lib/api-json";
import { ensureClubMemberProfile } from "@/lib/member-profiles";
import { getRequestUrl } from "@/lib/request-origin";
import { isSupabaseConfigured, selectRows, updateRows, upsertRow } from "@/lib/supabase/server";
import type { TableRow } from "@/lib/supabase/types";
import { getRoleSafeWorkspaceReturnTo, normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo, splitOrganizationWorkspacePath } from "@/lib/workspace-intent";

type InviteRegistrationContext = {
  invite: TableRow<"club_invites">;
  club: TableRow<"clubs">;
};

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isFormSubmit = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  const payload = isFormSubmit ? Object.fromEntries(await request.formData()) : await readJsonObject(request);
  const rawReturnTo = String(payload?.returnTo ?? "");
  const returnTo = normalizeWorkspaceReturnTo(rawReturnTo);
  const userEmail = normalizeAuthEmail(payload?.email ?? payload?.ownerEmail);
  const userName = String(payload?.fullName ?? payload?.name ?? payload?.ownerName ?? userEmail.split("@")[0] ?? "User").trim();
  const password = String(payload?.password ?? "demo");
  const inviteToken = String(payload?.inviteToken ?? "").trim();

  const emailError = getAuthEmailError(userEmail);
  const passwordError = getPasswordError(password);

  if (inviteToken && (emailError || passwordError)) {
    const error = emailError ?? passwordError ?? "Email and password are required.";
    if (isFormSubmit) return noStoreRedirect(authErrorUrl(request, "/register", returnTo, error, inviteToken), 303);
    return noStoreJson({ ok: false, error }, { status: 400 });
  }

  if (!inviteToken && (!userName || emailError || passwordError)) {
    const error = !userName
      ? "Full name is required."
      : emailError ?? passwordError ?? "Name, email, and password are required.";
    if (isFormSubmit) return noStoreRedirect(authErrorUrl(request, "/register", returnTo, error), 303);
    return noStoreJson({ ok: false, error }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    if (!isMockAuthFallbackAllowed()) {
      const error = "Supabase backend is not configured on this deployment. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.";
      if (isFormSubmit) return noStoreRedirect(authErrorUrl(request, "/register", returnTo, error, inviteToken), 303);
      return noStoreJson({ ok: false, source: "supabase", error }, { status: 500 });
    }

    if (inviteToken) {
      const error = "Club invites require the Supabase backend.";
      if (isFormSubmit) return noStoreRedirect(authErrorUrl(request, "/register", returnTo, error, inviteToken), 303);
      return noStoreJson({ ok: false, source: "mock", error }, { status: 500 });
    }

    const error = "Account registration requires the Supabase backend.";
    const response = isFormSubmit
      ? noStoreRedirect(authErrorUrl(request, "/register", returnTo, error), 303)
      : noStoreJson({
          ok: false,
          source: "mock",
          error,
        }, { status: 500 });
    return response;
  }

  try {
    const inviteContext = inviteToken
      ? await getValidInviteRegistrationContext(inviteToken, userEmail)
      : null;
    let authUser: Awaited<ReturnType<typeof createAuthUser>>;
    let session: Awaited<ReturnType<typeof signInWithPassword>> | null = null;

    try {
      authUser = await createAuthUser({ email: userEmail, password, name: userName });
    } catch {
      session = await signInWithPassword(userEmail, password);
      authUser = session.user;
    }

    const user = await upsertRow(
      "app_users",
      {
        name: userName,
        email: userEmail,
        auth_user_id: authUser.id,
        avatar_url: null,
      },
      "email",
    );

    if (inviteContext) {
      const { invite, club } = inviteContext;
      const [existingMembership] = await selectRows("club_memberships", `select=*&club_id=eq.${club.id}&user_id=eq.${user.id}&limit=1`);
      session ??= await signInWithPassword(userEmail, password);

      if (existingMembership) {
        const nextRole = getInviteAppliedRole(existingMembership.role, invite.role);
        if (existingMembership.role !== nextRole) {
          await updateRows(
            "club_memberships",
            { role: nextRole },
            `id=eq.${encodeURIComponent(existingMembership.id)}&club_id=eq.${club.id}`,
          );
        }
        const destination = getInviteDestination(returnTo, club.slug, nextRole);
        await ensureClubMemberProfile({
          clubId: club.id,
          clubName: club.name,
          user,
          membershipRole: nextRole,
        });
        await markInviteAccepted(invite.id);
        const destinationUrl = getRequestUrl(destination, request);
        destinationUrl.searchParams.set("invite", existingMembership.role === nextRole ? "already-member" : "role-updated");
        const response = isFormSubmit
          ? noStoreRedirect(destinationUrl, 303)
          : noStoreJson({ ok: true, source: "supabase", user, club, membership: { ...existingMembership, role: nextRole }, redirectTo: destinationUrl.pathname + destinationUrl.search });
        setAuthCookies(response, session);
        setActiveClubCookie(response, club.slug);
        return response;
      }

      if (!isInviteMembershipRole(invite.role)) throw new Error("Invite role is not supported.");
      const destination = getInviteDestination(returnTo, club.slug, invite.role);

      const membership = await upsertRow(
        "club_memberships",
        {
          user_id: user.id,
          club_id: club.id,
          role: invite.role,
          invited_by: invite.invited_by,
          joined_at: new Date().toISOString().slice(0, 10),
        },
        "user_id,club_id",
      );
      await ensureClubMemberProfile({
        clubId: club.id,
        clubName: club.name,
        user,
        membershipRole: invite.role,
      });

      const acceptedInvite = await markInviteAccepted(invite.id);
      if (!acceptedInvite) {
        const destinationUrl = getRequestUrl(destination, request);
        destinationUrl.searchParams.set("invite", "already-accepted");
        const response = isFormSubmit
          ? noStoreRedirect(destinationUrl, 303)
          : noStoreJson({ ok: true, source: "supabase", user, club, membership, redirectTo: destinationUrl.pathname + destinationUrl.search });
        setAuthCookies(response, session);
        setActiveClubCookie(response, club.slug);
        return response;
      }

      await queueWelcomeEmail(request, {
        clubId: club.id,
        clubName: club.name,
        toEmail: userEmail,
        destination,
        template: "invite_welcome",
      });
      await queueInviteAcceptedNotification({
        request,
        clubId: club.id,
        clubName: club.name,
        invitedBy: invite.invited_by,
        invitedName: userName,
        invitedEmail: userEmail,
        role: invite.role,
        destination,
        membershipId: membership.id,
      });
      const response = isFormSubmit
        ? noStoreRedirect(getRequestUrl(destination, request), 303)
        : noStoreJson({ ok: true, source: "supabase", user, club, membership, redirectTo: destination });
      setAuthCookies(response, session);
      setActiveClubCookie(response, club.slug);
      return response;
    }

    session ??= await signInWithPassword(userEmail, password);
    const destination = await getAccountRegistrationDestination(user.id, rawReturnTo, returnTo);
    const response = isFormSubmit
      ? noStoreRedirect(getRequestUrl(destination, request), 303)
      : noStoreJson({ ok: true, source: "supabase", user, redirectTo: destination });
    setAuthCookies(response, session);
    setDestinationActiveClubCookie(response, destination);
    return response;
  } catch (error) {
    if (isFormSubmit) return noStoreRedirect(authErrorUrl(request, "/register", returnTo, getAuthErrorMessage(error), inviteToken), 303);
    return authFailureJson(error, "Registration failed. Check the details and try again.", 400);
  }
}

function authFailureJson(error: unknown, fallback: string, status = 400) {
  const requestId = crypto.randomUUID();
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[grapply:auth:${requestId}]`, message);
  recordAuthFailure({ requestId, message, status, action: "register" });
  const response = noStoreJson(
    {
      ok: false,
      source: "supabase",
      error: isProductionRuntime() ? fallback : getAuthErrorMessage(error),
      requestId,
    },
    { status },
  );
  response.headers.set("X-Request-Id", requestId);
  response.headers.set("X-Grapply-Error-Source", "auth");
  return response;
}

function noStoreRedirect(url: URL, status?: number) {
  const response = NextResponse.redirect(url, status);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function setDestinationActiveClubCookie(response: NextResponse, destination: string) {
  const route = splitOrganizationWorkspacePath(new URL(destination, "https://grapply.local").pathname);
  if (route?.organizationId) setActiveClubCookie(response, route.organizationId);
}

async function getAccountRegistrationDestination(userId: string, rawReturnTo: string, returnTo: string) {
  const memberships = await selectRows("club_memberships", `select=*&user_id=eq.${userId}`);
  const requestedWorkspace = getRequestedWorkspace(rawReturnTo);
  if (requestedWorkspace) {
    const [requestedClub] = await selectRows("clubs", `select=*&slug=eq.${encodeURIComponent(requestedWorkspace.organizationId)}&limit=1`);
    const membership = requestedClub ? memberships.find((item) => item.club_id === requestedClub.id) : null;
    if (requestedClub && membership) {
      return scopeWorkspaceReturnTo(
        getRoleSafeWorkspaceReturnTo(requestedWorkspace.workspaceReturnTo, membership.role),
        requestedClub.slug,
      );
    }

    return clubsPath(requestedWorkspace.workspaceReturnTo);
  }

  if (memberships.length === 1) {
    const [club] = await selectRows("clubs", `select=*&id=eq.${memberships[0].club_id}&limit=1`);
    if (club) return scopeWorkspaceReturnTo(getRoleSafeWorkspaceReturnTo(returnTo, memberships[0].role), club.slug);
  }

  return clubsPath(returnTo);
}

function getRequestedWorkspace(returnTo: string) {
  if (!returnTo.startsWith("/")) return null;

  try {
    const destination = new URL(returnTo, "https://grapply.local");
    const route = splitOrganizationWorkspacePath(destination.pathname);
    if (!route) return null;

    return {
      organizationId: route.organizationId,
      workspaceReturnTo: `${route.workspacePath}${destination.search}`,
    };
  } catch {
    return null;
  }
}

async function queueInviteAcceptedNotification(input: {
  request: Request;
  clubId: string;
  clubName: string;
  invitedBy: string | null;
  invitedName: string;
  invitedEmail: string;
  role: string;
  destination: string;
  membershipId: string;
}) {
  if (!input.invitedBy) return;

  const [inviter] = await selectRows("app_users", `select=*&id=eq.${encodeURIComponent(input.invitedBy)}&limit=1`);
  if (!inviter?.email || inviter.email.toLowerCase() === input.invitedEmail.toLowerCase()) return;

  await queueEmail({
    clubId: input.clubId,
    toEmail: inviter.email,
    template: "invite_accepted_notification",
    subject: `${input.invitedName} joined ${input.clubName}`,
    body: inviteAcceptedEmailBody({
      clubName: input.clubName,
      invitedName: input.invitedName,
      invitedEmail: input.invitedEmail,
      role: input.role,
      destinationUrl: getRequestUrl(input.destination, input.request).toString(),
    }),
    metadata: {
      destination: input.destination,
      membershipId: input.membershipId,
      invitedBy: input.invitedBy,
      invitedEmail: input.invitedEmail,
    },
  });
}

async function getValidInviteRegistrationContext(inviteToken: string, inviteEmail: string): Promise<InviteRegistrationContext> {
  const [invite] = await selectRows("club_invites", `select=*&token=eq.${encodeURIComponent(inviteToken)}&status=eq.pending&limit=1`);
  if (!invite) throw new Error("Invite not found or already used.");
  if (!isInviteMembershipRole(invite.role)) throw new Error("Invite role is not supported.");
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    await updateRows("club_invites", { status: "expired" }, `id=eq.${invite.id}`);
    throw new Error("Invite expired.");
  }
  if (invite.email.toLowerCase() !== inviteEmail) throw new Error("Invite email does not match this account.");

  const [club] = await selectRows("clubs", `select=*&id=eq.${invite.club_id}&limit=1`);
  if (!club) throw new Error("Invited club not found.");

  return { invite, club };
}

function getInviteDestination(returnTo: string, clubSlug: string, role: string | null) {
  return scopeWorkspaceReturnTo(getRoleSafeWorkspaceReturnTo(returnTo, role), clubSlug);
}

function isInviteMembershipRole(role: string): role is "admin" | "coach" | "member" {
  return role === "admin" || role === "coach" || role === "member";
}

function getInviteAppliedRole(
  existingRole: string,
  inviteRole: "admin" | "coach" | "member",
): "owner" | "admin" | "coach" | "member" {
  const roleRank = {
    owner: 4,
    admin: 3,
    coach: 2,
    member: 1,
  } satisfies Record<"owner" | "admin" | "coach" | "member", number>;
  if (existingRole === "owner" || existingRole === "admin" || existingRole === "coach" || existingRole === "member") {
    return roleRank[existingRole] >= roleRank[inviteRole] ? existingRole : inviteRole;
  }
  return inviteRole;
}

async function markInviteAccepted(inviteId: string) {
  const [acceptedInvite] = await updateRows(
    "club_invites",
    { status: "accepted", accepted_at: new Date().toISOString() },
    `id=eq.${encodeURIComponent(inviteId)}&status=eq.pending`,
  );
  return acceptedInvite ?? null;
}

function authErrorUrl(request: Request, path: string, returnTo: string, error: string, inviteToken?: string) {
  const url = getRequestUrl(path, request);
  url.searchParams.set("returnTo", normalizeWorkspaceReturnTo(returnTo));
  url.searchParams.set("error", error);
  if (inviteToken) url.searchParams.set("invite", inviteToken);
  return url;
}

function clubsPath(returnTo: string) {
  return `/clubs?returnTo=${encodeURIComponent(normalizeWorkspaceReturnTo(returnTo))}`;
}

function getAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Cannot reach Supabase")) return "Grapply cannot reach Supabase right now. Check the Supabase project URL, DNS, and project status.";
  if (message.includes("Invite expired")) return "This invite has expired. Ask the academy owner to send a new invite.";
  if (message.includes("Invite not found")) return "This invite was already used, revoked, or does not exist.";
  if (message.includes("Invite email")) return "This invite belongs to a different email address.";
  if (message.includes("Invited club")) return "The invited academy could not be found.";
  if (message.includes("already") || message.includes("registered")) return "This email is already registered. Try signing in with the same password.";
  return "Registration failed. Check the details and try again.";
}

async function queueWelcomeEmail(
  request: Request,
  input: {
    clubId: string;
    clubName: string;
    toEmail: string;
    destination: string;
    template: "invite_welcome" | "owner_welcome";
  },
) {
  const destinationUrl = getRequestUrl(input.destination, request).toString();

  await queueEmail({
    clubId: input.clubId,
    toEmail: input.toEmail,
    template: input.template,
    subject: `Welcome to ${input.clubName} on Grapply`,
    body: welcomeEmailBody({
      clubName: input.clubName,
      destinationUrl,
    }),
    metadata: {
      destination: input.destination,
    },
  });
}
