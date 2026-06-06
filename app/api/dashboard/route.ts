import { apiSupabaseError, requireApiAccess } from "@/lib/api-access";
import { noStoreJson } from "@/lib/api-json";
import { getBackendClubId } from "@/lib/backend";
import { getDashboardData } from "@/lib/backend-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiAccess(searchParams.get("club"));
  if (access.error) return access.error;
  const clubSlug = access.session.activeClub.slug;
  let clubId: string | null = null;

  try {
    clubId = await getBackendClubId(clubSlug);
    const dashboard = await getDashboardData(clubSlug, {
      userId: access.session.user.id,
      userEmail: access.session.user.email,
      role: access.session.activeRole,
    });
    return noStoreJson({ source: clubId ? "supabase" : "mock", ...dashboard });
  } catch (error) {
    return apiSupabaseError(error, { clubId });
  }
}
