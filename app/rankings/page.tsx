import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { RankingsGrid } from "@/components/rankings-grid";
import { getVisibleRankingsData } from "@/lib/backend-data";
import { requireWorkspaceRole } from "@/lib/workspace-access";

export default async function RankingsPage() {
  const session = await requireWorkspaceRole(["owner", "admin", "coach", "member"], "/rankings");
  let initialRankingsError: string | null = null;
  const initialRankings = await getVisibleRankingsData({
    clubSlug: session.activeClub.slug,
    userId: session.user.id,
    userEmail: session.user.email,
    userName: session.user.name,
    role: session.activeRole,
  }).catch((error) => {
    initialRankingsError = error instanceof Error ? error.message : "Could not load rankings.";
    return [];
  });

  return (
    <AppShell title="Rankings" subtitle="Ranking points, competitive records, belt filters, and the kind of clear competitive ladder that keeps a team moving." initialSession={session}>
      <PageTransition>
        <RankingsGrid
          viewerRole={session.activeRole}
          initialRankings={initialRankings}
          initialRankingsError={initialRankingsError}
          initialClubSlug={session.activeClub.slug}
        />
      </PageTransition>
    </AppShell>
  );
}
