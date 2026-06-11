import { clubClasses } from "@/data/platform";
import { getBackendClubId, getMockClubId } from "@/lib/backend";
import { getReadableMemberIds } from "@/lib/member-visibility";
import { toClubClass } from "@/lib/supabase/mappers";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";
import type { PlatformRole } from "@/data/platform";
import type { Student } from "@/data/academy";
import type { TableRow } from "@/lib/supabase/types";

export type MemberProfileCheckIn = TableRow<"class_checkins"> & {
  class?: MemberProfileClass | null;
  member?: { id: string; name: string; belt?: Student["belt"]; stripes?: number; role?: string } | null;
};

export type MemberProfileClass = {
  id: string;
  userId?: string | null;
  name: string;
  day: string;
  time: string;
  coach: string;
  mat?: string;
};

export type MemberProfileLiveData = {
  checkIns: MemberProfileCheckIn[];
  classes: MemberProfileClass[];
  notes: TableRow<"coach_notes">[];
  promotions: TableRow<"member_promotions">[];
  goals: TableRow<"member_goals">[];
};

export async function getMemberProfileLiveData({
  clubSlug,
  memberId,
  userId,
  userEmail,
  role,
}: {
  clubSlug: string;
  memberId: string;
  userId: string;
  userEmail?: string | null;
  role: PlatformRole;
}): Promise<MemberProfileLiveData> {
  if (!isSupabaseConfigured()) {
    const mockClubId = getMockClubId(clubSlug);
    return {
      checkIns: [],
      classes: clubClasses.filter((item) => item.clubId === mockClubId).map((item) => ({
        id: item.id,
        userId: item.userId,
        name: item.name,
        day: item.day,
        time: item.time,
        coach: item.coach,
        mat: item.mat,
      })),
      notes: [],
      promotions: [],
      goals: [],
    };
  }

  const clubId = await getBackendClubId(clubSlug);
  if (!clubId) throw new Error("Club not found.");

  const readable = await getReadableMemberIds({
    clubId,
    requestedMemberId: memberId,
    userId,
    userEmail,
    role,
  });
  if ("error" in readable && readable.error) throw new Error("Member access denied.");
  if ("empty" in readable && readable.empty) return emptyLiveData();

  const memberIds = readable.scope === "own" ? readable.memberIds : [memberId];
  if (memberIds.length === 0) return emptyLiveData();
  const memberFilter = `member_id=in.(${memberIds.map(encodeURIComponent).join(",")})`;
  const canViewStaffHistory = role === "owner" || role === "admin" || role === "coach";

  const [checkIns, classes, notes, promotions, goals] = await Promise.all([
    selectRows("class_checkins", `select=*&club_id=eq.${clubId}&${memberFilter}&order=checked_in_at.desc`),
    selectRows("club_classes", `select=*&club_id=eq.${clubId}`),
    canViewStaffHistory
      ? selectRows("coach_notes", `select=*&club_id=eq.${clubId}&${memberFilter}&order=created_at.desc`)
      : Promise.resolve([]),
    selectRows("member_promotions", `select=*&club_id=eq.${clubId}&${memberFilter}&order=awarded_at.desc`),
    selectRows("member_goals", `select=*&club_id=eq.${clubId}&${memberFilter}&order=created_at.desc`),
  ]);

  return {
    checkIns: await enrichCheckIns(clubId, checkIns),
    classes: classes.map(toClubClass).map((item) => ({
      id: item.id,
      userId: item.userId,
      name: item.name,
      day: item.day,
      time: item.time,
      coach: item.coach,
      mat: item.mat,
    })),
    notes: filterReadableCoachNotes(notes, role, userId),
    promotions,
    goals,
  };
}

function emptyLiveData(): MemberProfileLiveData {
  return {
    checkIns: [],
    classes: [],
    notes: [],
    promotions: [],
    goals: [],
  };
}

async function enrichCheckIns(clubId: string, rows: TableRow<"class_checkins">[]): Promise<MemberProfileCheckIn[]> {
  if (rows.length === 0) return [];

  const classIds = Array.from(new Set(rows.map((row) => row.class_id).filter(Boolean)));
  const memberIds = Array.from(new Set(rows.map((row) => row.member_id).filter(Boolean)));
  const [classes, members] = await Promise.all([
    classIds.length
      ? selectRows("club_classes", `select=id,user_id,name,day,time,coach,mat&club_id=eq.${clubId}&id=in.(${classIds.map(encodeURIComponent).join(",")})`)
      : Promise.resolve([]),
    memberIds.length
      ? selectRows("academy_members", `select=id,name,belt,stripes,role&club_id=eq.${clubId}&id=in.(${memberIds.map(encodeURIComponent).join(",")})`)
      : Promise.resolve([]),
  ]);
  const classesById = new Map(classes.map((item) => [item.id, item]));
  const membersById = new Map(members.map((item) => [item.id, item]));

  return rows.map((row) => {
    const classRow = classesById.get(row.class_id);
    const memberRow = membersById.get(row.member_id);
    return {
      ...row,
      class: classRow
        ? {
            id: classRow.id,
            userId: classRow.user_id,
            name: classRow.name,
            day: classRow.day,
            time: classRow.time,
            coach: classRow.coach,
            mat: classRow.mat,
          }
        : null,
      member: memberRow
        ? {
            id: memberRow.id,
            name: memberRow.name,
            belt: memberRow.belt,
            stripes: memberRow.stripes,
            role: memberRow.role,
          }
        : null,
    };
  });
}

function filterReadableCoachNotes<T extends { visibility: string; coach_user_id: string | null }>(
  rows: T[],
  role: PlatformRole,
  userId: string,
) {
  if (role === "owner" || role === "admin") return rows;
  if (role !== "coach") return [];
  return rows.filter((row) => row.visibility !== "private" || row.coach_user_id === userId);
}
