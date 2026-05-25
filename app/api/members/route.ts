import { NextResponse } from "next/server";
import { compareMemberHierarchy, students, type Student } from "@/data/academy";
import { clubs } from "@/data/platform";
import { getBackendClubId } from "@/lib/backend";
import { isSupabaseConfigured, selectRows, upsertRow } from "@/lib/supabase/server";
import { toAcademyMemberInsert, toStudent } from "@/lib/supabase/mappers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clubSlug = searchParams.get("club") ?? "grapply-bjj";

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(clubSlug);
      if (!clubId) return NextResponse.json({ source: "supabase", members: [] });

      const rows = await selectRows(
        "academy_members",
        `select=*&club_id=eq.${clubId}&order=role.asc,belt.desc,stripes.desc,name.asc`,
      );

      return NextResponse.json({
        source: "supabase",
        members: rows.map(toStudent).sort(compareMemberHierarchy),
      });
    } catch (error) {
      return NextResponse.json({
        source: "mock",
        members: students,
        supabaseError: String(error),
      });
    }
  }

  return NextResponse.json({ source: "mock", members: students });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<Student> & { clubSlug?: string };

  if (!payload.name || !payload.belt) {
    return NextResponse.json({ ok: false, error: "Missing member name or belt." }, { status: 400 });
  }

  const member: Student = {
    id: payload.id ?? `st-${Date.now()}`,
    name: payload.name,
    belt: payload.belt,
    stripes: payload.stripes ?? 0,
    role: payload.role ?? "member",
    status: payload.status ?? "active",
    totalHours: payload.totalHours ?? 0,
    classes30: payload.classes30 ?? 0,
    streak: payload.streak ?? 0,
    points: payload.points ?? 0,
    wins: payload.wins ?? 0,
    losses: payload.losses ?? 0,
    lastSeen: payload.lastSeen ?? "New member",
    focus: payload.focus ?? "Onboarding",
    avatar: payload.avatar,
  };

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(payload.clubSlug ?? clubs[0].slug);
      if (!clubId) return NextResponse.json({ ok: false, error: "Club not found." }, { status: 404 });

      const created = await upsertRow("academy_members", toAcademyMemberInsert(member, clubId), "id");
      return NextResponse.json({ ok: true, source: "supabase", member: toStudent(created) });
    } catch (error) {
      return NextResponse.json({ ok: false, source: "supabase", error: String(error) }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", member });
}
