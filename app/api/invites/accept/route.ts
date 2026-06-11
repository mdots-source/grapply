import { NextResponse } from "next/server";
import { setActiveClubCookie } from "@/lib/auth-cookies";
import { getCurrentSession } from "@/lib/auth-session";
import { isMockAuthFallbackAllowed } from "@/lib/auth-mode";
import { apiSupabaseError } from "@/lib/api-access";
import { inviteAcceptedEmailBody, queueEmail, welcomeEmailBody } from "@/lib/email/outbox";
import { ensureClubMemberProfile } from "@/lib/member-profiles";
import { getRequestUrl } from "@/lib/request-origin";
import { isSupabaseConfigured, selectRows, updateRows, upsertRow } from "@/lib/supabase/server";
import { getRoleSafeWorkspaceReturnTo, normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo } from "@/lib/workspace-intent";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const inviteToken = url.searchParams.get("invite")?.trim() ?? "";
  const returnTo = normalizeWorkspaceReturnTo(url.searchParams.get("returnTo"));

  if (!inviteToken) {
    return noStoreRedirect(authErrorUrl(request, returnTo, "Invite link is missing."), 303);
  }

  const session = await getCurrentSession();
  if (!session) {
    const loginUrl = getRequestUrl("/login", request);
    loginUrl.searchParams.set("returnTo", returnTo);
    loginUrl.searchParams.set("invite", inviteToken);
    return noStoreRedirect(loginUrl, 303);
  }

  if (!isSupabaseConfigured()) {
    if (isMockAuthFallbackAllowed()) {
      return noStoreRedirect(authErrorUrl(request, returnTo, "Club invites require the Supabase backend."), 303);
    }
    return noStoreRedirect(authErrorUrl(request, returnTo, "Supabase backend is not configured."), 303);
  }

  let clubId: string | null = null;
  try {
    const [invite] = await selectRows("club_invites", `select=*&token=eq.${encodeURIComponent(inviteToken)}&status=eq.pending&limit=1`);
    if (!invite) {
      return noStoreRedirect(authErrorUrl(request, returnTo, "This invite was already used, revoked, or does not exist."), 303);
    }
    clubId = invite.club_id;

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      await updateRows("club_invites", { status: "expired" }, `id=eq.${invite.id}`);
      return noStoreRedirect(authErrorUrl(request, returnTo, "This invite has expired. Ask the academy owner to send a new invite."), 303);
    }

    if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return noStoreRedirect(authErrorUrl(request, returnTo, "This invite belongs to a different email address."), 303);
    }
    if (!isInviteMembershipRole(invite.role)) {
      return noStoreRedirect(authErrorUrl(request, returnTo, "This invite role is not supported."), 303);
    }

    const [club] = await selectRows("clubs", `select=*&id=eq.${invite.club_id}&limit=1`);
    if (!club) {
      return noStoreRedirect(authErrorUrl(request, returnTo, "The invited academy could not be found."), 303);
    }
    const [user] = await selectRows("app_users", `select=*&id=eq.${encodeURIComponent(session.user.id)}&limit=1`);
    if (!user) {
      return noStoreRedirect(authErrorUrl(request, returnTo, "Your Grapply account profile could not be found."), 303);
    }

    const [existingMembership] = await selectRows("club_memberships", `select=*&club_id=eq.${club.id}&user_id=eq.${session.user.id}&limit=1`);
    if (existingMembership) {
      const nextRole = getInviteAppliedRole(existingMembership.role, invite.role);
      if (existingMembership.role !== nextRole) {
        await updateRows(
          "club_memberships",
          { role: nextRole },
          `id=eq.${encodeURIComponent(existingMembership.id)}&club_id=eq.${club.id}`,
        );
      }
      await ensureClubMemberProfile({
        clubId: club.id,
        clubName: club.name,
        user,
        membershipRole: nextRole,
      });
      const destination = getInviteDestination(returnTo, club.slug, nextRole);
      await markInviteAccepted(invite.id);
      const destinationUrl = getRequestUrl(destination, request);
      destinationUrl.searchParams.set("invite", existingMembership.role === nextRole ? "already-member" : "role-updated");
      const response = noStoreRedirect(destinationUrl, 303);
      setActiveClubCookie(response, club.slug);
      return response;
    }

    const membership = await upsertRow(
      "club_memberships",
      {
        user_id: session.user.id,
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

    const destination = getInviteDestination(returnTo, club.slug, invite.role);
    const acceptedInvite = await markInviteAccepted(invite.id);
    if (!acceptedInvite) {
      const destinationUrl = getRequestUrl(destination, request);
      destinationUrl.searchParams.set("invite", "already-accepted");
      const response = noStoreRedirect(destinationUrl, 303);
      setActiveClubCookie(response, club.slug);
      return response;
    }

    await queueEmail({
      clubId: club.id,
      toEmail: session.user.email,
      template: "invite_welcome",
      subject: `Welcome to ${club.name} on Grapply`,
      body: welcomeEmailBody({
        clubName: club.name,
        destinationUrl: getRequestUrl(destination, request).toString(),
      }),
      metadata: { destination, inviteToken, membershipId: membership.id },
    });
    await queueInviteAcceptedNotification({
      request,
      clubId: club.id,
      clubName: club.name,
      invitedBy: invite.invited_by,
      invitedName: session.user.name,
      invitedEmail: session.user.email,
      role: invite.role,
      destination,
      membershipId: membership.id,
    });

    const response = noStoreRedirect(getRequestUrl(destination, request), 303);
    setActiveClubCookie(response, club.slug);
    return response;
  } catch (error) {
    return apiSupabaseError(error, { clubId });
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

function getInviteDestination(returnTo: string, clubSlug: string, role: string | null) {
  return scopeWorkspaceReturnTo(getRoleSafeWorkspaceReturnTo(returnTo, role), clubSlug);
}

function isInviteMembershipRole(role: string): role is "admin" | "coach" | "member" {
  return role === "admin" || role === "coach" || role === "member";
}

function getInviteAppliedRole(existingRole: string, inviteRole: "admin" | "coach" | "member"): "owner" | "admin" | "coach" | "member" {
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

function authErrorUrl(request: Request, returnTo: string, error: string) {
  const url = getRequestUrl("/login", request);
  url.searchParams.set("returnTo", returnTo);
  url.searchParams.set("error", error);
  return url;
}

function noStoreRedirect(url: URL, status?: number) {
  const response = NextResponse.redirect(url, status);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
