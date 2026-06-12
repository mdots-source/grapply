import { StudentMiniApp } from "@/components/student-app/student-mini-app";
import { getCurrentSessionWithRefresh } from "@/lib/auth-session";
import {
  getClassesData,
  getCompetitionsData,
  getDashboardData,
  getMembersData,
  getTrainingCampsData,
  getTrainingPostsData,
} from "@/lib/backend-data";

export default async function MobileAppPage() {
  const { session } = await getCurrentSessionWithRefresh();

  if (!session?.activeClub || !session.activeRole) {
    return <StudentMiniApp session={null} />;
  }

  const viewer = {
    userId: session.user.id,
    userEmail: session.user.email,
    userName: session.user.name,
    role: session.activeRole,
  };

  const [dashboard, classes, competitions, trainingCamps, members, posts] = await Promise.all([
    getDashboardData(session.activeClub.slug, viewer).catch(() => null),
    getClassesData(session.activeClub.slug).catch(() => []),
    getCompetitionsData(session.activeClub.slug, viewer).catch(() => []),
    getTrainingCampsData(session.activeClub.slug, viewer).catch(() => []),
    getMembersData(session.activeClub.slug).catch(() => []),
    getTrainingPostsData(session.activeClub.slug, viewer).catch(() => []),
  ]);
  const rankings = members
    .sort((a, b) => b.points - a.points)
    .map((member, index) => ({ ...member, rank: index + 1 }));

  return (
    <StudentMiniApp
      session={{
        user: session.user,
        activeClub: session.activeClub,
        activeRole: session.activeRole,
      }}
      initialData={{
        dashboard,
        classes,
        competitions,
        trainingCamps,
        rankings,
        posts,
      }}
    />
  );
}
