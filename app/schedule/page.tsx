import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { ScheduleGrid } from "@/components/schedule-grid";

export default function SchedulePage() {
  return (
    <AppShell title="Schedule" subtitle="Weekly academy planner with classes, coaches, rooms, levels, and capacity at a glance.">
      <PageTransition>
        <ScheduleGrid />
      </PageTransition>
    </AppShell>
  );
}
