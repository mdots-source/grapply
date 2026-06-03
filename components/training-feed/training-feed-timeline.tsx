"use client";

import { useMemo, useState } from "react";
import { TrainingPostCard } from "@/components/oss/training-post-card";
import { CreateTrainingPostForm } from "@/components/training-feed/create-training-post-form";
import { type TrainingPost } from "@/data/training-feed";

export function TrainingFeedTimeline({
  initialPosts,
  initialCreatePost = false,
  canCreatePost = false,
}: {
  initialPosts: TrainingPost[];
  initialCreatePost?: boolean;
  canCreatePost?: boolean;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const pinned = useMemo(() => posts.filter((post) => post.pinned), [posts]);
  const rest = useMemo(() => posts.filter((post) => !post.pinned), [posts]);

  const addPost = (post: TrainingPost) => {
    setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {canCreatePost ? (
        <CreateTrainingPostForm initialOpen={initialCreatePost} onCreate={addPost} />
      ) : (
        <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Academy updates</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Coaches and academy staff publish recaps, announcements, and promotion updates here.
          </p>
        </div>
      )}
      {pinned.map((post, index) => (
        <TrainingPostCard key={post.id} post={post} index={index} />
      ))}
      <div className="border-t border-[var(--border)] pt-2">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Recent</p>
        {rest.map((post, index) => (
          <div key={post.id} className="mb-5">
            <TrainingPostCard post={post} index={index + pinned.length} />
          </div>
        ))}
      </div>
    </div>
  );
}
