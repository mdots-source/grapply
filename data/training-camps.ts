export type TrainingCamp = {
  id: string;
  name: string;
  date: string;
  endDate: string;
  location: string;
  city: string;
  venue: string;
  host: string;
  focus: string;
  registered_students: string[];
  registration_deadline: string;
  status: string;
  notes: string;
  type: string;
  prep: number;
  spotsTotal: number;
  estimatedCost: string;
};

export const trainingCamps: TrainingCamp[] = [
  {
    id: "aoj-summer-immersion",
    name: "AOJ Summer Immersion Camp",
    date: "July 12, 2026",
    endDate: "July 18, 2026",
    location: "San Diego, CA",
    city: "San Diego, CA",
    venue: "AOJ HQ Academy",
    host: "André Galvão Team",
    focus: "Passing systems, leg locks, competition rounds",
    registered_students: ["st-001", "st-002", "st-003", "st-007"],
    registration_deadline: "June 28, 2026",
    status: "Registration open",
    notes: "7-day residential camp. Hotel block reserved near academy. Team flights grouped for Zurich departure.",
    type: "Gi / No-Gi",
    prep: 74,
    spotsTotal: 24,
    estimatedCost: "$1,850",
  },
  {
    id: "berimbolo-lab-lisbon",
    name: "Berimbolo Lab Lisbon",
    date: "August 3, 2026",
    endDate: "August 6, 2026",
    location: "Lisbon, PT",
    city: "Lisbon, PT",
    venue: "Icon Jiu-Jitsu Lisboa",
    host: "Lachlan Giles & Forge guest coaches",
    focus: "Berimbolo entries, back attacks, modern guard",
    registered_students: ["st-001", "st-005", "st-006"],
    registration_deadline: "July 15, 2026",
    status: "Planning",
    notes: "Weekend intensive with evening open mats. Good add-on before European Masters season.",
    type: "Gi",
    prep: 52,
    spotsTotal: 18,
    estimatedCost: "$690",
  },
  {
    id: "mountain-gi-retreat",
    name: "Alpine Gi Retreat",
    date: "September 19, 2026",
    endDate: "September 22, 2026",
    location: "Zermatt, CH",
    city: "Zermatt, CH",
    venue: "Forge Mountain Lodge",
    host: "Sofia Almeida & Lina Okafor",
    focus: "Fundamentals refinement, mobility, mindset",
    registered_students: ["st-003", "st-004", "st-008"],
    registration_deadline: "August 30, 2026",
    status: "Early bird",
    notes: "Academy-only retreat with lodging and meals included. Limited to 16 athletes.",
    type: "Gi",
    prep: 38,
    spotsTotal: 16,
    estimatedCost: "$1,120",
  },
  {
    id: "nogi-radar-camp",
    name: "No-Gi Radar Camp",
    date: "October 10, 2026",
    endDate: "October 12, 2026",
    location: "London, UK",
    city: "London, UK",
    venue: "Roger Gracie Academy",
    host: "Forge competition team",
    focus: "Wrestling ties, leg entanglements, ADCC prep",
    registered_students: ["st-002", "st-005"],
    registration_deadline: "September 20, 2026",
    status: "Waitlist",
    notes: "High demand camp. Waitlist opens if an athlete drops. Travel support available.",
    type: "No-Gi",
    prep: 28,
    spotsTotal: 20,
    estimatedCost: "$540",
  },
];
