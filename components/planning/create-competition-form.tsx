"use client";

import { useState } from "react";
import { Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveClub } from "@/components/use-active-club";
import type { Competition } from "@/data/competitions";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `competition-${Date.now()}`;
}

export function CreateCompetitionForm() {
  const activeClub = useActiveClub();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "New team tournament",
    date: "July 25, 2026",
    city: "San Diego, CA",
    venue: "Main event venue",
    type: "Gi / No-Gi",
    deadline: "July 10, 2026",
    notes: "Confirm divisions, coaches, rules meeting, and athlete roster.",
  });

  if (!open) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Competition planning</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Create a tournament plan, then manage the athlete roster.</p>
            {message && <p className="mt-3 rounded-lg border border-[var(--status-success)]/25 bg-[var(--status-success)]/10 px-3 py-2 text-xs font-semibold">{message}</p>}
          </div>
          <Button variant="primary" onClick={() => setOpen(true)}>
            <Trophy size={16} />
            Create competition
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
          const competition: Competition = {
            id: `${slugify(form.name)}-${crypto.randomUUID().slice(0, 6)}`,
            name: form.name,
            date: form.date,
            location: form.city,
            city: form.city,
            venue: form.venue,
            registered_students: [],
            registration_deadline: form.deadline,
            status: "Planning",
            notes: form.notes,
            type: form.type,
            prep: 0,
          };
          const response = await fetch("/api/competitions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...competition, ...(activeClub?.slug ? { clubSlug: activeClub.slug } : {}) }),
          });
          const payload = (await response.json()) as { ok?: boolean; error?: string };
          if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Competition creation failed.");
          setMessage("Competition plan saved.");
          setOpen(false);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Competition creation failed.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">New competition</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Set the event basics first. Add athletes from the roster after.</p>
        </div>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field id="competition-name" label="Name" value={form.name} onChange={(name) => setForm((value) => ({ ...value, name }))} />
        <Field id="competition-type" label="Type" value={form.type} onChange={(type) => setForm((value) => ({ ...value, type }))} />
        <Field id="competition-date" label="Date" value={form.date} onChange={(date) => setForm((value) => ({ ...value, date }))} />
        <Field id="competition-deadline" label="Registration deadline" value={form.deadline} onChange={(deadline) => setForm((value) => ({ ...value, deadline }))} />
        <Field id="competition-city" label="City" value={form.city} onChange={(city) => setForm((value) => ({ ...value, city }))} />
        <Field id="competition-venue" label="Venue" value={form.venue} onChange={(venue) => setForm((value) => ({ ...value, venue }))} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="competition-notes">Team notes</Label>
        <textarea
          id="competition-notes"
          value={form.notes}
          onChange={(event) => setForm((value) => ({ ...value, notes: event.target.value }))}
          className="min-h-24 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
        />
      </div>

      {message && <p className="text-xs text-[var(--muted)]">{message}</p>}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Trophy size={16} />}
          Save competition
        </Button>
      </div>
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
