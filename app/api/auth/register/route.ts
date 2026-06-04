import { NextResponse } from "next/server";
import { setActiveClubCookie, setAuthCookies, setMockAuthCookie } from "@/lib/auth-cookies";
import { createAuthUser, signInWithPassword } from "@/lib/supabase/auth";
import { getRequestUrl } from "@/lib/request-origin";
import { insertRow, isSupabaseConfigured, upsertRow } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo } from "@/lib/workspace-intent";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isFormSubmit = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  const payload = isFormSubmit ? Object.fromEntries(await request.formData()) : await request.json();
  const returnTo = normalizeWorkspaceReturnTo(String(payload?.returnTo ?? ""));
  const academyName = String(payload?.academyName ?? "").trim();
  const ownerEmail = String(payload?.ownerEmail ?? "").trim().toLowerCase();
  const ownerName = String(payload?.ownerName ?? ownerEmail.split("@")[0] ?? "Owner").trim();
  const location = String(payload?.location ?? "").trim();
  const password = String(payload?.password ?? "demo");

  if (!academyName || !ownerEmail || !location || password.length < 6) {
    if (isFormSubmit) return NextResponse.redirect(authErrorUrl(request, "/register", returnTo, "Academy name, owner email, city, and 6+ character password are required."), 303);
    return NextResponse.json({ ok: false, error: "Academy name, owner email, city, and 6+ character password are required." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    const club = { slug: slugify(academyName), name: academyName, location };
    const destination = scopeWorkspaceReturnTo(returnTo, club.slug);
    const response = isFormSubmit
      ? NextResponse.redirect(getRequestUrl(destination, request), 303)
      : NextResponse.json({
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
    const slug = `${slugify(academyName)}-${Date.now().toString(36)}`;
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

    await Promise.all([
      upsertRow("club_settings", { club_id: club.id, key: "brand", value: { name: academyName, shortName: academyName } }, "club_id,key"),
      upsertRow("club_settings", { club_id: club.id, key: "appearance", value: { theme: "dark", accent: "purple" } }, "club_id,key"),
      upsertRow("club_settings", { club_id: club.id, key: "integrations", value: { strava: false, supabase: true } }, "club_id,key"),
    ]);

    session ??= await signInWithPassword(ownerEmail, password);
    const destination = scopeWorkspaceReturnTo(returnTo, club.slug);
    const response = isFormSubmit
      ? NextResponse.redirect(getRequestUrl(destination, request), 303)
      : NextResponse.json({ ok: true, source: "supabase", user, club, membership, redirectTo: destination });
    setAuthCookies(response, session);
    setActiveClubCookie(response, club.slug);
    return response;
  } catch (error) {
    if (isFormSubmit) return NextResponse.redirect(authErrorUrl(request, "/register", returnTo, getAuthErrorMessage(error)), 303);
    return NextResponse.json({ ok: false, source: "supabase", error: String(error) }, { status: 400 });
  }
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
  if (message.includes("already") || message.includes("registered")) return "This email is already registered. Try signing in with the same password.";
  return "Registration failed. Check the details and try again.";
}
