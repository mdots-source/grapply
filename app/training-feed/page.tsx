import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { TrainingFeedTimeline } from "@/components/training-feed/training-feed-timeline";
import { Badge } from "@/components/ui/badge";
import { getTrainingPostsData } from "@/lib/backend-data";
import { requireWorkspaceRole } from "@/lib/workspace-access";

export default async function TrainingFeedPage({ searchParams }: { searchParams?: Promise<{ create?: string }> }) {
  const params = await searchParams;
  const session = await requireWorkspaceRole(["owner", "admin", "coach", "member"], `/training-feed${params?.create ? "?create=post" : ""}`);
  const trainingPosts = await getTrainingPostsData();
  const canCreatePost = session.activeRole !== "member";

  return (
    <AppShell
      title="Training Feed"
      subtitle="Academy memory — class recaps, promotions, competition moments, and the energy on the mats."
      initialSession={session}
    >
      <PageTransition>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge variant="accent">{trainingPosts.length} posts</Badge>
          <Badge>Timeline</Badge>
        </div>
        <TrainingFeedTimeline initialPosts={trainingPosts} initialCreatePost={canCreatePost && params?.create === "post"} canCreatePost={canCreatePost} />
      </PageTransition>
    </AppShell>
  );
}
