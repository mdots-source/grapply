import type { Belt } from "@/data/academy";

export type BeltMilestone = {
  belt: Belt;
  stripes: number;
  date: string;
  awardedBy: string;
  note?: string;
};

export type CoachNote = {
  id: string;
  coach: string;
  date: string;
  body: string;
};

export type MemberProfileExtra = {
  rank: number;
  weeklyAttendance: number;
  trial?: boolean;
  attendanceRisk?: "low" | "medium" | "high";
  roleLabel: string;
  achievements: string[];
  beltTimeline: BeltMilestone[];
  coachNotes: CoachNote[];
  registeredCompetitions: { name: string; date: string; status: string }[];
};

export const memberProfileExtras: Record<string, MemberProfileExtra> = {
  "st-001": {
    rank: 2,
    weeklyAttendance: 5,
    roleLabel: "Competition team",
    achievements: ["9-class streak", "Top passer this month", "IBJJF LA Open registered"],
    beltTimeline: [
      { belt: "white", stripes: 0, date: "Mar 2022", awardedBy: "Sofia Almeida" },
      { belt: "blue", stripes: 4, date: "Jan 2023", awardedBy: "Sofia Almeida" },
      { belt: "purple", stripes: 2, date: "Nov 2024", awardedBy: "Sofia Almeida", note: "Competition performance" },
    ],
    coachNotes: [
      { id: "n1", coach: "Sofia Almeida", date: "May 18", body: "Excellent guard retention — ready for advanced passing chains." },
      { id: "n2", coach: "Lina Okafor", date: "May 10", body: "Strong back attack entries in live rounds." },
    ],
    registeredCompetitions: [
      { name: "IBJJF LA Open", date: "Jun 28, 2026", status: "Registered" },
      { name: "IBJJF Zurich Open", date: "Jun 14, 2026", status: "Registered" },
    ],
  },
  "st-003": {
    rank: 1,
    weeklyAttendance: 6,
    roleLabel: "Head coach",
    achievements: ["Academy founder", "14-class streak", "2,440 ranking points"],
    beltTimeline: [
      { belt: "black", stripes: 0, date: "2016", awardedBy: "Professor Mendes" },
      { belt: "black", stripes: 3, date: "Apr 2026", awardedBy: "IBJJF panel" },
    ],
    coachNotes: [{ id: "n1", coach: "Sofia Almeida", date: "Ongoing", body: "Leading competition team and evening advanced blocks." }],
    registeredCompetitions: [],
  },
  "st-004": {
    rank: 12,
    weeklyAttendance: 3,
    trial: true,
    attendanceRisk: "medium",
    roleLabel: "Trial member",
    achievements: ["3-class beginner streak"],
    beltTimeline: [{ belt: "white", stripes: 3, date: "Feb 2026", awardedBy: "Noah Keller" }],
    coachNotes: [
      { id: "n1", coach: "Noah Keller", date: "May 19", body: "Trial ends in 5 days — strong fundamentals attendance." },
    ],
    registeredCompetitions: [],
  },
  "st-006": {
    rank: 18,
    weeklyAttendance: 1,
    attendanceRisk: "high",
    roleLabel: "Member",
    achievements: [],
    beltTimeline: [
      { belt: "white", stripes: 2, date: "Aug 2024", awardedBy: "Lina Okafor" },
      { belt: "blue", stripes: 1, date: "Mar 2025", awardedBy: "Sofia Almeida" },
    ],
    coachNotes: [
      { id: "n1", coach: "Sofia Almeida", date: "May 15", body: "12 days absent — schedule re-engagement check-in." },
    ],
    registeredCompetitions: [{ name: "Alps Grappling Cup", date: "Jul 5, 2026", status: "Planning" }],
  },
  "st-010": {
    rank: 9,
    weeklyAttendance: 4,
    roleLabel: "Member",
    achievements: ["8-class streak", "Strava conditioning synced"],
    beltTimeline: [
      { belt: "white", stripes: 4, date: "Sep 2024", awardedBy: "Noah Keller" },
      { belt: "blue", stripes: 3, date: "Jan 2026", awardedBy: "Sofia Almeida" },
    ],
    coachNotes: [
      { id: "n1", coach: "Lina Okafor", date: "May 20", body: "Strong wrestle-up pace, keep pairing with pressure passing rounds." },
    ],
    registeredCompetitions: [{ name: "SoCal Open", date: "Aug 8, 2026", status: "Registered" }],
  },
  "st-011": {
    rank: 16,
    weeklyAttendance: 0,
    attendanceRisk: "high",
    roleLabel: "Member",
    achievements: ["Purple belt cohort"],
    beltTimeline: [
      { belt: "blue", stripes: 4, date: "Jun 2023", awardedBy: "Sofia Almeida" },
      { belt: "purple", stripes: 1, date: "Dec 2025", awardedBy: "Lina Okafor" },
    ],
    coachNotes: [
      { id: "n1", coach: "Sofia Almeida", date: "May 16", body: "Inactive for 18 days — invite back through lunch class or open mat." },
    ],
    registeredCompetitions: [],
  },
  "st-012": {
    rank: 21,
    weeklyAttendance: 3,
    trial: true,
    attendanceRisk: "low",
    roleLabel: "Trial member",
    achievements: ["5-class beginner streak"],
    beltTimeline: [{ belt: "white", stripes: 2, date: "Apr 2026", awardedBy: "Noah Keller" }],
    coachNotes: [
      { id: "n1", coach: "Lina Okafor", date: "May 21", body: "Great fundamentals retention, ready to start guard passing basics." },
    ],
    registeredCompetitions: [],
  },
  "st-013": {
    rank: 19,
    weeklyAttendance: 3,
    roleLabel: "Member",
    achievements: ["Open mat regular"],
    beltTimeline: [
      { belt: "white", stripes: 4, date: "Nov 2025", awardedBy: "Noah Keller" },
      { belt: "blue", stripes: 0, date: "Feb 2026", awardedBy: "Sofia Almeida" },
    ],
    coachNotes: [
      { id: "n1", coach: "Noah Keller", date: "May 17", body: "Improving wrestling defense, add two rounds of grip fighting before class." },
    ],
    registeredCompetitions: [{ name: "Grappling Industries San Diego", date: "Sep 12, 2026", status: "Planning" }],
  },
  "st-014": {
    rank: 3,
    weeklyAttendance: 6,
    roleLabel: "Competition team",
    achievements: ["12-class streak", "Takedown lab lead", "Top 3 academy points"],
    beltTimeline: [
      { belt: "blue", stripes: 4, date: "Aug 2022", awardedBy: "Sofia Almeida" },
      { belt: "purple", stripes: 3, date: "May 2025", awardedBy: "Sofia Almeida", note: "No-Gi competition podium" },
    ],
    coachNotes: [
      { id: "n1", coach: "Sofia Almeida", date: "May 22", body: "Excellent pace in advanced rounds. Build camp around knee cut to back take." },
    ],
    registeredCompetitions: [{ name: "IBJJF Las Vegas Open", date: "Jul 18, 2026", status: "Registered" }],
  },
  "st-015": {
    rank: 25,
    weeklyAttendance: 0,
    trial: true,
    attendanceRisk: "high",
    roleLabel: "Trial member",
    achievements: [],
    beltTimeline: [{ belt: "white", stripes: 0, date: "May 2026", awardedBy: "Noah Keller" }],
    coachNotes: [
      { id: "n1", coach: "Noah Keller", date: "May 18", body: "Trial member needs a friendly follow-up and a beginner class recommendation." },
    ],
    registeredCompetitions: [],
  },
  "st-016": {
    rank: 10,
    weeklyAttendance: 4,
    roleLabel: "Member",
    achievements: ["Dawn Patrol regular", "6-class streak"],
    beltTimeline: [
      { belt: "white", stripes: 4, date: "Apr 2024", awardedBy: "Lina Okafor" },
      { belt: "blue", stripes: 2, date: "Oct 2025", awardedBy: "Sofia Almeida" },
    ],
    coachNotes: [
      { id: "n1", coach: "Sofia Almeida", date: "May 19", body: "Collar sleeve entries are sharp; add passing chains against standing opponents." },
    ],
    registeredCompetitions: [],
  },
};

export function getMemberProfileExtra(id: string): MemberProfileExtra {
  return (
    memberProfileExtras[id] ?? {
      rank: 24,
      weeklyAttendance: 2,
      roleLabel: "Member",
      achievements: [],
      beltTimeline: [],
      coachNotes: [],
      registeredCompetitions: [],
    }
  );
}
