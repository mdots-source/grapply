export type TrainingPostType =
  | "session"
  | "promotion"
  | "competition"
  | "announcement"
  | "milestone"
  | "open-mat";

export type TrainingPost = {
  id: string;
  type: TrainingPostType;
  pinned?: boolean;
  className?: string;
  coach: string;
  date: string;
  time: string;
  title: string;
  summary: string;
  attendance?: number;
  topParticipant?: { name: string; note: string };
  sparringHighlight?: string;
  achievements?: string[];
  taggedStudents?: string[];
  reactions: number;
  comments: number;
  heat: number;
};

export const trainingPosts: TrainingPost[] = [
  {
    id: "tf-1",
    type: "session",
    pinned: true,
    className: "Advanced No-Gi",
    coach: "Sofia Almeida",
    date: "Today",
    time: "19:00",
    title: "Guard retention into back attacks",
    summary:
      "Eight five-minute rounds with positional starts from headquarters. Competition team logged 44 exchanges with strong back attack finishes.",
    attendance: 31,
    topParticipant: { name: "Maya Ribeiro", note: "9 rounds · highest intensity" },
    sparringHighlight: "Turtle to back chain — 14 successful finishes recorded on the floor.",
    taggedStudents: ["Maya Ribeiro", "Camille Duran", "Noah Keller"],
    reactions: 48,
    comments: 12,
    heat: 94,
  },
  {
    id: "tf-2",
    type: "promotion",
    coach: "Sofia Almeida",
    date: "Today",
    time: "11:18",
    title: "Noah Keller — 4th stripe on Black Belt",
    summary: "Awarded after consistent competition prep and leadership in advanced rounds.",
    achievements: ["Black belt stripe milestone"],
    taggedStudents: ["Noah Keller"],
    reactions: 86,
    comments: 24,
    heat: 91,
  },
  {
    id: "tf-3",
    type: "competition",
    coach: "Lina Okafor",
    date: "Yesterday",
    time: "16:40",
    title: "IBJJF LA Open — team weigh-in complete",
    summary: "All registered athletes cleared weight. Final rules review scheduled Saturday 11:00.",
    attendance: 5,
    taggedStudents: ["Maya Ribeiro", "Sofia Almeida", "Camille Duran"],
    reactions: 32,
    comments: 8,
    heat: 78,
  },
  {
    id: "tf-4",
    type: "open-mat",
    className: "Sunday Open Mat",
    coach: "Lina Okafor",
    date: "Sunday",
    time: "12:00",
    title: "Recovery flow + 90-minute open mat",
    summary: "All belts welcome. Flow rounds followed by free sparring — 28 check-ins, great community energy.",
    attendance: 28,
    sparringHighlight: "Best exchange: purple belt sweep to mount transition drill.",
    reactions: 41,
    comments: 15,
    heat: 72,
  },
  {
    id: "tf-5",
    type: "milestone",
    coach: "Noah Keller",
    date: "Yesterday",
    time: "09:15",
    title: "Eli Morgan — beginner streak unlocked",
    summary: "Three consecutive fundamentals classes with improved escape scores.",
    achievements: ["3-class beginner streak", "Attendance +22%"],
    taggedStudents: ["Eli Morgan"],
    reactions: 55,
    comments: 9,
    heat: 68,
  },
  {
    id: "tf-6",
    type: "announcement",
    coach: "Sofia Almeida",
    date: "This week",
    time: "08:00",
    title: "Friday schedule change",
    summary: "Fight Night Rounds moves to Main Mat at 19:30 for competition prep week.",
    reactions: 19,
    comments: 4,
    heat: 54,
  },
];

export const typeLabels: Record<TrainingPostType, string> = {
  session: "Training session",
  promotion: "Promotion",
  competition: "Competition result",
  announcement: "Announcement",
  milestone: "Milestone",
  "open-mat": "Open mat recap",
};
