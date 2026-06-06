import type { PlatformRole } from "@/data/platform";
import { selectRows, updateRows, upsertRow } from "@/lib/supabase/server";
import type { TableRow } from "@/lib/supabase/types";

type MemberProfileUser = Pick<TableRow<"app_users">, "id" | "name" | "email" | "avatar_url" | "belt" | "stripes">;

export async function ensureClubMemberProfile(input: {
  clubId: string;
  clubName: string;
  user: MemberProfileUser;
  membershipRole: PlatformRole;
}) {
  const [existingLinkedProfile] = await selectRows(
    "academy_members",
    `select=*&club_id=eq.${input.clubId}&user_id=eq.${input.user.id}&limit=1`,
  );
  if (existingLinkedProfile) {
    const nextRole = getRosterRole(input.membershipRole);
    if (existingLinkedProfile.role !== nextRole) {
      const [updated] = await updateRows(
        "academy_members",
        { role: nextRole, status: "active" },
        `id=eq.${encodeURIComponent(existingLinkedProfile.id)}&club_id=eq.${input.clubId}`,
      );
      return updated ?? existingLinkedProfile;
    }
    return existingLinkedProfile;
  }

  const profileId = getGeneratedMemberId(input.clubId, input.user.id);
  const profile = await upsertRow(
    "academy_members",
    {
      id: profileId,
      club_id: input.clubId,
      user_id: input.user.id,
      name: input.user.name,
      belt: input.user.belt ?? "white",
      stripes: clampStripes(input.user.stripes),
      role: getRosterRole(input.membershipRole),
      status: "active",
      total_hours: 0,
      classes_30: 0,
      streak: 0,
      points: 0,
      wins: 0,
      losses: 0,
      last_seen: "New member",
      focus: input.membershipRole === "member" ? "Onboarding" : "Academy operations",
      avatar_url: input.user.avatar_url,
      profile: {
        roleLabel: getRosterRoleLabel(input.membershipRole),
        source: "invite",
        clubName: input.clubName,
        email: input.user.email,
      },
    },
    "id",
  );

  return profile;
}

function getRosterRole(role: PlatformRole): "member" | "coach" {
  return role === "member" ? "member" : "coach";
}

function getRosterRoleLabel(role: PlatformRole) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  if (role === "coach") return "Coach";
  return "Member";
}

function clampStripes(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(4, Math.trunc(value)));
}

function getGeneratedMemberId(clubId: string, userId: string) {
  return `usr-${clubId.slice(0, 8)}-${userId.slice(0, 8)}`.toLowerCase();
}
