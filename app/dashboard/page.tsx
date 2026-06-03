import { AppShell } from "@/components/app-shell";
import { DashboardGrid } from "@/components/dashboard-grid";
import { PageTransition } from "@/components/page-transition";
import { requireWorkspaceRole } from "@/lib/workspace-access";

export default async function DashboardPage() {
  const session = await requireWorkspaceRole(["owner", "admin", "coach", "member"], "/dashboard");

  return (
    <AppShell title="Dashboard" subtitle="Today’s schedule, roster, and club activity." initialSession={session}>
      <PageTransition>
        <DashboardGrid viewerRole={session.activeRole} />
      </PageTransition>
    </AppShell>
  );
}
