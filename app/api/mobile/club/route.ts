import { setActiveClubCookie } from "@/lib/auth-cookies";
import { noStoreJson, readJsonObject } from "@/lib/api-json";
import { getCurrentSessionWithRefresh } from "@/lib/auth-session";

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const clubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug.trim() : "";
  const { session } = await getCurrentSessionWithRefresh();

  if (!session) return noStoreJson({ ok: false, error: "Login required." }, { status: 401 });
  if (!clubSlug) return noStoreJson({ ok: false, error: "Club is required." }, { status: 400 });

  const membership = session.memberships.find((item) => item.club.slug === clubSlug);
  if (!membership) return noStoreJson({ ok: false, error: "Club access denied." }, { status: 403 });

  const response = noStoreJson({
    ok: true,
    activeClub: membership.club,
    activeRole: membership.role,
  });
  setActiveClubCookie(response, membership.club.slug);
  return response;
}
