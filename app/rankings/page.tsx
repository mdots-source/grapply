import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { RankingsGrid } from "@/components/rankings-grid";
import { requireWorkspaceRole } from "@/lib/workspace-access";

export default async function RankingsPage() {
  const session = await requireWorkspaceRole(["owner", "admin", "coach"], "/rankings");

  return (
    <AppShell title="Rankings" subtitle="Ranking points, competitive records, belt filters, and the kind of clear competitive ladder that keeps a team moving." initialSession={session}>
      <PageTransition>
        <RankingsGrid />
      </PageTransition>
    </AppShell>
  );
}
