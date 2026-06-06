import { schedule, students, type Belt, type Student } from "@/data/academy";

export type PlatformRole = "owner" | "admin" | "coach" | "member";
export type ClubStatus = "active" | "pending" | "archived";
export type StravaConnectionStatus = "connected" | "not_connected" | "syncing" | "error";

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  belt: Belt;
  stripes: number;
  stravaStatus: StravaConnectionStatus;
  stravaAthleteId?: string;
};

export type Club = {
  id: string;
  slug: string;
  name: string;
  location: string;
  status: ClubStatus;
  memberCount: number;
  primaryCoach: string;
};

export type ClubMembership = {
  id: string;
  userId: string;
  clubId: string;
  role: PlatformRole;
  invitedBy?: string;
  joinedAt: string;
};

export type RoleDefinition = {
  role: PlatformRole;
  label: string;
  description: string;
  permissions: string[];
};

export type ClubClass = {
  id: string;
  clubId: string;
  name: string;
  coach: string;
  day: string;
  time: string;
  mat: string;
  level: string;
  durationMinutes: number;
  checkedIn: number;
};

export const platformUsers: PlatformUser[] = [
  {
    id: "usr-sofia",
    name: "Sofia Almeida",
    email: "sofia@grapply.app",
    avatar: "/avatars/sofia-almeida.png",
    belt: "black",
    stripes: 3,
    stravaStatus: "connected",
    stravaAthleteId: "12345678",
  },
  {
    id: "usr-maya",
    name: "Maya Ribeiro",
    email: "maya@grapply.app",
    avatar: "/avatars/maya-ribeiro.png",
    belt: "purple",
    stripes: 2,
    stravaStatus: "syncing",
    stravaAthleteId: "33221100",
  },
  {
    id: "usr-eli",
    name: "Eli Morgan",
    email: "eli@grapply.app",
    avatar: "/avatars/eli-morgan.png",
    belt: "white",
    stripes: 3,
    stravaStatus: "not_connected",
  },
  {
    id: "usr-empty",
    name: "Nina Park",
    email: "nina@grapply.app",
    belt: "white",
    stripes: 0,
    stravaStatus: "not_connected",
  },
  {
    id: "usr-diego",
    name: "Diego Alvarez",
    email: "diego@grapply.app",
    avatar: "/avatars/noah-keller.png",
    belt: "black",
    stripes: 1,
    stravaStatus: "connected",
    stravaAthleteId: "44009112",
  },
  {
    id: "usr-zoe",
    name: "Zoe Chen",
    email: "zoe@grapply.app",
    avatar: "/avatars/eli-morgan.png",
    belt: "blue",
    stripes: 3,
    stravaStatus: "connected",
    stravaAthleteId: "55110223",
  },
  {
    id: "usr-omar",
    name: "Omar Haddad",
    email: "omar@grapply.app",
    avatar: "/avatars/sofia-almeida.png",
    belt: "purple",
    stripes: 1,
    stravaStatus: "error",
    stravaAthleteId: "77123490",
  },
  {
    id: "usr-priya",
    name: "Priya Nair",
    email: "priya@grapply.app",
    avatar: "/avatars/maya-ribeiro.png",
    belt: "white",
    stripes: 2,
    stravaStatus: "not_connected",
  },
  {
    id: "usr-marcus",
    name: "Marcus Reed",
    email: "marcus@grapply.app",
    avatar: "/avatars/noah-keller.png",
    belt: "blue",
    stripes: 0,
    stravaStatus: "syncing",
    stravaAthleteId: "88234501",
  },
  {
    id: "usr-ana",
    name: "Ana Costa",
    email: "ana@grapply.app",
    avatar: "/avatars/sofia-almeida.png",
    belt: "purple",
    stripes: 3,
    stravaStatus: "connected",
    stravaAthleteId: "99012345",
  },
];

export function getPlatformUserBeltRank(email?: string | null): Pick<PlatformUser, "belt" | "stripes"> {
  const user = platformUsers.find((candidate) => candidate.email.toLowerCase() === email?.toLowerCase());
  return { belt: user?.belt ?? "white", stripes: user?.stripes ?? 0 };
}

export const clubs: Club[] = [
  {
    id: "club-grapply",
    slug: "grapply-bjj",
    name: "Grapply Jiu-Jitsu Academy",
    location: "San Diego, CA",
    status: "active",
    memberCount: 212,
    primaryCoach: "Sofia Almeida",
  },
  {
    id: "club-alpine",
    slug: "alpine-grappling",
    name: "Alpine Grappling Club",
    location: "Zurich, CH",
    status: "active",
    memberCount: 86,
    primaryCoach: "Noah Keller",
  },
  {
    id: "club-harbor",
    slug: "harbor-nogi",
    name: "Harbor No-Gi Lab",
    location: "Long Beach, CA",
    status: "pending",
    memberCount: 34,
    primaryCoach: "Lina Okafor",
  },
];

