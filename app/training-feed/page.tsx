import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { TrainingPostCard } from "@/components/oss/training-post-card";
import { CreateTrainingPostForm } from "@/components/training-feed/create-training-post-form";
import { Badge } from "@/components/ui/badge";
import { getTrainingPostsData } from "@/lib/backend-data";

export default async function TrainingFeedPage() {
  const trainingPosts = await getTrainingPostsData();
  const pinned = trainingPosts.filter((p) => p.pinned);
  const rest = trainingPosts.filter((p) => !p.pinned);

  return (
    <AppShell
      title="Training Feed"
      subtitle="Academy memory — class recaps, promotions, competition moments, and the energy on the mats."
    >
      <PageTransition>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge variant="accent">{trainingPosts.length} posts</Badge>
          <Badge>Timeline</Badge>
          <Badge variant="muted">Reactions & comments (demo)</Badge>
        </div>
        <div className="mx-auto max-w-3xl space-y-5">
          <CreateTrainingPostForm />
          {pinned.map((post, i) => (
            <TrainingPostCard key={post.id} post={post} index={i} />
          ))}
          <div className="border-t border-[var(--border)] pt-2">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Recent</p>
            {rest.map((post, i) => (
              <div key={post.id} className="mb-5">
                <TrainingPostCard post={post} index={i + pinned.length} />
              </div>
            ))}
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
