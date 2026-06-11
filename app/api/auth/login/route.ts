import { NextResponse } from "next/server";
import { setActiveClubCookie, setAuthCookies, setMockAuthCookie } from "@/lib/auth-cookies";
import { recordAuthFailure } from "@/lib/auth-observability";
import { isMockAuthFallbackAllowed, isProductionRuntime } from "@/lib/auth-mode";
import { clubMemberships, clubs, getDemoSafeRole, platformUsers } from "@/data/platform";
import { createAuthUser, signInWithPassword } from "@/lib/supabase/auth";
import { noStoreJson, readJsonObject } from "@/lib/api-json";
import { getAuthEmailError, normalizeAuthEmail } from "@/lib/auth-validation";
import { getRequestUrl } from "@/lib/request-origin";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";
import { getRoleSafeWorkspaceReturnTo, normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo, splitOrganizationWorkspacePath } from "@/lib/workspace-intent";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isFormSubmit = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  const payload = isFormSubmit ? Object.fromEntries(await request.formData()) : await readJsonObject(request);
  const returnTo = normalizeLoginReturnTo(String(payload.returnTo ?? ""));
  const email = normalizeAuthEmail(payload?.email);
  const password = String(payload?.password ?? "");
  const inviteToken = String(payload?.inviteToken ?? "").trim();

  const emailError = getAuthEmailError(email);
  if (emailError || !password) {
    const error = emailError ?? "Password is required.";
    if (isFormSubmit) return noStoreRedirect(authErrorUrl(request, "/login", returnTo ?? "/schedule", error, inviteToken), 303);
    return noStoreJson({ ok: false, error }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const users = await selectRows("app_users", `select=*&email=eq.${encodeURIComponent(email)}&limit=1`);
      const user = users[0];

      if (!user) {
        if (isFormSubmit) return noStoreRedirect(authErrorUrl(request, "/login", returnTo ?? "/schedule", "No account found for that email."), 303);
        return noStoreJson({ ok: false, source: "supabase", error: "User not found." }, { status: 404 });
      }

      let session;
      try {
        session = await signInWithPassword(email, password);
      } catch (error) {
        if (password !== "demo123" || !isMockAuthFallbackAllowed()) throw error;
        const authUser = await createAuthUser({ email, password, name: user.name });
        session = await signInWithPassword(email, password);
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/app_users?id=eq.${user.id}`, {
          method: "PATCH",
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ auth_user_id: authUser.id }),
        }).catch(() => {});
      }

      const redirectTo = inviteToken
        ? `/api/invites/accept?invite=${encodeURIComponent(inviteToken)}&returnTo=${encodeURIComponent(returnTo)}`
        : returnTo ? await getSupabasePostAuthDestination(user.id, returnTo) : null;
      const response = isFormSubmit && redirectTo
        ? noStoreRedirect(getRequestUrl(redirectTo, request), 303)
        : noStoreJson({
            ok: true,
            source: "supabase",
            user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar_url },
            ...(redirectTo ? { redirectTo } : {}),
          });
      setAuthCookies(response, session);
      setDestinationActiveClubCookie(response, redirectTo);
      return response;
    } catch (error) {
      const mockUser = platformUsers.find((candidate) => candidate.email.toLowerCase() === email);
      if (isMockAuthFallbackAllowed() && mockUser && password === "demo123") {
        return createMockLoginResponse(request, mockUser, returnTo, isFormSubmit);
      }
      if (isFormSubmit) return noStoreRedirect(authErrorUrl(request, "/login", returnTo ?? "/schedule", getAuthErrorMessage(error), inviteToken), 303);
      return authFailureJson(error, "Login failed. Check your email and password.", 400);
    }
  }

  if (!isMockAuthFallbackAllowed()) {
    const error = "Supabase backend is not configured on this deployment. Add SUPABASE_SERVICE_ROLE_KEY before accepting real logins.";
    if (isFormSubmit) return noStoreRedirect(authErrorUrl(request, "/login", returnTo ?? "/schedule", error), 303);
    return noStoreJson({ ok: false, source: "supabase", error }, { status: 500 });
  }

  const user = platformUsers.find((candidate) => candidate.email.toLowerCase() === email);
  if (!user) {
    if (isFormSubmit) return noStoreRedirect(authErrorUrl(request, "/login", returnTo ?? "/schedule", "No account found for that email."), 303);
    return noStoreJson({ ok: false, source: "mock", error: "User not found." }, { status: 404 });
  }
  return createMockLoginResponse(request, user, returnTo, isFormSubmit);
}

function createMockLoginResponse(request: Request, user: (typeof platformUsers)[number], returnTo: string | null, isFormSubmit: boolean) {
  const redirectTo = returnTo ? getMockPostAuthDestination(user.id, returnTo) : null;
  const response = isFormSubmit && redirectTo
    ? noStoreRedirect(getRequestUrl(redirectTo, request), 303)
    : noStoreJson({ ok: true, source: "mock", user, ...(redirectTo ? { redirectTo } : {}) });
  setMockAuthCookie(response, user.id);
  setDestinationActiveClubCookie(response, redirectTo);
  return response;
}

function authFailureJson(error: unknown, fallback: string, status = 400) {
  const requestId = crypto.randomUUID();
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[grapply:auth:${requestId}]`, message);
  recordAuthFailure({ requestId, message, status, action: "login" });
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

function setDestinationActiveClubCookie(response: NextResponse, destination: string | null) {
  if (!destination) return;
  const route = splitOrganizationWorkspacePath(new URL(destination, "https://grapply.local").pathname);
  if (route?.organizationId) setActiveClubCookie(response, route.organizationId);
}

async function getSupabasePostAuthDestination(userId: string, returnTo: string) {
  const memberships = await selectRows("club_memberships", `select=*&user_id=eq.${userId}`);
  const requestedWorkspace = getRequestedWorkspace(returnTo);
  if (requestedWorkspace) {
    const clubRows = await selectRows("clubs", `select=*&slug=eq.${encodeURIComponent(requestedWorkspace.organizationId)}&limit=1`);
    const club = clubRows[0];
    const membership = club ? memberships.find((item) => item.club_id === club.id) : null;
    if (!club || !membership) return clubsPath(requestedWorkspace.workspaceReturnTo);

    const safeReturnTo = getRoleSafeWorkspaceReturnTo(requestedWorkspace.workspaceReturnTo, membership.role);
    return scopeWorkspaceReturnTo(safeReturnTo, club.slug);
  }

  if (memberships.length !== 1) {
    return clubsPath(returnTo);
  }

  const membership = memberships[0];
  const clubs = await selectRows("clubs", `select=*&id=eq.${membership.club_id}&limit=1`);
  const club = clubs[0];
  if (!club) return clubsPath(returnTo);

  const safeReturnTo = getRoleSafeWorkspaceReturnTo(returnTo, membership.role);
  return scopeWorkspaceReturnTo(safeReturnTo, club.slug);
}

function getMockPostAuthDestination(userId: string, returnTo: string) {
  const userMemberships = requireMockMemberships(userId);
  const requestedWorkspace = getRequestedWorkspace(returnTo);
  if (requestedWorkspace) {
    const membership = userMemberships.find((item) => item.club.slug === requestedWorkspace.organizationId);
    if (!membership) return clubsPath(requestedWorkspace.workspaceReturnTo);

    const safeReturnTo = getRoleSafeWorkspaceReturnTo(requestedWorkspace.workspaceReturnTo, membership.role);
    return scopeWorkspaceReturnTo(safeReturnTo, membership.club.slug);
  }

  if (userMemberships.length !== 1) return clubsPath(returnTo);

  const membership = userMemberships[0];
  const safeReturnTo = getRoleSafeWorkspaceReturnTo(returnTo, membership.role);
  return scopeWorkspaceReturnTo(safeReturnTo, membership.club.slug);
}

function clubsPath(returnTo: string) {
  return `/clubs?returnTo=${encodeURIComponent(normalizeWorkspaceReturnTo(returnTo))}`;
}

function normalizeLoginReturnTo(rawReturnTo: string) {
  const normalizedReturnTo = normalizeWorkspaceReturnTo(rawReturnTo);
  const requestedWorkspace = getRequestedWorkspace(rawReturnTo);
  return requestedWorkspace ? scopeWorkspaceReturnTo(normalizedReturnTo, requestedWorkspace.organizationId) : normalizedReturnTo;
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

function authErrorUrl(request: Request, path: string, returnTo: string, error: string, inviteToken?: string) {
  const url = getRequestUrl(path, request);
  url.searchParams.set("returnTo", normalizeLoginReturnTo(returnTo));
  url.searchParams.set("error", error);
  if (inviteToken) url.searchParams.set("invite", inviteToken);
  return url;
}

function getAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Cannot reach Supabase")) return "Grapply cannot reach Supabase right now. Check the Supabase project URL, DNS, and project status.";
  if (message.includes("Invalid login credentials")) return "Wrong email or password.";
  return "Sign in failed. Check your email and password.";
}

function requireMockMemberships(userId: string) {
  return clubMemberships
    .filter((membership) => membership.userId === userId)
    .map((membership) => {
      const club = clubs.find((candidate) => candidate.id === membership.clubId);
      const user = platformUsers.find((candidate) => candidate.id === userId);
      if (!club || !user) return null;
      return { ...membership, role: getDemoSafeRole(user.email, club.slug, membership.role), club };
    })
    .filter((membership): membership is NonNullable<typeof membership> => Boolean(membership));
}
