import { NextResponse } from "next/server";
import { setActiveClubCookie, setAuthCookies, setMockAuthCookie } from "@/lib/auth-cookies";
import { isMockAuthFallbackAllowed, isProductionRuntime } from "@/lib/auth-mode";
import { getAuthEmailError, getPasswordError, normalizeAuthEmail } from "@/lib/auth-validation";
import { inviteAcceptedEmailBody, queueEmail, welcomeEmailBody } from "@/lib/email/outbox";
import { createAuthUser, signInWithPassword } from "@/lib/supabase/auth";
import { noStoreJson, readJsonObject } from "@/lib/api-json";
import { ensureClubMemberProfile } from "@/lib/member-profiles";
import { getRequestUrl } from "@/lib/request-origin";
import { insertRow, isSupabaseConfigured, selectRows, updateRows, upsertRow } from "@/lib/supabase/server";
import type { TableRow } from "@/lib/supabase/types";
import { slugify } from "@/lib/slug";
import { getRoleSafeWorkspaceReturnTo, normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo } from "@/lib/workspace-intent";

type InviteRegistrationContext = {
  invite: TableRow<"club_invites">;
  club: TableRow<"clubs">;
};

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isFormSubmit = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  const payload = isFormSubmit ? Object.fromEntries(await request.formData()) : await readJsonObject(request);
  const returnTo = normalizeWorkspaceReturnTo(String(payload?.returnTo ?? ""));
  const academyName = String(payload?.academyName ?? "").trim();
  const ownerEmail = normalizeAuthEmail(payload?.ownerEmail);
  const ownerName = String(payload?.ownerName ?? ownerEmail.split("@")[0] ?? "Owner").trim();
  const location = String(payload?.location ?? "").trim();
  const password = String(payload?.password ?? "demo");
  const inviteToken = String(payload?.inviteToken ?? "").trim();

  const emailError = getAuthEmailError(ownerEmail);
  const passwordError = getPasswordError(password);

  if (inviteToken && (emailError || passwordError)) {
    const error = emailError ?? passwordError ?? "Email and password are required.";
    if (isFormSubmit) return noStoreRedirect(authErrorUrl(request, "/register", returnTo, error, inviteToken), 303);
    return noStoreJson({ ok: false, error }, { status: 400 });
  }

  if (!inviteToken && (!academyName || !location || emailError || passwordError)) {
    const error = !academyName || !location
      ? "Academy name and city are required."
      : emailError ?? passwordError ?? "Registration details are required.";
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

    const club = { slug: slugify(academyName), name: academyName, location };
    const destination = scopeWorkspaceReturnTo(returnTo, club.slug);
    const response = isFormSubmit
      ? noStoreRedirect(getRequestUrl(destination, request), 303)
      : noStoreJson({
          ok: true,
          source: "mock",
          user: { id: "usr-empty", name: ownerName, email: ownerEmail },
          club,
          redirectTo: destination,
        });
    setMockAuthCookie(response, "usr-empty");
    setActiveClubCookie(response, club.slug);
    return response;
  }

  try {
    const inviteContext = inviteToken
      ? await getValidInviteRegistrationContext(inviteToken, ownerEmail)
      : null;
    let authUser: Awaited<ReturnType<typeof createAuthUser>>;
    let session: Awaited<ReturnType<typeof signInWithPassword>> | null = null;

    try {
      authUser = await createAuthUser({ email: ownerEmail, password, name: ownerName });
    } catch {
      session = await signInWithPassword(ownerEmail, password);
      authUser = session.user;
    }

    const user = await upsertRow(
      "app_users",
      {
        name: ownerName,
        email: ownerEmail,
        auth_user_id: authUser.id,
        avatar_url: null,
      },
      "email",
    );

    if (inviteContext) {
      const { invite, club } = inviteContext;
      const [existingMembership] = await selectRows("club_memberships", `select=*&club_id=eq.${club.id}&user_id=eq.${user.id}&limit=1`);
      session ??= await signInWithPassword(ownerEmail, password);

      if (existingMembership) {
        const destination = getInviteDestination(returnTo, club.slug, existingMembership.role);
        await ensureClubMemberProfile({
          clubId: club.id,
          clubName: club.name,
          user,
          membershipRole: existingMembership.role,
        });
        const destinationUrl = getRequestUrl(destination, request);
        destinationUrl.searchParams.set("invite", "already-member");
        const response = isFormSubmit
          ? noStoreRedirect(destinationUrl, 303)
          : noStoreJson({ ok: true, source: "supabase", user, club, membership: existingMembership, redirectTo: destinationUrl.pathname + destinationUrl.search });
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

      await updateRows(
        "club_invites",
        { status: "accepted", accepted_at: new Date().toISOString() },
        `id=eq.${invite.id}`,
      );

      await queueWelcomeEmail(request, {
        clubId: club.id,
        clubName: club.name,
        toEmail: ownerEmail,
        destination,
        template: "invite_welcome",
      });
      await queueInviteAcceptedNotification({
        request,
        clubId: club.id,
        clubName: club.name,
        invitedBy: invite.invited_by,
        invitedName: ownerName,
        invitedEmail: ownerEmail,
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

    const slug = `${slugify(academyName)}-${Date.now().toString(36)}`;

    const club = await insertRow("clubs", {
      slug,
      name: academyName,
      location,
      status: "active",
      member_count: 1,
      primary_coach: ownerName,
    });

    const membership = await upsertRow(
      "club_memberships",
      {
        user_id: user.id,
        club_id: club.id,
        role: "owner",
        invited_by: null,
        joined_at: new Date().toISOString().slice(0, 10),
      },
      "user_id,club_id",
    );
    await ensureClubMemberProfile({
      clubId: club.id,
      clubName: club.name,
      user,
      membershipRole: "owner",
    });

    await Promise.all([
      upsertRow(
        "club_settings",
        {
          club_id: club.id,
          key: "brand",
          value: {
            academyName,
            location,
            description: `${academyName} runs Brazilian Jiu-Jitsu classes, member progression, and academy operations in Grapply.`,
            logoLabel: initials(academyName),
            mats: "Main Mat",
            classTypes: "Gi, No-Gi, Fundamentals, Competition, Open Mat",
            primaryColor: "#7c3aed",
            accentColor: "#22c55e",
          },
        },
        "club_id,key",
      ),
      upsertRow(
        "club_settings",
        {
          club_id: club.id,
          key: "tv",
          value: {
            displayName: `${academyName} Live Mat`,
            showActiveAthletes: true,
            liveCheckInQr: true,
            rotatingAthleteCards: true,
            liveActivityTicker: true,
            showCoachAndMat: true,
          },
        },
        "club_id,key",
      ),
      upsertRow(
        "club_settings",
        {
          club_id: club.id,
          key: "coaches",
          value: [{ name: ownerName, role: "Owner / Coach", focus: "Academy onboarding", mat: "Main Mat" }],
        },
        "club_id,key",
      ),
      upsertRow("club_settings", { club_id: club.id, key: "appearance", value: { theme: "dark", accent: "purple" } }, "club_id,key"),
      upsertRow("club_settings", { club_id: club.id, key: "integrations", value: { strava: false, supabase: true } }, "club_id,key"),
    ]);

    session ??= await signInWithPassword(ownerEmail, password);
    const destination = scopeWorkspaceReturnTo(returnTo, club.slug);
    await queueWelcomeEmail(request, {
      clubId: club.id,
      clubName: club.name,
      toEmail: ownerEmail,
      destination,
      template: "owner_welcome",
    });
    const response = isFormSubmit
      ? noStoreRedirect(getRequestUrl(destination, request), 303)
      : noStoreJson({ ok: true, source: "supabase", user, club, membership, redirectTo: destination });
    setAuthCookies(response, session);
    setActiveClubCookie(response, club.slug);
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

async function getValidInviteRegistrationContext(inviteToken: string, ownerEmail: string): Promise<InviteRegistrationContext> {
  const [invite] = await selectRows("club_invites", `select=*&token=eq.${encodeURIComponent(inviteToken)}&status=eq.pending&limit=1`);
  if (!invite) throw new Error("Invite not found or already used.");
  if (!isInviteMembershipRole(invite.role)) throw new Error("Invite role is not supported.");
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    await updateRows("club_invites", { status: "expired" }, `id=eq.${invite.id}`);
    throw new Error("Invite expired.");
  }
  if (invite.email.toLowerCase() !== ownerEmail) throw new Error("Invite email does not match this account.");

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

function authErrorUrl(request: Request, path: string, returnTo: string, error: string, inviteToken?: string) {
  const url = getRequestUrl(path, request);
  url.searchParams.set("returnTo", normalizeWorkspaceReturnTo(returnTo));
  url.searchParams.set("error", error);
  if (inviteToken) url.searchParams.set("invite", inviteToken);
  return url;
}

function initials(value: string) {
  const next = value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return next || "G";
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
