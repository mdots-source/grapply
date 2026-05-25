"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type TrainingPostType, typeLabels } from "@/data/training-feed";

const postTypes = Object.keys(typeLabels) as TrainingPostType[];

export function CreateTrainingPostForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "session" as TrainingPostType,
    coach: "Sofia Almeida",
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
          </div>
          <Button variant="primary" onClick={() => setOpen(true)}>
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
          const now = new Date();
          const response = await fetch("/api/training-feed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: `tf-${crypto.randomUUID().slice(0, 8)}`,
              type: form.type,
              pinned: false,
              coach: form.coach,
              className: form.className || undefined,
              date: "Today",
              time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
              title: form.title,
              summary: form.summary,
              attendance: Number(form.attendance) || undefined,
              reactions: 0,
              comments: 0,
              heat: 35,
            }),
          });
          const payload = (await response.json()) as { ok?: boolean; error?: string };
          if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Post creation failed.");
          setMessage("Post saved in Supabase. Refresh the feed to see it in the timeline.");
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Post creation failed.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">New training post</p>
          <p className="mt-1 text-xs text-[var(--muted)]">This writes to the active club feed.</p>
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
        <Field id="post-attendance" label="Attendance" value={form.attendance} onChange={(attendance) => setForm((value) => ({ ...value, attendance }))} />
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

      {message && <p className="text-xs text-[var(--muted)]">{message}</p>}
      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Publish
      </Button>
    </form>
  );
}

function Field({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} required />
    </div>
  );
}
