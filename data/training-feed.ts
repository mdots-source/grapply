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
    topParticipant: { name: "Maya Ribeiro", note: "9 rounds · strong guard retention" },
    sparringHighlight: "Turtle to back chain — 14 successful finishes recorded on the floor.",
    taggedStudents: ["Maya Ribeiro", "Camille Duran", "Noah Keller"],
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
  },
  {
    id: "tf-4",
    type: "open-mat",
    className: "Sunday Open Mat",
    coach: "Lina Okafor",
    date: "Sunday",
    time: "12:00",
    title: "Recovery flow + 90-minute open mat",
    summary: "All belts welcome. Flow rounds followed by free sparring with 28 check-ins.",
    attendance: 28,
    sparringHighlight: "Best exchange: purple belt sweep to mount transition drill.",
  },
  {
    id: "tf-5",
    type: "milestone",
    coach: "Noah Keller",
    date: "Yesterday",
    time: "09:15",
    title: "Eli Morgan — beginner streak earned",
    summary: "Three consecutive fundamentals classes with cleaner hip escapes.",
    achievements: ["3-class beginner streak", "Attendance +22%"],
    taggedStudents: ["Eli Morgan"],
  },
  {
    id: "tf-6",
    type: "announcement",
    coach: "Sofia Almeida",
    date: "This week",
    time: "08:00",
    title: "Friday schedule change",
    summary: "Fight Night Rounds moves to Main Mat at 19:30 for competition prep week.",
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
