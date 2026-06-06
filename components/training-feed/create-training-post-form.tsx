"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveClub } from "@/components/use-active-club";
import { type TrainingPost, type TrainingPostType, typeLabels } from "@/data/training-feed";
import { formatApiError, readApiJson } from "@/lib/api-client";

const postTypes = Object.keys(typeLabels) as TrainingPostType[];

export function CreateTrainingPostForm({
  initialOpen = false,
  clubSlug,
  defaultCoachName,
  onCreate,
}: {
  initialOpen?: boolean;
  clubSlug: string;
  defaultCoachName: string;
  onCreate?: (post: TrainingPost) => void;
}) {
  const activeClub = useActiveClub();
  const [open, setOpen] = useState(initialOpen);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({
    type: "session" as TrainingPostType,
    coach: defaultCoachName,
    className: "Advanced No-Gi",
    title: "Strong rounds and guard retention work",
    summary: "Competition team worked positional starts, guard recovery, and five-minute rounds.",
    attendance: "24",
  });

  if (!open) {
    return (
      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Create training post</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Publish a recap, announcement, promotion, or open mat update.</p>
            {message && <FormMessage message={message} className="mt-3" />}
          </div>
          <Button variant="primary" data-create-training-post onClick={() => setOpen(true)}>
            <Send size={16} />
            New post
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="mb-6 space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
          const coach = form.coach.trim();
          const className = form.className.trim();
          const title = form.title.trim();
          const summary = form.summary.trim();
          if (!coach || !title || !summary) {
            throw new Error("Coach, title, and summary are required.");
          }
          const attendance = parseAttendance(form.attendance);
          if (attendance.error) throw new Error(attendance.error);
          const now = new Date();
          const draftPost: TrainingPost = {
            id: `tf-${crypto.randomUUID().slice(0, 8)}`,
            type: form.type,
            pinned: false,
            coach,
            className: className || undefined,
            date: "Today",
            time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            title,
            summary,
            ...(typeof attendance.value === "number" ? { attendance: attendance.value } : {}),
          };
          const response = await fetch("/api/training-feed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...draftPost, clubSlug: activeClub?.slug ?? clubSlug }),
          });
          const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string; post?: TrainingPost }>(response, "Post creation failed.");
          if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Post creation failed.", payload.requestId));
          onCreate?.(payload.post ?? draftPost);
          setMessage({ tone: "success", text: "Post published to the timeline." });
          setOpen(false);
        } catch (error) {
          setMessage({ tone: "error", text: error instanceof Error ? error.message : "Post creation failed." });
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">New training post</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Share a clear recap with the academy.</p>
        </div>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="post-type">Type</Label>
          <select
            id="post-type"
            value={form.type}
            onChange={(event) => setForm((value) => ({ ...value, type: event.target.value as TrainingPostType }))}
            className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
          >
            {postTypes.map((type) => (
              <option key={type} value={type} className="bg-[var(--panel-strong)] text-[var(--foreground)]">
                {typeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <Field id="post-coach" label="Coach" value={form.coach} onChange={(coach) => setForm((value) => ({ ...value, coach }))} />
        <Field id="post-class" label="Class" value={form.className} onChange={(className) => setForm((value) => ({ ...value, className }))} />
        <Field id="post-attendance" label="Attendance" value={form.attendance} inputMode="numeric" onChange={(attendance) => setForm((value) => ({ ...value, attendance }))} />
      </div>

      <Field id="post-title" label="Title" value={form.title} onChange={(title) => setForm((value) => ({ ...value, title }))} />

      <div className="space-y-1.5">
        <Label htmlFor="post-summary">Summary</Label>
        <textarea
          id="post-summary"
          value={form.summary}
          onChange={(event) => setForm((value) => ({ ...value, summary: event.target.value }))}
          rows={4}
          required
          className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
        />
      </div>

      {message && <FormMessage message={message} />}
      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Publish
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  inputMode,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} required />
    </div>
  );
}

function FormMessage({
  message,
  className = "",
}: {
  message: { tone: "success" | "error"; text: string };
  className?: string;
}) {
  return (
    <div
      className={`${className} flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-semibold text-[var(--foreground)] ${
        message.tone === "success"
          ? "border-[var(--status-success)]/25 bg-[var(--status-success)]/10"
          : "border-[var(--status-danger)]/25 bg-[var(--status-danger)]/10"
      }`}
    >
      {message.tone === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
      <span>{message.text}</span>
    </div>
  );
}

function parseAttendance(value: string): { value?: number; error?: never } | { value?: never; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return {};
  const attendance = Number(trimmed);
  if (!Number.isInteger(attendance) || attendance < 0 || attendance > 10000) {
    return { error: "Attendance must be a whole number between 0 and 10000." };
  }
  return { value: attendance };
}
