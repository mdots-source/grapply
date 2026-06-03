import { NextResponse } from "next/server";
import { setAuthCookies, setMockAuthCookie } from "@/lib/auth-cookies";
import { platformUsers } from "@/data/platform";
import { createAuthUser, signInWithPassword } from "@/lib/supabase/auth";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";
import { normalizeWorkspaceReturnTo } from "@/lib/workspace-intent";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isFormSubmit = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  const payload = isFormSubmit ? Object.fromEntries(await request.formData()) : await request.json();
  const returnTo = isFormSubmit ? normalizeWorkspaceReturnTo(String(payload.returnTo ?? "")) : null;
  const email = String(payload?.email ?? "").trim().toLowerCase();
  const password = String(payload?.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const users = await selectRows("app_users", `select=*&email=eq.${encodeURIComponent(email)}&limit=1`);
      const user = users[0];

      if (!user) {
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

      const response = returnTo
        ? NextResponse.redirect(clubsUrl(request, returnTo))
        : NextResponse.json({
            ok: true,
            source: "supabase",
            user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar_url },
          });
      setAuthCookies(response, session);
      return response;
    } catch (error) {
      const mockUser = platformUsers.find((candidate) => candidate.email.toLowerCase() === email);
      if (mockUser && password === "demo123") {
        return createMockLoginResponse(request, mockUser, returnTo);
      }
      return NextResponse.json({ ok: false, source: "supabase", error: String(error) }, { status: 400 });
    }
  }

  const user = platformUsers.find((candidate) => candidate.email.toLowerCase() === email);
  if (!user) return NextResponse.json({ ok: false, source: "mock", error: "User not found." }, { status: 404 });
  return createMockLoginResponse(request, user, returnTo);
}

function createMockLoginResponse(request: Request, user: (typeof platformUsers)[number], returnTo: string | null) {
  const response = returnTo
    ? NextResponse.redirect(clubsUrl(request, returnTo))
    : NextResponse.json({ ok: true, source: "mock", user });
  setMockAuthCookie(response, user.id);
  return response;
}

function clubsUrl(request: Request, returnTo: string) {
  const url = new URL("/clubs", request.url);
  url.searchParams.set("returnTo", normalizeWorkspaceReturnTo(returnTo));
  return url;
}
