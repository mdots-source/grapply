import { getBackendClubId, getMockClubId, getRequestedClubSlug } from "@/lib/backend";
import { academyMeta } from "@/data/academy-meta";
import { compareMemberHierarchy, type Student } from "@/data/academy";
import { dashboardStats } from "@/data/dashboard";
import { clubClasses, clubs, getClubRoster, platformUsers, type ClubClass } from "@/data/platform";
import { getMockCompetitionsForClub, getMockTrainingCampsForClub, getMockTrainingPostsForClub } from "@/lib/mock-club-content";
import { getReadableMemberIds } from "@/lib/member-visibility";
import { toClubClass, toCompetition, toStudent, toTrainingCamp, toTrainingPost } from "@/lib/supabase/mappers";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";
import type { Competition } from "@/data/competitions";
import type { PlatformRole } from "@/data/platform";
import type { TrainingCamp } from "@/data/training-camps";
import type { TrainingPost } from "@/data/training-feed";

type ViewerScope = {
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  role: PlatformRole;
};

export type RankedMember = Student & { rank: number };

export type DashboardData = {
  meta: Omit<typeof academyMeta, "liveClass"> & {
    city?: string;
    liveClass: {
      name: string;
      coach: string;
      room: string;
      time: string;
      trainingType: string;
    };
  };
  stats: typeof dashboardStats;
  classes: Pick<ClubClass, "id" | "name" | "coach" | "time" | "mat" | "day">[];
};

