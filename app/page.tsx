import { AppShell } from "@/components/app-shell";
import { DashboardGrid } from "@/components/dashboard-grid";

export default function DashboardPage() {
  return (
    <AppShell title="Academy Command Center" subtitle="A living overview of attendance, classes, streaks, ranking movement, and the moments that make the room feel alive.">
      <DashboardGrid />
    </AppShell>
  );
}
