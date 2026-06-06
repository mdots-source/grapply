import type { Belt } from "@/data/academy";

export const dashboardStats = {
  activeStudents: 189,
  inactiveStudents: 23,
  checkedInToday: 47,
  weeklyAttendance: 312,
  weeklyAttendanceChange: 12,
  newStudentsThisMonth: 14,
  trialStudents: 8,
};

export const attendanceTrend = [
  { day: "Mon", students: 42, sparring: 24 },
  { day: "Tue", students: 36, sparring: 18 },
  { day: "Wed", students: 51, sparring: 31 },
  { day: "Thu", students: 48, sparring: 29 },
  { day: "Fri", students: 39, sparring: 22 },
  { day: "Sat", students: 64, sparring: 47 },
  { day: "Sun", students: 28, sparring: 18 },
];

export const beltDistribution: { belt: Belt; count: number }[] = [
  { belt: "white", count: 68 },
  { belt: "blue", count: 54 },
  { belt: "purple", count: 38 },
  { belt: "brown", count: 19 },
  { belt: "black", count: 13 },
];

export const todayClasses = [
  { time: "06:30", name: "Dawn Patrol Gi", coach: "Sofia Almeida", room: "Mat A", capacity: 28, enrolled: 24, isNext: false },
  { time: "12:00", name: "Lunch No-Gi", coach: "Lina Okafor", room: "Mat B", capacity: 34, enrolled: 29, isNext: false },
  { time: "17:30", name: "Kids Competition", coach: "Noah Keller", room: "Mat A", capacity: 22, enrolled: 19, isNext: false },
  { time: "19:00", name: "Advanced No-Gi", coach: "Sofia Almeida", room: "Main Mat", capacity: 46, enrolled: 41, isNext: true },
  { time: "20:30", name: "Open Mat", coach: "Lina Okafor", room: "Mat B", capacity: 30, enrolled: 18, isNext: false },
];

export const studentsNeedingAttention = [
  { id: "st-006", name: "Arjun Patel", reason: "12 days absent", classes30: 4, belt: "blue" as Belt },
  { id: "st-008", name: "Mateo Silva", reason: "Attendance dropped 40%", classes30: 9, belt: "white" as Belt },
  { id: "st-004", name: "Eli Morgan", reason: "Trial ending in 5 days", classes30: 11, belt: "white" as Belt },
];

export const coachActions = [
  { id: "a1", action: "Marked 6 students present for Lunch No-Gi", coach: "Lina Okafor", time: "12:42 PM" },
  { id: "a2", action: "Approved stripe promotion for Noah Keller", coach: "Sofia Almeida", time: "11:18 AM" },
  { id: "a3", action: "Updated competition roster for Zurich Open", coach: "Sofia Almeida", time: "9:55 AM" },
  { id: "a4", action: "Sent re-engagement message to inactive members", coach: "Noah Keller", time: "Yesterday" },
];

export const lastTrainingSession = {
  className: "No-Gi Advanced",
  coach: "Lina Okafor",
  date: "Yesterday",
  time: "19:00",
  attendance: 24,
  capacity: 42,
  summary: "Coach Lina focused on guard retention and back attacks with positional sparring rounds.",
  topParticipant: { id: "st-001", name: "Maya Ribeiro", note: "9 rounds logged" },
  sparringHighlight: "Back attack chain from turtle — 14 successful finishes recorded.",
};

export const promotions = [
  {
    id: "p1",
    student: "Noah Keller",
    detail: "Received 4th stripe on Black Belt",
    awardedBy: "Sofia Almeida",
    when: "2 hours ago",
    type: "stripe" as const,
  },
  {
    id: "p2",
    student: "Maya Ribeiro",
    detail: "Moved to #2 in academy rankings",
    awardedBy: "Sofia Almeida",
    when: "Yesterday",
    type: "ranking" as const,
  },
  {
    id: "p3",
    student: "Eli Morgan",
    detail: "Beginner streak achievement earned",
    awardedBy: "Noah Keller",
    when: "Yesterday",
    type: "achievement" as const,
  },
  {
    id: "p4",
    student: "Camille Duran",
    detail: "Promoted to Purple Belt",
    awardedBy: "Sofia Almeida",
    when: "3 days ago",
    type: "belt" as const,
  },
];

export const announcements = [
  {
    id: "n1",
    title: "Friday schedule change",
    body: "Fight Night Rounds moves to Main Mat at 19:30 this week for competition prep.",
    tag: "Schedule",
    when: "Today",
  },
  {
    id: "n2",
    title: "Sunday open mat expanded",
    body: "Recovery Flow followed by 90-minute open mat. All belts welcome.",
    tag: "Open Mat",
    when: "Tomorrow",
  },
  {
    id: "n3",
    title: "IBJJF LA Open prep seminar",
    body: "Mandatory rules review for registered athletes — Saturday 11:00.",
    tag: "Competition",
    when: "This week",
  },
];

export const communityHighlights = [
  { label: "Longest streak", value: "14 classes", member: "Sofia Almeida", accent: "streak" },
  { label: "Most active this week", value: "22 sessions", member: "Sofia Almeida", accent: "active" },
  { label: "Biggest improvement", value: "+38% attendance", member: "Maya Ribeiro", accent: "growth" },
  { label: "Top ranked this week", value: "2,440 pts", member: "Sofia Almeida", accent: "rank" },
];
