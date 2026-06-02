"use client";

import { useMemo, useState } from "react";
import { TrainingPostCard } from "@/components/oss/training-post-card";
import { CreateTrainingPostForm } from "@/components/training-feed/create-training-post-form";
import { type TrainingPost } from "@/data/training-feed";

export function TrainingFeedTimeline({
  initialPosts,
  initialCreatePost = false,
}: {
  initialPosts: TrainingPost[];
  initialCreatePost?: boolean;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const pinned = useMemo(() => posts.filter((post) => post.pinned), [posts]);
  const rest = useMemo(() => posts.filter((post) => !post.pinned), [posts]);

  const addPost = (post: TrainingPost) => {
    setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <CreateTrainingPostForm initialOpen={initialCreatePost} onCreate={addPost} />
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
