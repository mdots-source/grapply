"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Calendar,
  Flame,
  Loader2,
  Megaphone,
  MessageCircle,
  Pencil,
  Radio,
  Save,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveClub } from "@/components/use-active-club";
import { typeLabels, type TrainingPost, type TrainingPostType } from "@/data/training-feed";
import { formatApiError, readApiJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const typeIcons = {
  session: Radio,
  promotion: Award,
  competition: Trophy,
  announcement: Megaphone,
  milestone: Sparkles,
  "open-mat": Flame,
};

export function TrainingPostCard({
  post,
  index = 0,
  canComment = false,
  canEdit = false,
  canDelete = false,
  canChangeCoach = false,
  clubSlug,
  onDelete,
  onUpdate,
}: {
  post: TrainingPost;
  index?: number;
  canComment?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canChangeCoach?: boolean;
  clubSlug: string;
  onDelete?: (postId: string) => void;
  onUpdate?: (post: TrainingPost) => void;
}) {
  const Icon = typeIcons[post.type];
  const activeClub = useActiveClub();
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [localNotes, setLocalNotes] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(() => toEditForm(post));

  function addDiscussionNote() {
    const note = draft.trim();
    if (!note) return;
    setLocalNotes((current) => [note, ...current]);
    setDraft("");
  }

  async function deletePost() {
    setDeleting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/training-feed", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, clubSlug: activeClub?.slug ?? clubSlug }),
      });
      const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string }>(response, "Post delete failed.");
      if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Post delete failed.", payload.requestId));
      onDelete?.(post.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Post delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  async function savePost() {
    const attendance = editForm.attendance.trim() ? Number(editForm.attendance) : undefined;
    const coach = editForm.coach.trim();
    const title = editForm.title.trim();
    const summary = editForm.summary.trim();
    if (!coach || !title || !summary) {
      setMessage("Coach, title, and summary are required.");
      return;
    }
    if (attendance !== undefined && (!Number.isInteger(attendance) || attendance < 0 || attendance > 10000)) {
      setMessage("Attendance must be a whole number between 0 and 10000.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const updatedPost: TrainingPost = {
        ...post,
        type: editForm.type,
        coach,
        className: editForm.className.trim() || undefined,
        title,
        summary,
        attendance,
      };
      const response = await fetch("/api/training-feed", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updatedPost, clubSlug: activeClub?.slug ?? clubSlug }),
      });
      const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string; post?: TrainingPost }>(response, "Post update failed.");
      if (!payload.ok || !payload.post) throw new Error(formatApiError(payload.error ?? "Post update failed.", payload.requestId));
      onUpdate?.(payload.post);
      setEditForm(toEditForm(payload.post));
      setEditing(false);
      setMessage("Post updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Post update failed.");
    } finally {
      setSaving(false);
    }
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
          </div>
          {editing ? (
            <div className="mt-5 space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`post-type-${post.id}`}>Type</Label>
                  <select
                    id={`post-type-${post.id}`}
                    value={editForm.type}
                    onChange={(event) => setEditForm((value) => ({ ...value, type: event.target.value as TrainingPostType }))}
                    className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  >
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <EditField
                  id={`post-coach-${post.id}`}
                  label="Coach"
                  value={editForm.coach}
                  disabled={!canChangeCoach}
                  onChange={(coach) => setEditForm((value) => ({ ...value, coach }))}
                />
                <EditField id={`post-class-${post.id}`} label="Class" value={editForm.className} onChange={(className) => setEditForm((value) => ({ ...value, className }))} />
                <EditField id={`post-attendance-${post.id}`} label="Attendance" value={editForm.attendance} onChange={(attendance) => setEditForm((value) => ({ ...value, attendance }))} />
              </div>
              <EditField id={`post-title-${post.id}`} label="Title" value={editForm.title} onChange={(title) => setEditForm((value) => ({ ...value, title }))} />
              <div className="space-y-1.5">
                <Label htmlFor={`post-summary-${post.id}`}>Summary</Label>
                <textarea
                  id={`post-summary-${post.id}`}
                  value={editForm.summary}
                  onChange={(event) => setEditForm((value) => ({ ...value, summary: event.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{post.summary}</p>
          )}

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
          <p className="text-xs text-[var(--muted)]">
            {post.className ? `${post.className} update` : `${typeLabels[post.type]} update`}
          </p>
          <div className="flex gap-2">
          {canEdit && (
            <Button
              type="button"
              variant={editing ? "primary" : "surface"}
              size="sm"
              className="gap-1.5"
              disabled={saving}
              onClick={() => {
                if (editing) void savePost();
                else {
                  setEditForm(toEditForm(post));
                  setMessage(null);
                  setEditing(true);
                }
              }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : editing ? <Save size={14} /> : <Pencil size={14} />}
              {editing ? "Save" : "Edit"}
            </Button>
          )}
          {editing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={() => {
                setEditForm(toEditForm(post));
                setEditing(false);
                setMessage(null);
              }}
            >
              <X size={14} />
              Cancel
            </Button>
          )}
          {canComment && !editing && (
            <div className="flex gap-2">
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
          )}
          </div>
          {canDelete && (
            <Button type="button" variant="outline" size="sm" disabled={deleting} onClick={deletePost}>
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </Button>
          )}
        </div>
        {message && <p className="px-5 pb-4 text-xs text-[var(--muted)]">{message}</p>}
        {canComment && discussionOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--surface)]/55 px-5 py-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">Discussion</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Add private planning notes for the staff team.</p>
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

function toEditForm(post: TrainingPost) {
  return {
    type: post.type,
    coach: post.coach,
    className: post.className ?? "",
    title: post.title,
    summary: post.summary,
    attendance: post.attendance == null ? "" : String(post.attendance),
  };
}

function EditField({
  id,
  label,
  value,
  disabled = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
