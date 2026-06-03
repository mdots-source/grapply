import { NextResponse } from "next/server";
import { clubMemberships, roleDefinitions } from "@/data/platform";
import { requireApiRole } from "@/lib/api-access";
import { deleteRows, insertRow, isSupabaseConfigured, selectRows } from "@/lib/supabase/server";

function isUuid(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

export async function GET() {
  const access = await requireApiRole(["owner", "admin"]);
  if (access.error) return access.error;

  if (isSupabaseConfigured()) {
    try {
      const [roles, memberships, classes] = await Promise.all([
        selectRows("role_definitions"),
        selectRows("club_memberships"),
        selectRows("club_classes"),
      ]);

      return NextResponse.json({ source: "supabase", roles, memberships, classes });
    } catch (error) {
      return NextResponse.json({ source: "mock", roles: roleDefinitions, memberships: clubMemberships, supabaseError: String(error) });
    }
  }

  return NextResponse.json({
    source: "mock",
    roles: roleDefinitions,
    memberships: clubMemberships,
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const access = await requireApiRole(["owner", "admin"], payload.clubSlug);
  if (access.error) return access.error;

  if (isSupabaseConfigured() && payload?.club_id && payload?.user_id && payload?.role) {
    try {
      const membership = await insertRow("club_memberships", {
        club_id: payload.club_id,
        user_id: payload.user_id,
        role: payload.role,
        invited_by: payload.invited_by ?? null,
      });

      return NextResponse.json({ ok: true, source: "supabase", membership });
    } catch (error) {
      return NextResponse.json({ ok: false, source: "supabase", error: String(error) }, { status: 400 });
    }
  }

  return NextResponse.json({
    ok: true,
    source: "mock",
    message: "Mock role update accepted. Persist this through the production database adapter later.",
    payload,
  });
}

export async function DELETE(request: Request) {
  const payload = await request.json();
  const access = await requireApiRole(["owner", "admin"], payload.clubSlug);
  if (access.error) return access.error;

  if (!payload?.membershipId) {
    return NextResponse.json({ ok: false, error: "Missing membership id." }, { status: 400 });
  }

  const mockMembership = clubMemberships.find((membership) => membership.id === payload.membershipId);
  if (mockMembership?.role === "owner") {
    return NextResponse.json({ ok: false, error: "Owner access cannot be removed from this screen." }, { status: 400 });
  }

  if (!isUuid(payload.membershipId)) {
    return NextResponse.json({ ok: true, source: "mock", membershipId: payload.membershipId });
  }

  if (isSupabaseConfigured()) {
    try {
      const removed = await deleteRows("club_memberships", `id=eq.${encodeURIComponent(payload.membershipId)}`);
      return NextResponse.json({ ok: true, source: "supabase", removed });
    } catch (error) {
      return NextResponse.json({ ok: false, source: "supabase", error: String(error) }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, source: "mock", membershipId: payload.membershipId });
}
