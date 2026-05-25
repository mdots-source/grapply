import { AppShell } from "@/components/app-shell";
import { DashboardGrid } from "@/components/dashboard-grid";
import { PageTransition } from "@/components/page-transition";

export default function DashboardPage() {
  return (
    <AppShell title="Academy Dashboard" subtitle="Attendance, classes, progression, and the moments that keep the room connected.">
      <PageTransition>
        <DashboardGrid />
      </PageTransition>
    </AppShell>
  );
}
