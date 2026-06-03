import { cookies } from "next/headers";
import { clubs } from "@/data/platform";
import { authCookieNames } from "@/lib/auth-cookies";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";

export const defaultClubSlug = "grapply-bjj";

export async function getBackendClubId(slug?: string | null) {
  if (!isSupabaseConfigured()) return null;

  const clubSlug = await getRequestedClubSlug(slug);
  const rows = await selectRows("clubs", `select=id&slug=eq.${encodeURIComponent(clubSlug)}&limit=1`);
  return rows[0]?.id ?? null;
}

export async function getRequestedClubSlug(slug?: string | null) {
  const cookieStore = await cookies().catch(() => null);
  return slug ?? cookieStore?.get(authCookieNames.activeClub)?.value ?? defaultClubSlug;
}

export function getMockClubId(slug?: string | null) {
  const clubSlug = slug ?? defaultClubSlug;
  return clubs.find((club) => club.slug === clubSlug)?.id ?? clubs[0].id;
}
