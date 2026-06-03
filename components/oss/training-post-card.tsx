"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Calendar,
  Flame,
  Megaphone,
  MessageCircle,
  Radio,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { typeLabels, type TrainingPost } from "@/data/training-feed";
import { cn } from "@/lib/utils";

const typeIcons = {
  session: Radio,
  promotion: Award,
  competition: Trophy,
  announcement: Megaphone,
  milestone: Sparkles,
  "open-mat": Flame,
};

export function TrainingPostCard({ post, index = 0 }: { post: TrainingPost; index?: number }) {
  const Icon = typeIcons[post.type];
  const [boosted, setBoosted] = useState(false);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [localNotes, setLocalNotes] = useState<string[]>([]);
  const reactions = post.reactions + (boosted ? 1 : 0);
  const comments = post.comments + localNotes.length;

  function addDiscussionNote() {
    const note = draft.trim();
    if (!note) return;
    setLocalNotes((current) => [note, ...current]);
    setDraft("");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <Card className={cn("overflow-hidden p-0", post.pinned && "ring-1 ring-[var(--accent)]/25")}>
        {post.pinned && (
          <div className="border-b border-[var(--accent)]/20 bg-[var(--accent)]/8 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
            Pinned · Live session recap
          </div>
        )}
        <div className="border-b border-[var(--border)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="gap-1">
                  <Icon size={13} />
                  {typeLabels[post.type]}
                </Badge>
                {post.className && <Badge variant="muted">{post.className}</Badge>}
              </div>
              <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] md:text-2xl">{post.title}</h2>
              <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                <span>Coach {post.coach}</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} />
                  {post.date} · {post.time}
                </span>
                {post.attendance != null && (
                  <span className="inline-flex items-center gap-1">
                    <Users size={12} />
                    {post.attendance} attended
                  </span>
                )}
              </p>
            </div>
            <div className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--accent)] px-3 py-2 text-center text-[var(--accent-foreground)]">
              <p className="text-xl font-black tabular-nums">{post.heat}</p>
              <p className="text-[10px] font-bold uppercase">heat</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{post.summary}</p>

          {(post.topParticipant || post.sparringHighlight) && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {post.topParticipant && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Top participant</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{post.topParticipant.name}</p>
                  <p className="text-xs text-[var(--muted)]">{post.topParticipant.note}</p>
                </div>
              )}
              {post.sparringHighlight && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Sparring highlight</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{post.sparringHighlight}</p>
                </div>
              )}
            </div>
          )}

          {post.achievements && post.achievements.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.achievements.map((a) => (
                <Badge key={a} variant="accent">
                  {a}
                </Badge>
              ))}
            </div>
          )}

          {post.taggedStudents && post.taggedStudents.length > 0 && (
            <p className="mt-4 text-xs text-[var(--muted)]">
              Tagged: {post.taggedStudents.join(" · ")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex gap-4 text-xs text-[var(--muted)]">
            <span>{reactions} reactions</span>
            <span>{comments} comments</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setBoosted((current) => !current)}
              aria-pressed={boosted}
            >
              <Zap size={14} /> {boosted ? "Boosted" : "Boost"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setDiscussionOpen((current) => !current)}
              aria-expanded={discussionOpen}
            >
              <MessageCircle size={14} /> Discuss
            </Button>
          </div>
        </div>
        {discussionOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--surface)]/55 px-5 py-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">Discussion</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {comments} coach and member comments are attached to this post.
            </p>
            {localNotes.length > 0 && (
              <div className="mt-3 space-y-2">
                {localNotes.map((note, noteIndex) => (
                  <div key={`${post.id}-note-${noteIndex}`} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
                    <p className="text-xs font-semibold text-[var(--foreground)]">You</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{note}</p>
                  </div>
                ))}
              </div>
            )}
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="mt-3 min-h-20 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 text-sm text-[var(--foreground)] outline-none ring-[var(--accent)]/35 placeholder:text-[var(--muted)] focus:border-[var(--accent)]/40 focus:ring-2"
              placeholder="Add a quick note for the team..."
            />
            <div className="mt-3 flex justify-end">
              <Button type="button" variant="primary" size="sm" disabled={!draft.trim()} onClick={addDiscussionNote}>
                Add note
              </Button>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
