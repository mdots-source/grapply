import { NextResponse } from "next/server";
import { setActiveClubCookie, setAuthCookies } from "@/lib/auth-cookies";
import { getCurrentSessionWithRefresh } from "@/lib/auth-session";
import { isMockAuthFallbackAllowed } from "@/lib/auth-mode";
import { apiSupabaseError } from "@/lib/api-access";
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

  const { session, refreshedSession } = await getCurrentSessionWithRefresh();
  const redirectWithAuth = (redirectUrl: URL, status?: number) => {
    const response = noStoreRedirect(redirectUrl, status);
    if (refreshedSession) setAuthCookies(response, refreshedSession);
    return response;
  };
  if (!session) {
    const loginUrl = getRequestUrl("/login", request);
    loginUrl.searchParams.set("returnTo", returnTo);
    loginUrl.searchParams.set("invite", inviteToken);
    return redirectWithAuth(loginUrl, 303);
  }

  if (!isSupabaseConfigured()) {
    if (isMockAuthFallbackAllowed()) {
      return redirectWithAuth(authErrorUrl(request, returnTo, "Club invites require the Supabase backend."), 303);
    }
    return redirectWithAuth(authErrorUrl(request, returnTo, "Supabase backend is not configured."), 303);
  }

  let clubId: string | null = null;
  try {
    const [invite] = await selectRows("club_invites", `select=*&token=eq.${encodeURIComponent(inviteToken)}&status=eq.pending&limit=1`);
    if (!invite) {
      return redirectWithAuth(authErrorUrl(request, returnTo, "This invite was already used, revoked, or does not exist."), 303);
    }
    clubId = invite.club_id;

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      await updateRows("club_invites", { status: "expired" }, `id=eq.${invite.id}`);
      return redirectWithAuth(authErrorUrl(request, returnTo, "This invite has expired. Ask the academy owner to send a new invite."), 303);
    }

    if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return redirectWithAuth(authErrorUrl(request, returnTo, "This invite belongs to a different email address."), 303);
    }
    if (!isInviteMembershipRole(invite.role)) {
      return redirectWithAuth(authErrorUrl(request, returnTo, "This invite role is not supported."), 303);
    }

    const [club] = await selectRows("clubs", `select=*&id=eq.${invite.club_id}&limit=1`);
    if (!club) {
      return redirectWithAuth(authErrorUrl(request, returnTo, "The invited academy could not be found."), 303);
    }
    const [user] = await selectRows("app_users", `select=*&id=eq.${encodeURIComponent(session.user.id)}&limit=1`);
    if (!user) {
      return redirectWithAuth(authErrorUrl(request, returnTo, "Your Grapply account profile could not be found."), 303);
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
      const response = redirectWithAuth(destinationUrl, 303);
      setActiveClubCookie(response, club.slug);
      return response;
    }

    await upsertRow(
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
      const response = redirectWithAuth(destinationUrl, 303);
      setActiveClubCookie(response, club.slug);
      return response;
    }

    const response = redirectWithAuth(getRequestUrl(destination, request), 303);
    setActiveClubCookie(response, club.slug);
    return response;
  } catch (error) {
    return apiSupabaseError(error, { clubId });
  }
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