export async function getClassesData(clubSlug?: string | null) {
  const requestedClubSlug = clubSlug ?? (await getRequestedClubSlug());
  if (!isSupabaseConfigured()) {
    const clubId = getMockClubId(requestedClubSlug);
    return clubClasses.filter((item) => item.clubId === clubId);
  }

  try {
    const clubId = await getBackendClubId(requestedClubSlug);
    if (!clubId) return [];
    const rows = await selectRows("club_classes", `select=*&club_id=eq.${clubId}&order=day.asc,time.asc`);
    return rows.map(toClubClass);
  } catch (error) {
    throw new Error(`Could not load classes from Supabase: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getDashboardData(clubSlug?: string | null, viewer?: ViewerScope): Promise<DashboardData> {
  const requestedClubSlug = await getRequestedClubSlug(clubSlug);
  const role = viewer?.role ?? "owner";

  if (!isSupabaseConfigured()) return getMockDashboardData(requestedClubSlug, role, viewer?.userEmail ?? undefined);

  const clubId = await getBackendClubId(requestedClubSlug);
  if (!clubId) throw new Error("Club not found.");

  const readableMembers = viewer
    ? await getReadableMemberIds({ clubId, ...viewer })
    : { scope: "all" as const };
  if ("error" in readableMembers && readableMembers.error) throw new Error("Dashboard access denied.");
  if ("empty" in readableMembers && readableMembers.empty) {
    const classes = await selectRows("club_classes", `select=*&club_id=eq.${clubId}`);
    return {
      meta: {
        ...academyMeta,
        memberCount: 0,
        checkedInToday: 0,
        liveClass: classes[0]
          ? {
              name: classes[0].name,
              coach: classes[0].coach,
              room: classes[0].mat,
              time: classes[0].time,
              trainingType: classes[0].level,
            }
          : academyMeta.liveClass,
      },
      stats: {
        ...dashboardStats,
        activeStudents: 0,
        inactiveStudents: 0,
        checkedInToday: 0,
        weeklyAttendance: 0,
        trialStudents: 0,
      },
      classes: classes.map(toClubClass).slice(0, 6),
    };
  }

  const isMemberView = readableMembers.scope === "own";
  const memberFilters = [`club_id=eq.${clubId}`];
  if (readableMembers.scope === "own") memberFilters.push(`id=in.(${readableMembers.memberIds.map(encodeURIComponent).join(",")})`);
  const checkInFilters = [`club_id=eq.${clubId}`];
  if (readableMembers.scope === "own") checkInFilters.push(`member_id=in.(${readableMembers.memberIds.map(encodeURIComponent).join(",")})`);

  const [members, classes, checkIns, posts] = await Promise.all([
    selectRows("academy_members", `select=*&${memberFilters.join("&")}`),
    selectRows("club_classes", `select=*&club_id=eq.${clubId}`),
    selectRows("class_checkins", `select=*&${checkInFilters.join("&")}`),
    isMemberView ? Promise.resolve([]) : selectRows("training_posts", `select=*&club_id=eq.${clubId}`),
  ]);
  const visibleMembers = members;
  const activeMembers = visibleMembers.filter((member) => member.status === "active");
  const visibleMemberIds = new Set(visibleMembers.map((member) => member.id));
  const visibleCheckIns = checkIns.filter((item) => visibleMemberIds.has(item.member_id));
  const checkedInToday = isMemberView ? visibleCheckIns.length : classes.reduce((sum, item) => sum + item.checked_in, 0);
  const weeklyAttendance = isMemberView ? visibleCheckIns.length : posts.reduce((sum, post) => sum + (post.attendance ?? 0), 0);

  return {
    meta: {
      ...academyMeta,
      memberCount: visibleMembers.length,
      checkedInToday,
      liveClass: classes[0]
        ? {
            name: classes[0].name,
            coach: classes[0].coach,
            room: classes[0].mat,
            time: classes[0].time,
            trainingType: classes[0].level,
          }
        : academyMeta.liveClass,
    },
    stats: {
      ...dashboardStats,
      activeStudents: activeMembers.length,
      inactiveStudents: visibleMembers.length - activeMembers.length,
      checkedInToday,
      weeklyAttendance,
      trialStudents: visibleMembers.filter((member) => Boolean(member.profile && typeof member.profile === "object" && "trial" in member.profile)).length,
    },
    classes: classes.map(toClubClass).slice(0, 6),
  };
}

export async function getCompetitionsData(clubSlug?: string | null, viewer?: ViewerScope) {
  const requestedClubSlug = await getRequestedClubSlug(clubSlug);
  if (!isSupabaseConfigured()) {
    const competitions = getMockCompetitionsForClub(requestedClubSlug);
    return viewer ? filterRegisteredMembersForViewer(competitions, getMockReadableMemberIds(requestedClubSlug, viewer)) : competitions;
  }
  try {
    const clubId = await getBackendClubId(requestedClubSlug);
    if (!clubId) return [];
    const rows = await selectRows("competitions", `select=*&club_id=eq.${clubId}&order=prep.desc`);
    const competitions = rows.map(toCompetition);
    if (!viewer) return competitions;
    return filterRegisteredMembersForViewer(competitions, await getReadableMemberIds({ clubId, ...viewer }));
  } catch (error) {
    throw new Error(`Could not load competitions from Supabase: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getMembersData(clubSlug?: string | null) {
  const requestedClubSlug = clubSlug ?? (await getRequestedClubSlug());
  if (!isSupabaseConfigured()) return getClubRoster(getMockClubId(requestedClubSlug));
  try {
    const clubId = await getBackendClubId(requestedClubSlug);
    if (!clubId) return [];
    const rows = await selectRows("academy_members", `select=*&club_id=eq.${clubId}&order=name.asc`);
    return rows.map(toStudent).sort(compareMemberHierarchy);
  } catch (error) {
    throw new Error(`Could not load members from Supabase: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getVisibleMembersData({
  clubSlug,
  userId,
  userEmail,
  role,
}: {
  clubSlug?: string | null;
  userId: string;
  userEmail?: string | null;
  role: PlatformRole;
}) {
  const requestedClubSlug = clubSlug ?? (await getRequestedClubSlug());
  if (!isSupabaseConfigured()) {
    return filterMockRosterForViewer(getClubRoster(getMockClubId(requestedClubSlug)), { userId, userEmail, role });
  }

  const clubId = await getBackendClubId(requestedClubSlug);
  if (!clubId) return [];

  const readable = await getReadableMemberIds({ clubId, userId, userEmail, role });
  if ("error" in readable && readable.error) return [];
  if ("empty" in readable && readable.empty) return [];

  const filters = [`club_id=eq.${clubId}`];
  if (readable.scope === "own") filters.push(`id=in.(${readable.memberIds.map(encodeURIComponent).join(",")})`);
  const rows = await selectRows("academy_members", `select=*&${filters.join("&")}&order=name.asc`);
  return rows.map(toStudent).sort(compareMemberHierarchy);
}

export async function getVisibleRankingsData({
  clubSlug,
  userId,
  userEmail,
  userName,
  role,
}: {
  clubSlug?: string | null;
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  role: PlatformRole;
}): Promise<RankedMember[]> {
  const requestedClubSlug = clubSlug ?? (await getRequestedClubSlug());

  if (!isSupabaseConfigured()) {
    const rankings = getClubRoster(getMockClubId(requestedClubSlug))
      .sort((a, b) => b.points - a.points)
      .map((member, index) => ({ ...member, rank: index + 1 }));

    if (role === "owner" || role === "admin" || role === "coach") return rankings;
    return rankings.filter((member) => member.name === userName);
  }

  const clubId = await getBackendClubId(requestedClubSlug);
  if (!clubId) return [];

  const readable = await getReadableMemberIds({ clubId, userId, userEmail, role });
  if ("error" in readable && readable.error) return [];
  if ("empty" in readable && readable.empty) return [];

  const rankRows = readable.scope === "own"
    ? await selectRows("academy_members", `select=id,points&club_id=eq.${clubId}&order=points.desc`)
    : null;
  const rankById = rankRows
    ? new Map(rankRows.map((row, index) => [row.id, index + 1]))
    : null;
  const filters = [`club_id=eq.${clubId}`];
  if (readable.scope === "own") filters.push(`id=in.(${readable.memberIds.map(encodeURIComponent).join(",")})`);

  const rows = await selectRows("academy_members", `select=*&${filters.join("&")}&order=points.desc`);
  return rows.map(toStudent).map((member, index) => ({ ...member, rank: rankById?.get(member.id) ?? index + 1 }));
}

export async function getMemberData(memberId: string, clubSlug?: string | null) {
  const requestedClubSlug = clubSlug ?? (await getRequestedClubSlug());
  if (!isSupabaseConfigured()) return getClubRoster(getMockClubId(requestedClubSlug)).find((member) => member.id === memberId) ?? null;
  try {
    const clubId = await getBackendClubId(requestedClubSlug);
    if (!clubId) return null;
    const rows = await selectRows("academy_members", `select=*&club_id=eq.${clubId}&id=eq.${encodeURIComponent(memberId)}&limit=1`);
    return rows[0] ? toStudent(rows[0]) : null;
  } catch (error) {
    throw new Error(`Could not load member from Supabase: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getTrainingCampsData(clubSlug?: string | null, viewer?: ViewerScope) {
  const requestedClubSlug = await getRequestedClubSlug(clubSlug);
  if (!isSupabaseConfigured()) {
    const camps = getMockTrainingCampsForClub(requestedClubSlug);
    return viewer ? filterRegisteredMembersForViewer(camps, getMockReadableMemberIds(requestedClubSlug, viewer)) : camps;
  }
  try {
    const clubId = await getBackendClubId(requestedClubSlug);
    if (!clubId) return [];
    const rows = await selectRows("training_camps", `select=*&club_id=eq.${clubId}&order=prep.desc`);
    const camps = rows.map(toTrainingCamp);
    if (!viewer) return camps;
    return filterRegisteredMembersForViewer(camps, await getReadableMemberIds({ clubId, ...viewer }));
  } catch (error) {
    throw new Error(`Could not load training camps from Supabase: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getTrainingPostsData(clubSlug?: string | null, viewer?: ViewerScope) {
  const requestedClubSlug = await getRequestedClubSlug(clubSlug);
  if (!isSupabaseConfigured()) {
    const posts = getMockTrainingPostsForClub(requestedClubSlug);
    return viewer ? filterMockTrainingPostsForViewer(posts, requestedClubSlug, viewer) : posts;
  }
  try {
    const clubId = await getBackendClubId(requestedClubSlug);
    if (!clubId) return [];
    const rows = await selectRows("training_posts", `select=*&club_id=eq.${clubId}&order=pinned.desc,id.asc`);
    const posts = rows.map(toTrainingPost);
    if (!viewer) return posts;
    return filterTrainingPostsForViewer(posts, clubId, viewer);
  } catch (error) {
    throw new Error(`Could not load training feed from Supabase: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function filterRegisteredMembersForViewer<T extends Competition | TrainingCamp>(
  items: T[],
  readable: Awaited<ReturnType<typeof getReadableMemberIds>>,
) {
  if ("scope" in readable && readable.scope === "all") return items;
  const allowedIds = new Set("scope" in readable && readable.scope === "own" ? readable.memberIds : []);
  return items
    .filter((item) => item.registered_students.length === 0 || item.registered_students.some((id) => allowedIds.has(id)))
    .map((item) => ({
      ...item,
      registered_students: item.registered_students.filter((id) => allowedIds.has(id)),
    }));
}

async function filterTrainingPostsForViewer(posts: TrainingPost[], clubId: string, viewer: ViewerScope) {
  const readable = await getReadableMemberIds({ clubId, ...viewer });
  if ("scope" in readable && readable.scope === "all") return posts;
  if ("empty" in readable && readable.empty) {
    return posts
      .filter((post) => !post.taggedStudents?.length)
      .map((post) => ({ ...post, taggedStudents: [], topParticipant: undefined }));
  }

  const memberIds = "scope" in readable && readable.scope === "own" ? readable.memberIds : [];
  if (!memberIds.length) {
    return posts
      .filter((post) => !post.taggedStudents?.length)
      .map((post) => ({ ...post, taggedStudents: [], topParticipant: undefined }));
  }

  const rows = await selectRows(
    "academy_members",
    `select=name&club_id=eq.${clubId}&id=in.(${memberIds.map(encodeURIComponent).join(",")})`,
  );
  const allowedNames = new Set(rows.map((row) => row.name));

  return posts
    .filter((post) => !post.taggedStudents?.length || post.taggedStudents.some((name) => allowedNames.has(name)))
    .map((post) => {
      const taggedStudents = (post.taggedStudents ?? []).filter((name) => allowedNames.has(name));
      return {
        ...post,
        taggedStudents,
        topParticipant: post.topParticipant && allowedNames.has(post.topParticipant.name) ? post.topParticipant : undefined,
      };
    });
}

function getMockDashboardData(clubSlug: string, role: PlatformRole = "owner", userEmail?: string | null): DashboardData {
  const clubId = getMockClubId(clubSlug);
  const club = clubs.find((item) => item.id === clubId) ?? clubs[0];
  const fullRoster = getClubRoster(clubId);
  const roster = filterMockRosterForViewer(fullRoster, { userEmail, role });
  const classes = clubClasses.filter((item) => item.clubId === clubId);
  const checkedInToday = classes.reduce((sum, item) => sum + item.checkedIn, 0);
  const activeMembers = roster.filter((member) => member.status === "active");
  const liveClass = classes[0]
    ? {
        name: classes[0].name,
        coach: classes[0].coach,
        room: classes[0].mat,
        time: classes[0].time,
        trainingType: classes[0].level,
      }
    : academyMeta.liveClass;

  return {
    meta: {
      ...academyMeta,
      name: club.name,
      city: club.location,
      memberCount: roster.length,
      checkedInToday,
      liveClass,
    },
    stats: {
      ...dashboardStats,
      activeStudents: activeMembers.length,
      inactiveStudents: roster.length - activeMembers.length,
      checkedInToday,
      weeklyAttendance: Math.max(checkedInToday * 3, checkedInToday),
    },
    classes: classes.slice(0, 6),
  };
}

function filterMockRosterForViewer(
  roster: Student[],
  viewer: { userId?: string | null; userEmail?: string | null; role: PlatformRole },
) {
  if (viewer.role === "owner" || viewer.role === "admin" || viewer.role === "coach") return roster;
  const user = platformUsers.find((candidate) =>
    candidate.id === viewer.userId || candidate.email.toLowerCase() === viewer.userEmail?.toLowerCase(),
  );
  if (!user) return [];
  return roster.filter((member) => member.name.toLowerCase() === user.name.toLowerCase());
}

function getMockReadableMemberIds(clubSlug: string, viewer: ViewerScope) {
  if (viewer.role === "owner" || viewer.role === "admin" || viewer.role === "coach") return { scope: "all" as const };
  const members = filterMockRosterForViewer(getClubRoster(getMockClubId(clubSlug)), viewer);
  return members.length ? { scope: "own" as const, memberIds: members.map((member) => member.id) } : { empty: true as const };
}

function filterMockTrainingPostsForViewer(posts: TrainingPost[], clubSlug: string, viewer: ViewerScope) {
  const readable = getMockReadableMemberIds(clubSlug, viewer);
  if ("scope" in readable && readable.scope === "all") return posts;
  if ("empty" in readable && readable.empty) {
    return posts
      .filter((post) => !post.taggedStudents?.length)
      .map((post) => ({ ...post, taggedStudents: [], topParticipant: undefined }));
  }

  const allowedNames = new Set(
    getClubRoster(getMockClubId(clubSlug))
      .filter((member) => readable.memberIds.includes(member.id))
      .map((member) => member.name),
  );

  return posts
    .filter((post) => !post.taggedStudents?.length || post.taggedStudents.some((name) => allowedNames.has(name)))
    .map((post) => {
      const taggedStudents = (post.taggedStudents ?? []).filter((name) => allowedNames.has(name));
      return {
        ...post,
        taggedStudents,
        topParticipant: post.topParticipant && allowedNames.has(post.topParticipant.name) ? post.topParticipant : undefined,
      };
    });
}
