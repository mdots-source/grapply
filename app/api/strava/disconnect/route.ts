import { apiSupabaseError, requireApiAccess, requireSupabasePersistence } from "@/lib/api-access";
import { noStoreJson, readJsonObject } from "@/lib/api-json";
import { getBackendClubId } from "@/lib/backend";
import { deleteRows, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  return disconnectStrava(request);
}

export async function DELETE(request: Request) {
  return disconnectStrava(request);
}

async function disconnectStrava(request: Request) {
  const url = new URL(request.url);
  const payload = request.method === "POST" ? await readJsonObject(request) : {};
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : url.searchParams.get("club");
  const access = await requireApiAccess(requestedClubSlug);
  if (access.error) return access.error;

  if (!isSupabaseConfigured()) {
    const persistenceError = requireSupabasePersistence("Strava connections");
    if (persistenceError) return persistenceError;

    return noStoreJson({ ok: true, source: "mock", status: "not_connected" });
  }

  let clubId: string | null = null;
  try {
    if (!isUuid(access.session.user.id)) {
      const persistenceError = requireSupabasePersistence("Strava connections");
      if (persistenceError) return persistenceError;

      return noStoreJson({ ok: true, source: "mock", status: "not_connected" });
    }

    clubId = await getBackendClubId(access.session.activeClub.slug);
    if (!clubId) {
      return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
    }

    const [removedConnections, removedActivities] = await Promise.all([
      deleteRows("strava_connections", `user_id=eq.${access.session.user.id}&club_id=eq.${clubId}`),
      deleteRows("strava_activities", `user_id=eq.${access.session.user.id}&club_id=eq.${clubId}`),
    ]);

    return noStoreJson({
      ok: true,
      source: "supabase",
      status: "not_connected",
      removedConnections: removedConnections.length,
      removedActivities: removedActivities.length,
    });
  } catch (error) {
    return apiSupabaseError(error, { clubId });
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
