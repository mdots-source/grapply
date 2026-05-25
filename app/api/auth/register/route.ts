import { NextResponse } from "next/server";
import { setActiveClubCookie, setAuthCookies } from "@/lib/auth-cookies";
import { createAuthUser, signInWithPassword } from "@/lib/supabase/auth";
import { insertRow, isSupabaseConfigured, upsertRow } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export async function POST(request: Request) {
  const payload = await request.json();
  const academyName = String(payload?.academyName ?? "").trim();
  const ownerEmail = String(payload?.ownerEmail ?? "").trim().toLowerCase();
  const ownerName = String(payload?.ownerName ?? ownerEmail.split("@")[0] ?? "Owner").trim();
  const location = String(payload?.location ?? "").trim();
  const password = String(payload?.password ?? "demo");

  if (!academyName || !ownerEmail || !location || password.length < 6) {
    return NextResponse.json({ ok: false, error: "Academy name, owner email, city, and 6+ character password are required." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      source: "mock",
      user: { id: "usr-empty", name: ownerName, email: ownerEmail },
      club: { slug: slugify(academyName), name: academyName, location },
    });
  }

  try {
    const slug = `${slugify(academyName)}-${Date.now().toString(36)}`;
    const authUser = await createAuthUser({ email: ownerEmail, password, name: ownerName });

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

    const session = await signInWithPassword(ownerEmail, password);
    const response = NextResponse.json({ ok: true, source: "supabase", user, club, membership });
    setAuthCookies(response, session);
    setActiveClubCookie(response, club.slug);
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, source: "supabase", error: String(error) }, { status: 400 });
  }
}
