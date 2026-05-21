import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { RankingsGrid } from "@/components/rankings-grid";

export default function RankingsPage() {
  return (
    <AppShell title="Rankings" subtitle="Ranking points, competitive records, belt filters, and the kind of clear competitive ladder that keeps a team moving.">
      <PageTransition>
        <RankingsGrid />
      </PageTransition>
    </AppShell>
  );
}
