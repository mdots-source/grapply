import { AppShell } from "@/components/app-shell";
import { DashboardGrid } from "@/components/dashboard-grid";
import { PageTransition } from "@/components/page-transition";

export default function DashboardPage() {
  return (
    <AppShell title="Grapply Command Center" subtitle="A living overview of attendance, classes, streaks, ranking movement, and the moments that make the room feel alive.">
      <PageTransition>
        <DashboardGrid />
      </PageTransition>
    </AppShell>
  );
}
