import { competitions, type Competition } from "@/data/competitions";
import { trainingCamps, type TrainingCamp } from "@/data/training-camps";
import { trainingPosts, type TrainingPost } from "@/data/training-feed";
import { getClubRoster } from "@/data/platform";
import { getMockClubId } from "@/lib/backend";

type MockViewer = {
  role: string;
  userName: string;
};

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

export function getVisibleMockCompetitionsForClub(clubSlug: string, viewer: MockViewer): Competition[] {
  const clubCompetitions = getMockCompetitionsForClub(clubSlug);
  const readable = getMockReadableRosterForViewer(clubSlug, viewer);
  if (readable.scope === "all") return clubCompetitions;

  return clubCompetitions
    .filter((event) => event.registered_students.length === 0 || event.registered_students.some((id) => readable.memberIds.has(id)))
    .map((event) => ({
      ...event,
      registered_students: event.registered_students.filter((id) => readable.memberIds.has(id)),
    }));
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

export function getVisibleMockTrainingCampsForClub(clubSlug: string, viewer: MockViewer): TrainingCamp[] {
  const clubCamps = getMockTrainingCampsForClub(clubSlug);
  const readable = getMockReadableRosterForViewer(clubSlug, viewer);
  if (readable.scope === "all") return clubCamps;

  return clubCamps
    .filter((camp) => camp.registered_students.length === 0 || camp.registered_students.some((id) => readable.memberIds.has(id)))
    .map((camp) => ({
      ...camp,
      registered_students: camp.registered_students.filter((id) => readable.memberIds.has(id)),
    }));
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

export function getVisibleMockTrainingPostsForClub(clubSlug: string, viewer: MockViewer): TrainingPost[] {
  const clubPosts = getMockTrainingPostsForClub(clubSlug);
  const readable = getMockReadableRosterForViewer(clubSlug, viewer);
  if (readable.scope === "all") return clubPosts;

  if (!readable.memberNames.size) {
    return clubPosts
      .filter((post) => !post.taggedStudents?.length)
      .map((post) => ({ ...post, taggedStudents: [], topParticipant: undefined }));
  }

  return clubPosts
    .filter((post) => !post.taggedStudents?.length || post.taggedStudents.some((name) => readable.memberNames.has(name)))
    .map((post) => {
      const taggedStudents = (post.taggedStudents ?? []).filter((name) => readable.memberNames.has(name));
      return {
        ...post,
        taggedStudents,
        topParticipant: post.topParticipant && readable.memberNames.has(post.topParticipant.name) ? post.topParticipant : undefined,
      };
    });
}

function getMockReadableRosterForViewer(clubSlug: string, viewer: MockViewer) {
  if (viewer.role === "owner" || viewer.role === "admin" || viewer.role === "coach") {
    return { scope: "all" as const };
  }

  const roster = getClubRoster(getMockClubId(clubSlug)).filter((member) => member.name === viewer.userName);
  return {
    scope: "own" as const,
    memberIds: new Set(roster.map((member) => member.id)),
    memberNames: new Set(roster.map((member) => member.name)),
  };
}
