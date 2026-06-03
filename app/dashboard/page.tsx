import { AppShell } from "@/components/app-shell";
import { DashboardGrid } from "@/components/dashboard-grid";
import { PageTransition } from "@/components/page-transition";
import { requireWorkspaceRole } from "@/lib/workspace-access";

export default async function DashboardPage() {
  const session = await requireWorkspaceRole(["owner", "admin", "coach"], "/dashboard");

  return (
    <AppShell title="Academy Dashboard" subtitle="Attendance, classes, progression, and the moments that keep the room connected." initialSession={session}>
      <PageTransition>
        <DashboardGrid />
      </PageTransition>
    </AppShell>
  );
}
