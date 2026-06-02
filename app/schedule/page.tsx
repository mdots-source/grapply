import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { ScheduleGrid } from "@/components/schedule-grid";

export default async function SchedulePage({ searchParams }: { searchParams?: Promise<{ create?: string }> }) {
  const params = await searchParams;

  return (
    <AppShell title="Schedule" subtitle="Weekly academy planner with classes, coaches, rooms, and training levels at a glance.">
      <PageTransition>
        <ScheduleGrid initialCreateClass={params?.create === "class"} />
      </PageTransition>
    </AppShell>
  );
}
