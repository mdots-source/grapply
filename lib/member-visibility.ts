import type { PlatformRole } from "@/data/platform";
import { noStoreJson } from "@/lib/api-json";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isStaffRole(role: PlatformRole | string | null | undefined) {
  return role === "owner" || role === "admin" || role === "coach";
}

export async function getReadableMemberIds({
  clubId,
  requestedMemberId,
  userId,
  userEmail,
  role,
}: {
  clubId: string;
  requestedMemberId?: string | null;
  userId: string;
  userEmail?: string | null;
  role: PlatformRole | string;
}): Promise<
  | { scope: "all"; memberIds?: never; empty?: never; error?: never }
  | { scope: "own"; memberIds: string[]; empty?: never; error?: never }
  | { empty: true; scope?: never; memberIds?: never; error?: never }
  | { error: Response; scope?: never; memberIds?: never; empty?: never }
> {
  if (isStaffRole(role)) return { scope: "all" };

  const appUserId = await resolveAppUserId(userId, userEmail);
  if (!appUserId) {
    return requestedMemberId
      ? { error: noStoreJson({ ok: false, error: "You can only access your own member profile." }, { status: 403 }) }
      : { empty: true };
  }

  const rows = await selectRows("academy_members", `select=id&club_id=eq.${clubId}&user_id=eq.${appUserId}`);
  const memberIds = rows.map((row) => row.id);
  if (!memberIds.length) return { empty: true };

  if (requestedMemberId && !memberIds.includes(requestedMemberId)) {
    return { error: noStoreJson({ ok: false, error: "You can only access your own member profile." }, { status: 403 }) };
  }

  return { scope: "own", memberIds: requestedMemberId ? [requestedMemberId] : memberIds };
}

export async function canReadMember(input: {
  clubId: string;
  memberId: string;
  userId: string;
  userEmail?: string | null;
  role: PlatformRole | string;
}) {
  const readable = await getReadableMemberIds({ ...input, requestedMemberId: input.memberId });
  if ("error" in readable && readable.error) return false;
  if ("empty" in readable && readable.empty) return false;
  if (readable.scope === "all") return true;
  return readable.memberIds.includes(input.memberId);
}

async function resolveAppUserId(userId: string, userEmail?: string | null) {
  if (uuidPattern.test(userId)) return userId;
  if (!isSupabaseConfigured() || !userEmail) return null;
  const [user] = await selectRows("app_users", `select=id&email=eq.${encodeURIComponent(userEmail)}&limit=1`);
  return user?.id ?? null;
}