export const clubMemberships: ClubMembership[] = [
  { id: "mem-001", userId: "usr-sofia", clubId: "club-grapply", role: "owner", joinedAt: "2025-01-08" },
  { id: "mem-002", userId: "usr-sofia", clubId: "club-alpine", role: "coach", invitedBy: "Noah Keller", joinedAt: "2026-02-14" },
  { id: "mem-003", userId: "usr-maya", clubId: "club-grapply", role: "admin", invitedBy: "Sofia Almeida", joinedAt: "2025-06-20" },
  { id: "mem-004", userId: "usr-eli", clubId: "club-grapply", role: "member", invitedBy: "Maya Ribeiro", joinedAt: "2026-03-02" },
  { id: "mem-005", userId: "usr-diego", clubId: "club-grapply", role: "coach", invitedBy: "Sofia Almeida", joinedAt: "2025-11-10" },
  { id: "mem-006", userId: "usr-zoe", clubId: "club-grapply", role: "member", invitedBy: "Maya Ribeiro", joinedAt: "2026-01-18" },
  { id: "mem-007", userId: "usr-omar", clubId: "club-alpine", role: "member", invitedBy: "Noah Keller", joinedAt: "2026-02-03" },
  { id: "mem-008", userId: "usr-priya", clubId: "club-harbor", role: "member", invitedBy: "Lina Okafor", joinedAt: "2026-04-12" },
  { id: "mem-009", userId: "usr-marcus", clubId: "club-grapply", role: "member", invitedBy: "Sofia Almeida", joinedAt: "2026-04-22" },
  { id: "mem-010", userId: "usr-ana", clubId: "club-grapply", role: "admin", invitedBy: "Sofia Almeida", joinedAt: "2025-09-14" },
  { id: "mem-011", userId: "usr-ana", clubId: "club-harbor", role: "coach", invitedBy: "Lina Okafor", joinedAt: "2026-05-01" },
];

export function getDemoSafeRole(userEmail: string | undefined, clubSlug: string | undefined, role: PlatformRole): PlatformRole {
  if (userEmail?.toLowerCase() === "sofia@grapply.app" && clubSlug === "grapply-bjj") {
    return "owner";
  }

  return role;
}

export const roleDefinitions: RoleDefinition[] = [
  {
    role: "owner",
    label: "Owner",
    description: "Can change everything: organization settings, coaches, members, classes, camps, competitions, and integrations.",
    permissions: ["manage_organization", "manage_coaches", "manage_members", "manage_classes", "manage_camps", "manage_competitions"],
  },
  {
    role: "admin",
    label: "Admin",
    description: "Legacy manager role. Treat like owner for this prototype until billing/ownership is separated.",
    permissions: ["manage_coaches", "manage_members", "manage_classes", "manage_camps", "manage_competitions"],
  },
  {
    role: "coach",
    label: "Coach",
    description: "Can plan trainings, camps, competitions, and manage participants.",
    permissions: ["manage_classes", "manage_camps", "manage_competitions", "manage_members"],
  },
  {
    role: "member",
    label: "Member",
    description: "Club member record without manager access to the organization workspace.",
    permissions: ["view_profile"],
  },
];

export const clubClasses: ClubClass[] = [
  ...schedule.map((item, index) => ({
    id: `class-grapply-${index + 1}`,
    clubId: "club-grapply",
    name: item.name,
    coach: item.coach,
    day: ["Mon", "Tue", "Wed", "Thu"][index] ?? "Fri",
    time: item.time,
    mat: item.room,
    level: item.belts.join(" / "),
    durationMinutes: 60,
    checkedIn: [18, 22, 14, 31][index] ?? 10,
  })),
  {
    id: "class-alpine-1",
    clubId: "club-alpine",
    name: "Gi Fundamentals",
    coach: "Noah Keller",
    day: "Tue",
    time: "18:00",
    mat: "Mat 1",
    level: "white / blue",
    durationMinutes: 60,
    checkedIn: 16,
  },
  {
    id: "class-alpine-2",
    clubId: "club-alpine",
    name: "Takedown Lab",
    coach: "Ana Costa",
    day: "Thu",
    time: "19:30",
    mat: "Mat 2",
    level: "blue / purple / brown",
    durationMinutes: 60,
    checkedIn: 18,
  },
  {
    id: "class-harbor-1",
    clubId: "club-harbor",
    name: "No-Gi Wrestling Entries",
    coach: "Lina Okafor",
    day: "Sat",
    time: "10:30",
    mat: "Main Mat",
    level: "blue / purple / brown / black",
    durationMinutes: 75,
    checkedIn: 12,
  },
  {
    id: "class-harbor-2",
    clubId: "club-harbor",
    name: "Women Only Fundamentals",
    coach: "Lina Okafor",
    day: "Wed",
    time: "18:30",
    mat: "Main Mat",
    level: "white / blue",
    durationMinutes: 60,
    checkedIn: 19,
  },
  {
    id: "class-grapply-open-mat",
    clubId: "club-grapply",
    name: "Sunday Open Mat",
    coach: "Maya Ribeiro",
    day: "Sun",
    time: "11:00",
    mat: "Main Mat",
    level: "all belts",
    durationMinutes: 120,
    checkedIn: 27,
  },
];

export function getPlatformUser(userId = "usr-sofia") {
  return platformUsers.find((user) => user.id === userId) ?? platformUsers[0];
}

export function getUserClubContext(userId = "usr-sofia") {
  const user = getPlatformUser(userId);
  const memberships = clubMemberships
    .filter((membership) => membership.userId === user.id)
    .map((membership) => ({
      ...membership,
      club: clubs.find((club) => club.id === membership.clubId)!,
    }))
    .filter((membership) => Boolean(membership.club));

  return { user, memberships };
}

export function getClubRoster(clubId = "club-grapply"): Student[] {
  if (clubId === "club-grapply") return students;
  return students.slice(0, 4);
}

export function canManageRoles(role: PlatformRole) {
  return role === "owner" || role === "admin";
}
