import { competitions, type Competition } from "@/data/competitions";
import { trainingCamps, type TrainingCamp } from "@/data/training-camps";
import { trainingPosts, type TrainingPost } from "@/data/training-feed";
import { getClubRoster } from "@/data/platform";
import { getMockClubId } from "@/lib/backend";

export function getMockCompetitionsForClub(clubSlug: string): Competition[] {
  const clubId = getMockClubId(clubSlug);
  if (clubId === "club-alpine") {
    return competitions.filter((event) => ["ibjjf-zurich-open", "alps-grappling-cup", "european-masters"].includes(event.id));
  }
  if (clubId === "club-harbor") {
    return competitions.filter((event) => ["ibjjf-la-open", "alps-grappling-cup"].includes(event.id));
  }
  return competitions;
}

export function getMockTrainingCampsForClub(clubSlug: string): TrainingCamp[] {
  const clubId = getMockClubId(clubSlug);
  if (clubId === "club-alpine") {
    return trainingCamps.filter((camp) => ["mountain-gi-retreat", "berimbolo-lab-lisbon", "nogi-radar-camp"].includes(camp.id));
  }
  if (clubId === "club-harbor") {
    return trainingCamps.filter((camp) => ["nogi-radar-camp", "aoj-summer-immersion"].includes(camp.id));
  }
  return trainingCamps;
}

export function getMockTrainingPostsForClub(clubSlug: string): TrainingPost[] {
  const clubId = getMockClubId(clubSlug);
  if (clubId === "club-grapply") return trainingPosts;

  const rosterNames = new Set(getClubRoster(clubId).map((member) => member.name));
  return trainingPosts.filter((post) => {
    if (post.taggedStudents?.length) return post.taggedStudents.some((student) => rosterNames.has(student));
    return rosterNames.has(post.coach);
  });
}
