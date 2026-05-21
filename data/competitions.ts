export type Competition = {
  id: string;
  name: string;
  date: string;
  location: string;
  city: string;
  venue: string;
  registered_students: string[];
  registration_deadline: string;
  status: string;
  notes: string;
  type: string;
  prep: number;
};

export const competitions: Competition[] = [
  {
    id: "ibjjf-la-open",
    name: "IBJJF Los Angeles Open",
    date: "June 28, 2026",
    location: "Los Angeles, CA",
    city: "Los Angeles, CA",
    venue: "Long Beach Convention Center",
    registered_students: ["st-001", "st-002", "st-003", "st-005", "st-007"],
    registration_deadline: "June 20, 2026",
    status: "Registration open",
    notes: "Registration closes in 8 days. Gi and No-Gi divisions available.",
    type: "Gi / No-Gi",
    prep: 82,
  },
  {
    id: "ibjjf-zurich-open",
    name: "IBJJF Zurich Open",
    date: "June 14, 2026",
    location: "Zurich, CH",
    city: "Zurich, CH",
    venue: "Sporthalle Hardau",
    registered_students: ["st-001", "st-002", "st-003", "st-007"],
    registration_deadline: "May 31, 2026",
    status: "Registration open",
    notes: "Travel roster confirmed. Final weigh-ins scheduled on-site.",
    type: "Gi / No-Gi",
    prep: 76,
  },
  {
    id: "alps-grappling-cup",
    name: "Alps Grappling Cup",
    date: "July 5, 2026",
    location: "Geneva, CH",
    city: "Geneva, CH",
    venue: "Arena Vernets",
    registered_students: ["st-002", "st-005", "st-006"],
    registration_deadline: "June 18, 2026",
    status: "Planning",
    notes: "No-Gi only. Team camp the week before.",
    type: "No-Gi",
    prep: 58,
  },
  {
    id: "european-masters",
    name: "European Masters Trials",
    date: "August 22, 2026",
    location: "Milan, IT",
    city: "Milan, IT",
    venue: "Centro Sportivo Pavesi",
    registered_students: ["st-003", "st-005"],
    registration_deadline: "July 29, 2026",
    status: "Invite list",
    notes: "Invite-only event for brown and black belts.",
    type: "Gi",
    prep: 44,
  },
];
