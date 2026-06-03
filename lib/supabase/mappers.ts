import type { Student } from "@/data/academy";
import type { Competition } from "@/data/competitions";
import type { Club, ClubClass, ClubMembership, PlatformUser } from "@/data/platform";
import type { TrainingCamp } from "@/data/training-camps";
import type { TrainingPost, TrainingPostType } from "@/data/training-feed";
import type { TableInsert, TableRow } from "@/lib/supabase/types";

export function toStudent(row: TableRow<"academy_members">): Student {
  return {
    id: row.id,
    name: row.name,
    belt: row.belt,
    stripes: row.stripes,
    role: row.role,
    status: row.status,
    totalHours: row.total_hours,
    classes30: row.classes_30,
    streak: row.streak,
    points: row.points,
    wins: row.wins,
    losses: row.losses,
    lastSeen: row.last_seen,
    focus: row.focus,
    avatar: row.avatar_url ?? undefined,
  };
}

export function toAcademyMemberInsert(member: Student, clubId: string): TableInsert<"academy_members"> {
  return {
    id: member.id,
    club_id: clubId,
    name: member.name,
    belt: member.belt,
    stripes: member.stripes,
    role: member.role,
    status: member.status,
    total_hours: member.totalHours,
    classes_30: member.classes30,
    streak: member.streak,
    points: member.points,
    wins: member.wins,
    losses: member.losses,
    last_seen: member.lastSeen,
    focus: member.focus,
    avatar_url: member.avatar ?? null,
    profile: {},
  };
}

export function toPlatformUser(row: TableRow<"app_users">): PlatformUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar_url ?? undefined,
    stravaStatus: "not_connected",
  };
}

export function toClub(row: TableRow<"clubs">): Club {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    status: row.status,
    memberCount: row.member_count,
    primaryCoach: row.primary_coach,
  };
}

export function toClubMembership(row: TableRow<"club_memberships">): ClubMembership {
  return {
    id: row.id,
    userId: row.user_id,
    clubId: row.club_id,
    role: row.role,
    invitedBy: row.invited_by ?? undefined,
    joinedAt: row.joined_at,
  };
}

export function toClubClass(row: TableRow<"club_classes">): ClubClass {
  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    coach: row.coach,
    day: row.day,
    time: row.time,
    mat: row.mat,
    level: row.level,
    checkedIn: row.checked_in,
  };
}

export function toCompetition(row: TableRow<"competitions">): Competition {
  return {
    id: row.id,
    name: row.name,
    date: row.date_text,
    location: row.location,
    city: row.city,
    venue: row.venue,
    registered_students: row.registered_member_ids,
    registration_deadline: row.registration_deadline,
    status: row.status,
    notes: row.notes,
    type: row.type,
    prep: row.prep,
  };
}

export function toCompetitionInsert(item: Competition, clubId: string): TableInsert<"competitions"> {
  return {
    id: item.id,
    club_id: clubId,
    name: item.name,
    date_text: item.date,
    location: item.location,
    city: item.city,
    venue: item.venue,
    registered_member_ids: item.registered_students,
    registration_deadline: item.registration_deadline,
    status: item.status,
    notes: item.notes,
    type: item.type,
    prep: item.prep,
  };
}

export function toTrainingCamp(row: TableRow<"training_camps">): TrainingCamp {
  return {
    id: row.id,
    name: row.name,
    date: row.date_text,
    endDate: row.end_date_text,
    location: row.location,
    city: row.city,
    venue: row.venue,
    host: row.host,
    focus: row.focus,
    registered_students: row.registered_member_ids,
    registration_deadline: row.registration_deadline,
    status: row.status,
    notes: row.notes,
    type: row.type,
    prep: row.prep,
    spotsTotal: row.spots_total,
    estimatedCost: row.estimated_cost,
  };
}

export function toTrainingCampInsert(item: TrainingCamp, clubId: string): TableInsert<"training_camps"> {
  return {
    id: item.id,
    club_id: clubId,
    name: item.name,
    date_text: item.date,
    end_date_text: item.endDate,
    location: item.location,
    city: item.city,
    venue: item.venue,
    host: item.host,
    focus: item.focus,
    registered_member_ids: item.registered_students,
    registration_deadline: item.registration_deadline,
    status: item.status,
    notes: item.notes,
    type: item.type,
    prep: item.prep,
    spots_total: item.spotsTotal,
    estimated_cost: item.estimatedCost,
  };
}

function isTrainingPostType(value: string): value is TrainingPostType {
  return ["session", "promotion", "competition", "announcement", "milestone", "open-mat"].includes(value);
}

export function toTrainingPost(row: TableRow<"training_posts">): TrainingPost {
  return {
    id: row.id,
    type: isTrainingPostType(row.type) ? row.type : "announcement",
    pinned: row.pinned || undefined,
    className: row.class_name ?? undefined,
    coach: row.coach,
    date: row.date_text,
    time: row.time_text,
    title: row.title,
    summary: row.summary,
    attendance: row.attendance ?? undefined,
    topParticipant: row.top_participant && typeof row.top_participant === "object" && !Array.isArray(row.top_participant)
      ? (row.top_participant as { name: string; note: string })
      : undefined,
    sparringHighlight: row.sparring_highlight ?? undefined,
    achievements: row.achievements ?? undefined,
    taggedStudents: row.tagged_students ?? undefined,
  };
}

export function toTrainingPostInsert(item: TrainingPost, clubId: string): TableInsert<"training_posts"> {
  return {
    id: item.id,
    club_id: clubId,
    type: item.type,
    pinned: item.pinned ?? false,
    class_name: item.className ?? null,
    coach: item.coach,
    date_text: item.date,
    time_text: item.time,
    title: item.title,
    summary: item.summary,
    attendance: item.attendance ?? null,
    top_participant: item.topParticipant ?? null,
    sparring_highlight: item.sparringHighlight ?? null,
    achievements: item.achievements ?? null,
    tagged_students: item.taggedStudents ?? null,
  };
}
