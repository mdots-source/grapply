import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { TrainingFeedTimeline } from "@/components/training-feed/training-feed-timeline";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getTrainingPostsData } from "@/lib/backend-data";
import { requireWorkspaceRole } from "@/lib/workspace-access";
import { AlertTriangle } from "lucide-react";

export default async function TrainingFeedPage({ searchParams }: { searchParams?: Promise<{ create?: string }> }) {
  const params = await searchParams;
  const session = await requireWorkspaceRole(["owner", "admin", "coach", "member"], `/training-feed${params?.create ? "?create=post" : ""}`);
  let loadError: string | null = null;
  const trainingPosts = await getTrainingPostsData(session.activeClub.slug, {
    userId: session.user.id,
    userEmail: session.user.email,
    role: session.activeRole,
  }).catch((error) => {
    loadError = error instanceof Error ? error.message : "Could not load training feed.";
    return [];
  });
  const canCreatePost = session.activeRole !== "member";
  const canDeletePost = session.activeRole === "owner" || session.activeRole === "admin";

  return (
    <AppShell
      title="Training Feed"
      subtitle="Class recaps, promotions, competition updates, and member milestones."
      initialSession={session}
    >
      <PageTransition>
        {loadError ? (
          <FeedErrorState message={loadError} />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge variant="accent">{trainingPosts.length} posts</Badge>
              <Badge>Timeline</Badge>
            </div>
            <TrainingFeedTimeline
              initialPosts={trainingPosts}
              initialCreatePost={canCreatePost && params?.create === "post"}
              canCreatePost={canCreatePost}
              canDeletePost={canDeletePost}
              clubSlug={session.activeClub.slug}
            />
          </>
        )}
      </PageTransition>
    </AppShell>
  );
}

function FeedErrorState({ message }: { message: string }) {
  return (
    <Card className="mx-auto flex min-h-[320px] max-w-3xl flex-col items-center justify-center border-dashed p-8 text-center">
      <div className="grid size-14 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--accent-coral)]">
        <AlertTriangle size={26} />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-[var(--foreground)]">Training feed is unavailable</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{message}</p>
    </Card>
  );
}
