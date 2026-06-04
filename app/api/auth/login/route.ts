import { NextResponse } from "next/server";
import { setAuthCookies, setMockAuthCookie } from "@/lib/auth-cookies";
import { clubMemberships, clubs, getDemoSafeRole, platformUsers } from "@/data/platform";
import { createAuthUser, signInWithPassword } from "@/lib/supabase/auth";
import { getRequestUrl } from "@/lib/request-origin";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";
import { getRoleSafeWorkspaceReturnTo, normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo } from "@/lib/workspace-intent";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isFormSubmit = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  const payload = isFormSubmit ? Object.fromEntries(await request.formData()) : await request.json();
  const returnTo = isFormSubmit ? normalizeWorkspaceReturnTo(String(payload.returnTo ?? "")) : null;
  const email = String(payload?.email ?? "").trim().toLowerCase();
  const password = String(payload?.password ?? "");

  if (!email || !password) {
    if (isFormSubmit) return NextResponse.redirect(authErrorUrl(request, "/login", returnTo ?? "/schedule", "Email and password are required."), 303);
    return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const users = await selectRows("app_users", `select=*&email=eq.${encodeURIComponent(email)}&limit=1`);
      const user = users[0];

      if (!user) {
        if (isFormSubmit) return NextResponse.redirect(authErrorUrl(request, "/login", returnTo ?? "/schedule", "No account found for that email."), 303);
        return NextResponse.json({ ok: false, source: "supabase", error: "User not found." }, { status: 404 });
      }

      let session;
      try {
        session = await signInWithPassword(email, password);
      } catch (error) {
        if (password !== "demo123") throw error;
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

      const redirectTo = returnTo ? await getSupabasePostAuthDestination(user.id, returnTo) : null;
      const response = redirectTo
        ? NextResponse.redirect(getRequestUrl(redirectTo, request), 303)
        : NextResponse.json({
            ok: true,
            source: "supabase",
            user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar_url },
            ...(redirectTo ? { redirectTo } : {}),
          });
      setAuthCookies(response, session);
      return response;
    } catch (error) {
      const mockUser = platformUsers.find((candidate) => candidate.email.toLowerCase() === email);
      if (mockUser && password === "demo123") {
        return createMockLoginResponse(request, mockUser, returnTo);
      }
      if (isFormSubmit) return NextResponse.redirect(authErrorUrl(request, "/login", returnTo ?? "/schedule", getAuthErrorMessage(error)), 303);
      return NextResponse.json({ ok: false, source: "supabase", error: String(error) }, { status: 400 });
    }
  }

  const user = platformUsers.find((candidate) => candidate.email.toLowerCase() === email);
  if (!user) {
    if (isFormSubmit) return NextResponse.redirect(authErrorUrl(request, "/login", returnTo ?? "/schedule", "No account found for that email."), 303);
    return NextResponse.json({ ok: false, source: "mock", error: "User not found." }, { status: 404 });
  }
  return createMockLoginResponse(request, user, returnTo);
}

function createMockLoginResponse(request: Request, user: (typeof platformUsers)[number], returnTo: string | null) {
  const redirectTo = returnTo ? getMockPostAuthDestination(user.id, returnTo) : null;
  const response = redirectTo
    ? NextResponse.redirect(getRequestUrl(redirectTo, request), 303)
    : NextResponse.json({ ok: true, source: "mock", user });
  setMockAuthCookie(response, user.id);
  return response;
}

async function getSupabasePostAuthDestination(userId: string, returnTo: string) {
  const memberships = await selectRows("club_memberships", `select=*&user_id=eq.${userId}`);
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
  if (userMemberships.length !== 1) return clubsPath(returnTo);

  const membership = userMemberships[0];
  const safeReturnTo = getRoleSafeWorkspaceReturnTo(returnTo, membership.role);
  return scopeWorkspaceReturnTo(safeReturnTo, membership.club.slug);
}

function clubsPath(returnTo: string) {
  return `/clubs?returnTo=${encodeURIComponent(normalizeWorkspaceReturnTo(returnTo))}`;
}

function authErrorUrl(request: Request, path: string, returnTo: string, error: string) {
  const url = getRequestUrl(path, request);
  url.searchParams.set("returnTo", normalizeWorkspaceReturnTo(returnTo));
  url.searchParams.set("error", error);
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
