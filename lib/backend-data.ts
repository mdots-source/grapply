import { getBackendClubId, getRequestedClubSlug } from "@/lib/backend";
import { getMockCompetitionsForClub, getMockTrainingCampsForClub, getMockTrainingPostsForClub } from "@/lib/mock-club-content";
import { toCompetition, toTrainingCamp, toTrainingPost } from "@/lib/supabase/mappers";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";

export async function getCompetitionsData() {
  const clubSlug = await getRequestedClubSlug();
  if (!isSupabaseConfigured()) return getMockCompetitionsForClub(clubSlug);
  try {
    const clubId = await getBackendClubId(clubSlug);
    if (!clubId) return [];
    const rows = await selectRows("competitions", `select=*&club_id=eq.${clubId}&order=prep.desc`);
    return rows.map(toCompetition);
  } catch {
    return getMockCompetitionsForClub(clubSlug);
  }
}

export async function getTrainingCampsData() {
  const clubSlug = await getRequestedClubSlug();
  if (!isSupabaseConfigured()) return getMockTrainingCampsForClub(clubSlug);
  try {
    const clubId = await getBackendClubId(clubSlug);
    if (!clubId) return [];
    const rows = await selectRows("training_camps", `select=*&club_id=eq.${clubId}&order=prep.desc`);
    return rows.map(toTrainingCamp);
  } catch {
    return getMockTrainingCampsForClub(clubSlug);
  }
}

export async function getTrainingPostsData() {
  const clubSlug = await getRequestedClubSlug();
  if (!isSupabaseConfigured()) return getMockTrainingPostsForClub(clubSlug);
  try {
    const clubId = await getBackendClubId(clubSlug);
    if (!clubId) return [];
    const rows = await selectRows("training_posts", `select=*&club_id=eq.${clubId}&order=pinned.desc,heat.desc`);
    return rows.map(toTrainingPost);
  } catch {
    return getMockTrainingPostsForClub(clubSlug);
  }
}
