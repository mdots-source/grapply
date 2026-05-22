import { students, type Student } from "@/data/academy";

export function resolveStudentsByIds(ids: string[], roster: Student[] = students): Student[] {
  return ids.map((id) => roster.find((member) => member.id === id)).filter((member): member is Student => Boolean(member));
}

export function countCompetitionTeam(roster: Student[] = students) {
  return roster.filter((member) => member.lastSeen === "Competition Team" || member.points >= 1500).length;
}
