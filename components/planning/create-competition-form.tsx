"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Trash2, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveClub } from "@/components/use-active-club";
import type { Competition } from "@/data/competitions";
import { formatApiError, readApiJson } from "@/lib/api-client";

type CompetitionFormState = {
  name: string;
  date: string;
  city: string;
  venue: string;
  type: string;
  deadline: string;
  notes: string;
};
type FormMessageState = { tone: "success" | "error"; text: string };

const emptyCompetitionForm: CompetitionFormState = {
  name: "New team tournament",
  date: "July 25, 2026",
  city: "San Diego, CA",
  venue: "Main event venue",
  type: "Gi / No-Gi",
  deadline: "July 10, 2026",
  notes: "Confirm divisions, coaches, rules meeting, and athlete roster.",
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `competition-${Date.now()}`;
}

export function CreateCompetitionForm({ clubSlug }: { clubSlug?: string }) {
  const activeClub = useActiveClub();
  const resolvedClubSlug = activeClub?.slug ?? clubSlug;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<FormMessageState | null>(null);
  const [form, setForm] = useState(emptyCompetitionForm);

  return (
    <>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Competition planning</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Create a tournament plan, then manage the athlete roster.</p>
            {message && <FormMessage message={message} className="mt-3" />}
          </div>
          <Button variant="primary" onClick={() => setOpen(true)}>
            <Trophy size={16} />
            Create competition
          </Button>
        </div>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerHeader onClose={() => setOpen(false)}>
          <DrawerTitle>New competition</DrawerTitle>
          <DrawerDescription>Set the event basics first. Add athletes from the roster after.</DrawerDescription>
        </DrawerHeader>
        <CompetitionDrawerForm
          form={form}
          loading={loading}
          message={message}
          onChange={setForm}
          onCancel={() => setOpen(false)}
          onSubmit={async () => {
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
            await saveCompetition(competition, resolvedClubSlug, "POST");
            setMessage({ tone: "success", text: "Competition plan saved." });
            setOpen(false);
            router.refresh();
          }}
          setLoading={setLoading}
          setMessage={setMessage}
        />
      </Drawer>
    </>
  );
}

export function EditCompetitionButton({ event, clubSlug }: { event: Competition; clubSlug?: string }) {
  const activeClub = useActiveClub();
  const resolvedClubSlug = activeClub?.slug ?? clubSlug;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<FormMessageState | null>(null);
  const [form, setForm] = useState<CompetitionFormState>({
    name: event.name,
    date: event.date,
    city: event.city,
    venue: event.venue,
    type: event.type,
    deadline: event.registration_deadline,
    notes: event.notes,
  });

  return (
    <>
      <Button variant="surface" size="sm" onClick={() => setOpen(true)}>
        Edit
      </Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerHeader onClose={() => setOpen(false)}>
          <DrawerTitle>Edit competition</DrawerTitle>
          <DrawerDescription>Update the tournament details without leaving the planning view.</DrawerDescription>
        </DrawerHeader>
        <CompetitionDrawerForm
          form={form}
          loading={loading}
          message={message}
          onChange={setForm}
          onCancel={() => setOpen(false)}
          onSubmit={async () => {
            await saveCompetition(
              {
                ...event,
                name: form.name,
                date: form.date,
                location: form.city,
                city: form.city,
                venue: form.venue,
                registration_deadline: form.deadline,
                notes: form.notes,
                type: form.type,
              },
              resolvedClubSlug,
              "PATCH",
            );
            setMessage({ tone: "success", text: "Competition updated." });
            setOpen(false);
            router.refresh();
          }}
          setLoading={setLoading}
          setMessage={setMessage}
        />
      </Drawer>
    </>
  );
}

export function DeleteCompetitionButton({ event, clubSlug }: { event: Competition; clubSlug?: string }) {
  const activeClub = useActiveClub();
  const resolvedClubSlug = activeClub?.slug ?? clubSlug;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<FormMessageState | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function deleteCompetition() {
    if (!confirming) {
      setConfirming(true);
      setMessage({ tone: "error", text: "Click delete again to confirm." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/competitions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id, ...(resolvedClubSlug ? { clubSlug: resolvedClubSlug } : {}) }),
      });
      const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string }>(response, "Competition delete failed.");
      if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Competition delete failed.", payload.requestId));
      setConfirming(false);
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Competition delete failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant={confirming ? "primary" : "outline"} size="sm" disabled={loading} onClick={deleteCompetition}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        {confirming ? "Confirm delete" : "Delete"}
      </Button>
      {message && <FormMessage message={message} className="max-w-56" />}
    </div>
  );
}

async function saveCompetition(competition: Competition, clubSlug?: string, method: "POST" | "PATCH" = "POST") {
  const response = await fetch("/api/competitions", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...competition, ...(clubSlug ? { clubSlug } : {}) }),
  });
  const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string }>(response, "Competition save failed.");
  if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Competition save failed.", payload.requestId));
}

function CompetitionDrawerForm({
  form,
  loading,
  message,
  onChange,
  onCancel,
  onSubmit,
  setLoading,
  setMessage,
}: {
  form: CompetitionFormState;
  loading: boolean;
  message: FormMessageState | null;
  onChange: Dispatch<SetStateAction<CompetitionFormState>>;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  setLoading: (value: boolean) => void;
  setMessage: (value: FormMessageState | null) => void;
}) {
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
          await onSubmit();
        } catch (error) {
          setMessage({ tone: "error", text: error instanceof Error ? error.message : "Competition save failed." });
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
        <p className="text-sm font-semibold text-[var(--foreground)]">Event details</p>
        <p className="mt-1 text-xs text-[var(--muted)]">Use the same format as existing academy events.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field id="competition-name" label="Name" value={form.name} onChange={(name) => onChange((value) => ({ ...value, name }))} />
        <Field id="competition-type" label="Type" value={form.type} onChange={(type) => onChange((value) => ({ ...value, type }))} />
        <Field id="competition-date" label="Date" value={form.date} onChange={(date) => onChange((value) => ({ ...value, date }))} />
        <Field id="competition-deadline" label="Registration deadline" value={form.deadline} onChange={(deadline) => onChange((value) => ({ ...value, deadline }))} />
        <Field id="competition-city" label="City" value={form.city} onChange={(city) => onChange((value) => ({ ...value, city }))} />
        <Field id="competition-venue" label="Venue" value={form.venue} onChange={(venue) => onChange((value) => ({ ...value, venue }))} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="competition-notes">Team notes</Label>
        <textarea
          id="competition-notes"
          value={form.notes}
          onChange={(event) => onChange((value) => ({ ...value, notes: event.target.value }))}
          className="min-h-24 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
        />
      </div>

      {message && <FormMessage message={message} />}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
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

function FormMessage({ message, className = "" }: { message: FormMessageState; className?: string }) {
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
