import { NextResponse } from "next/server";
import {
  announcements,
  coachActions,
  communityHighlights,
  dashboardStats,
  promotions,
} from "@/data/dashboard";
import { academyMeta } from "@/data/academy-meta";
import { getBackendClubId } from "@/lib/backend";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(searchParams.get("club"));
      if (!clubId) {
        return NextResponse.json({ source: "supabase", meta: academyMeta, stats: dashboardStats, events: [] });
      }

      const [members, classes, events, competitions, posts] = await Promise.all([
        selectRows("academy_members", `select=*&club_id=eq.${clubId}`),
        selectRows("club_classes", `select=*&club_id=eq.${clubId}`),
        selectRows("dashboard_events", `select=*&club_id=eq.${clubId}`),
        selectRows("competitions", `select=*&club_id=eq.${clubId}`),
        selectRows("training_posts", `select=*&club_id=eq.${clubId}`),
      ]);

      const activeMembers = members.filter((member) => member.status === "active");
      const checkedInToday = classes.reduce((sum, item) => sum + item.checked_in, 0);
      const weeklyAttendance = posts.reduce((sum, post) => sum + (post.attendance ?? 0), 0);

      return NextResponse.json({
        source: "supabase",
        meta: {
          ...academyMeta,
          memberCount: members.length,
          checkedInToday,
          liveClass: classes[0]
            ? {
                name: classes[0].name,
                coach: classes[0].coach,
                room: classes[0].mat,
                time: classes[0].time,
                trainingType: classes[0].level,
              }
            : academyMeta.liveClass,
        },
        stats: {
          ...dashboardStats,
          activeStudents: activeMembers.length,
          inactiveStudents: members.length - activeMembers.length,
          checkedInToday,
          weeklyAttendance,
          trialStudents: members.filter((member) => Boolean(member.profile && typeof member.profile === "object" && "trial" in member.profile)).length,
        },
        events,
        competitions,
        posts,
      });
    } catch (error) {
      return NextResponse.json({
        source: "mock",
        meta: academyMeta,
        stats: dashboardStats,
        announcements,
        coachActions,
        promotions,
        communityHighlights,
        supabaseError: String(error),
      });
    }
  }

  return NextResponse.json({
    source: "mock",
    meta: academyMeta,
    stats: dashboardStats,
    announcements,
    coachActions,
    promotions,
    communityHighlights,
  });
}
