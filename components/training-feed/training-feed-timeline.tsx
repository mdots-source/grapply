"use client";

import { useMemo, useState } from "react";
import { Megaphone, Plus, Radio, Search } from "lucide-react";
import { TrainingPostCard } from "@/components/oss/training-post-card";
import { CreateTrainingPostForm } from "@/components/training-feed/create-training-post-form";
import type { PlatformRole } from "@/data/platform";
import { typeLabels, type TrainingPost } from "@/data/training-feed";
import { Button } from "@/components/ui/button";

type FeedFilter = "all" | TrainingPost["type"];

const filters: { value: FeedFilter; label: string }[] = [
  { value: "all", label: "All posts" },
  { value: "session", label: "Sessions" },
  { value: "announcement", label: "Announcements" },
  { value: "promotion", label: "Promotions" },
  { value: "competition", label: "Competitions" },
];

export function TrainingFeedTimeline({
  initialPosts,
  initialCreatePost = false,
  canCreatePost = false,
  currentRole,
  currentUserName,
  clubSlug,
}: {
  initialPosts: TrainingPost[];
  initialCreatePost?: boolean;
  canCreatePost?: boolean;
  currentRole: PlatformRole;
  currentUserName: string;
  clubSlug: string;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const visiblePosts = useMemo(() => posts.filter((post) => filter === "all" || post.type === filter), [filter, posts]);
  const pinned = useMemo(() => visiblePosts.filter((post) => post.pinned), [visiblePosts]);
  const rest = useMemo(() => visiblePosts.filter((post) => !post.pinned), [visiblePosts]);

  const addPost = (post: TrainingPost) => {
    setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);
  };

  const removePost = (postId: string) => {
    setPosts((current) => current.filter((post) => post.id !== postId));
  };

  const updatePost = (post: TrainingPost) => {
    setPosts((current) => current.map((item) => (item.id === post.id ? post : item)));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {canCreatePost ? (
        <CreateTrainingPostForm initialOpen={initialCreatePost} clubSlug={clubSlug} defaultCoachName={currentUserName} onCreate={addPost} />
      ) : (
        <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Academy updates</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Coaches and academy staff publish recaps, announcements, and promotion updates here.
          </p>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              filter === item.value
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            }`}
            aria-pressed={filter === item.value}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visiblePosts.length === 0 ? (
        <FeedEmptyState
          filter={filter}
          canCreatePost={canCreatePost}
          onClear={() => setFilter("all")}
          onCreate={() => {
            const formButton = document.querySelector<HTMLButtonElement>("[data-create-training-post]");
            formButton?.click();
          }}
        />
      ) : (
        <>
          {pinned.map((post, index) => (
            <TrainingPostCard
              key={post.id}
              post={post}
              index={index}
              canComment={canCreatePost}
              canEdit={canManagePost(post, currentRole, currentUserName)}
              canDelete={canManagePost(post, currentRole, currentUserName)}
              clubSlug={clubSlug}
              onDelete={removePost}
              onUpdate={updatePost}
            />
          ))}
          <div className="border-t border-[var(--border)] pt-2">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {filter === "all" ? "Recent" : typeLabels[filter]}
            </p>
            {rest.map((post, index) => (
              <div key={post.id} className="mb-5">
                <TrainingPostCard
                  post={post}
                  index={index + pinned.length}
                  canComment={canCreatePost}
                  canEdit={canManagePost(post, currentRole, currentUserName)}
                  canDelete={canManagePost(post, currentRole, currentUserName)}
                  clubSlug={clubSlug}
                  onDelete={removePost}
                  onUpdate={updatePost}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function canManagePost(post: TrainingPost, role: PlatformRole, userName: string) {
  if (role === "owner" || role === "admin") return true;
  if (role !== "coach") return false;
  return post.coach.trim().toLowerCase() === userName.trim().toLowerCase();
}

function FeedEmptyState({
  filter,
  canCreatePost,
  onClear,
  onCreate,
}: {
  filter: FeedFilter;
  canCreatePost: boolean;
  onClear: () => void;
  onCreate: () => void;
}) {
  const isAll = filter === "all";
  const Icon = isAll ? Megaphone : filter === "session" ? Radio : Search;

  return (
    <div className="grid min-h-[360px] place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--accent)]">
          <Icon size={26} strokeWidth={1.6} />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-[var(--foreground)]">
          {isAll ? "No training posts yet." : `No ${typeLabels[filter].toLowerCase()} posts yet.`}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {isAll
            ? "Training recaps, announcements, promotions, and competition moments will appear here."
            : "Switch back to all posts or publish a new update for this academy."}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          {!isAll && (
            <Button variant="surface" onClick={onClear}>
              Show all posts
            </Button>
          )}
          {canCreatePost && (
            <Button variant="primary" onClick={onCreate}>
              <Plus size={16} />
              New training post
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
