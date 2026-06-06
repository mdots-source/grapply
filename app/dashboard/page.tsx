import { AppShell } from "@/components/app-shell";
import { DashboardGrid } from "@/components/dashboard-grid";
import { PageTransition } from "@/components/page-transition";
import { getDashboardData } from "@/lib/backend-data";
import { requireWorkspaceRole } from "@/lib/workspace-access";

export default async function DashboardPage() {
  const session = await requireWorkspaceRole(["owner", "admin", "coach", "member"], "/dashboard");
  let initialDashboard = null;
  let initialError: string | null = null;

  try {
    initialDashboard = await getDashboardData(session.activeClub.slug, {
      userId: session.user.id,
      userEmail: session.user.email,
      role: session.activeRole,
    });
  } catch (error) {
    initialError = error instanceof Error ? error.message : "Dashboard data failed.";
  }

  return (
    <AppShell title="Dashboard" subtitle="Today’s schedule, roster, and club activity." initialSession={session}>
      <PageTransition>
        <DashboardGrid
          viewerRole={session.activeRole}
          initialDashboard={initialDashboard}
          initialError={initialError}
          initialClubSlug={session.activeClub.slug}
        />
      </PageTransition>
    </AppShell>
  );
}
