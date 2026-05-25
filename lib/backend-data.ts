import { competitions } from "@/data/competitions";
import { trainingCamps } from "@/data/training-camps";
import { trainingPosts } from "@/data/training-feed";
import { getBackendClubId } from "@/lib/backend";
import { toCompetition, toTrainingCamp, toTrainingPost } from "@/lib/supabase/mappers";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";

export async function getCompetitionsData() {
  if (!isSupabaseConfigured()) return competitions;
  try {
    const clubId = await getBackendClubId();
    if (!clubId) return [];
    const rows = await selectRows("competitions", `select=*&club_id=eq.${clubId}&order=prep.desc`);
    return rows.map(toCompetition);
  } catch {
    return competitions;
  }
}

export async function getTrainingCampsData() {
  if (!isSupabaseConfigured()) return trainingCamps;
  try {
    const clubId = await getBackendClubId();
    if (!clubId) return [];
    const rows = await selectRows("training_camps", `select=*&club_id=eq.${clubId}&order=prep.desc`);
    return rows.map(toTrainingCamp);
  } catch {
    return trainingCamps;
  }
}

export async function getTrainingPostsData() {
  if (!isSupabaseConfigured()) return trainingPosts;
  try {
    const clubId = await getBackendClubId();
    if (!clubId) return [];
    const rows = await selectRows("training_posts", `select=*&club_id=eq.${clubId}&order=pinned.desc,heat.desc`);
    return rows.map(toTrainingPost);
  } catch {
    return trainingPosts;
  }
}
