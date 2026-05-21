export type Belt = "white" | "blue" | "purple" | "brown" | "black";
export type MemberRole = "member" | "coach";

export type Student = {
  id: string;
  name: string;
  belt: Belt;
  stripes: number;
  role: MemberRole;
  status: "active" | "inactive";
  totalHours: number;
  classes30: number;
  streak: number;
  points: number;
  wins: number;
  losses: number;
  lastSeen: string;
  focus: string;
  avatar?: string;
};

const beltHierarchy: Record<Belt, number> = {
  black: 5,
  brown: 4,
  purple: 3,
  blue: 2,
  white: 1,
};

/** Coaches first, then black→white; more stripes rank higher within the same belt. */
export function compareMemberHierarchy(a: Student, b: Student) {
  if (a.role === "coach" && b.role !== "coach") return -1;
  if (b.role === "coach" && a.role !== "coach") return 1;

  const beltDiff = beltHierarchy[b.belt] - beltHierarchy[a.belt];
  if (beltDiff !== 0) return beltDiff;

  return b.stripes - a.stripes;
}

export const beltStyles: Record<Belt, { label: string; className: string; hex: string }> = {
  white: { label: "White", className: "bg-zinc-100 text-zinc-950", hex: "#f4f4f5" },
  blue: { label: "Blue", className: "bg-sky-500 text-white", hex: "#0ea5e9" },
  purple: { label: "Purple", className: "bg-violet-500 text-white", hex: "#8b5cf6" },
  brown: { label: "Brown", className: "bg-amber-800 text-amber-50", hex: "#92400e" },
  black: { label: "Black", className: "bg-zinc-950 text-white ring-1 ring-white/20", hex: "#09090b" },
};

const studentSeed: Student[] = [
  { id: "st-003", name: "Sofia Almeida", belt: "black", stripes: 3, role: "coach", status: "active", totalHours: 2840, classes30: 22, streak: 14, points: 2440, wins: 42, losses: 4, lastSeen: "Competition Team", focus: "Pressure passing", avatar: "/avatars/sofia-almeida.png" },
  { id: "st-005", name: "Lina Okafor", belt: "brown", stripes: 2, role: "coach", status: "active", totalHours: 1960, classes30: 19, streak: 11, points: 2110, wins: 31, losses: 8, lastSeen: "No-Gi Advanced", focus: "Back control", avatar: "/avatars/sofia-almeida.png" },
  { id: "st-002", name: "Noah Keller", belt: "black", stripes: 1, role: "coach", status: "active", totalHours: 1720, classes30: 16, streak: 6, points: 1510, wins: 18, losses: 9, lastSeen: "No-Gi Advanced", focus: "Leg entries", avatar: "/avatars/noah-keller.png" },
  { id: "st-001", name: "Maya Ribeiro", belt: "purple", stripes: 2, role: "member", status: "active", totalHours: 412, classes30: 18, streak: 9, points: 1840, wins: 24, losses: 6, lastSeen: "Open Mat", focus: "Guard retention", avatar: "/avatars/maya-ribeiro.png" },
  { id: "st-007", name: "Camille Duran", belt: "purple", stripes: 0, role: "member", status: "active", totalHours: 318, classes30: 14, streak: 5, points: 1660, wins: 17, losses: 5, lastSeen: "Women Only", focus: "Arm drags", avatar: "/avatars/maya-ribeiro.png" },
  { id: "st-006", name: "Arjun Patel", belt: "blue", stripes: 1, role: "member", status: "active", totalHours: 186, classes30: 4, streak: 0, points: 890, wins: 9, losses: 12, lastSeen: "12 days ago", focus: "Half guard", avatar: "/avatars/noah-keller.png" },
  { id: "st-004", name: "Eli Morgan", belt: "white", stripes: 3, role: "member", status: "active", totalHours: 124, classes30: 11, streak: 3, points: 620, wins: 5, losses: 7, lastSeen: "Fundamentals", focus: "Escapes", avatar: "/avatars/eli-morgan.png" },
  { id: "st-008", name: "Mateo Silva", belt: "white", stripes: 1, role: "member", status: "active", totalHours: 96, classes30: 9, streak: 4, points: 510, wins: 3, losses: 6, lastSeen: "Fundamentals", focus: "Frames", avatar: "/avatars/eli-morgan.png" },
];

export const students: Student[] = [...studentSeed].sort(compareMemberHierarchy);

export const attendance = [
  { day: "Mon", students: 42, sparring: 24 },
  { day: "Tue", students: 36, sparring: 18 },
  { day: "Wed", students: 51, sparring: 31 },
  { day: "Thu", students: 48, sparring: 29 },
  { day: "Fri", students: 39, sparring: 22 },
  { day: "Sat", students: 64, sparring: 47 },
  { day: "Sun", students: 28, sparring: 18 },
];

export const schedule = [
  { time: "06:30", name: "Dawn Patrol Gi", coach: "Sofia Almeida", belts: ["blue", "purple", "brown", "black"] as Belt[], room: "Mat A", capacity: 28 },
  { time: "12:00", name: "Lunch No-Gi", coach: "Lina Okafor", belts: ["white", "blue", "purple"] as Belt[], room: "Mat B", capacity: 34 },
  { time: "17:30", name: "Kids Competition", coach: "Noah Keller", belts: ["white", "blue"] as Belt[], room: "Mat A", capacity: 22 },
  { time: "19:00", name: "Advanced Sparring", coach: "Sofia Almeida", belts: ["purple", "brown", "black"] as Belt[], room: "Main Mat", capacity: 46 },
];

export type TrainingCategory =
  | "Fundamentals"
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Competition Team"
  | "No-Gi"
  | "Open Mat";

export const currentSession = {
  id: "advanced-sparring-1900",
  name: "Advanced Sparring",
  time: "19:00",
  endTime: "20:30",
  durationMinutes: 90,
  coach: "Sofia Almeida",
  room: "Main Mat",
  trainingType: "No-Gi" as const,
  experienceLevel: "Advanced" as const,
  category: "Competition Team" as TrainingCategory,
  checkInUrl: "http://localhost:3000/login?session=advanced-sparring-1900",
  focus: "Pressure passing into live rounds",
};

export type TvCheckedInAthlete = Student & {
  checkedInMinutes: number;
};

export const tvCheckedInAthletes: TvCheckedInAthlete[] = students.map((student, index) => ({
  ...student,
  checkedInMinutes: [47, 41, 52, 22, 38, 18, 29, 14][index] ?? 12,
}));

export const feed = [
  { id: "f1", author: "Sofia Almeida", title: "Competition team rounds", text: "8 five-minute rounds, positional starts from headquarters, and late-stage back escapes.", meta: "31 athletes checked in", heat: 92 },
  { id: "f2", author: "Maya Ribeiro", title: "Promotion watch", text: "Maya held a nine-class streak and logged her strongest passing score this month.", meta: "Purple belt cohort", heat: 84 },
  { id: "f3", author: "Noah Keller", title: "No-Gi lunch recap", text: "Leg entry chains and defensive hand fighting produced 44 recorded sparring exchanges.", meta: "22 rounds tracked", heat: 76 },
];

export const recentActivity = [
  "Maya Ribeiro checked into Open Mat",
  "Lina Okafor awarded 120 ranking points",
  "Eli Morgan completed 3-class beginner streak",
  "Competition Team capacity reached 89%",
  "Sofia Almeida promoted two students to blue belt",
];
