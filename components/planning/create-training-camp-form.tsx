"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { Loader2, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveClub } from "@/components/use-active-club";
import type { TrainingCamp } from "@/data/training-camps";

type TrainingCampFormState = {
  name: string;
  date: string;
  endDate: string;
  city: string;
  venue: string;
  host: string;
  focus: string;
  type: string;
  deadline: string;
  spotsTotal: string;
  estimatedCost: string;
  notes: string;
};

const emptyCampForm: TrainingCampFormState = {
  name: "New academy camp",
  date: "August 12, 2026",
  endDate: "August 15, 2026",
  city: "San Diego, CA",
  venue: "Host academy",
  host: "Grapply coaching team",
  focus: "Competition rounds, positional drilling, and recovery blocks",
  type: "Gi / No-Gi",
  deadline: "July 30, 2026",
  spotsTotal: "20",
  estimatedCost: "$750",
  notes: "Plan travel, room blocks, coaches, deposits, and athlete roster.",
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `camp-${Date.now()}`;
}

export function CreateTrainingCampForm() {
  const activeClub = useActiveClub();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCampForm);

  return (
    <>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Camp planning</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Create a camp plan with travel basics and roster space.</p>
            {message && <p className="mt-3 rounded-lg border border-[var(--status-success)]/25 bg-[var(--status-success)]/10 px-3 py-2 text-xs font-semibold">{message}</p>}
          </div>
          <Button variant="primary" onClick={() => setOpen(true)}>
            <Mountain size={16} />
            Create camp
          </Button>
        </div>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerHeader onClose={() => setOpen(false)}>
          <DrawerTitle>New training camp</DrawerTitle>
          <DrawerDescription>Capture the travel basics first. Add athletes from the roster after.</DrawerDescription>
        </DrawerHeader>
        <TrainingCampDrawerForm
          form={form}
          loading={loading}
          message={message}
          onChange={setForm}
          onCancel={() => setOpen(false)}
          onSubmit={async () => {
            const camp: TrainingCamp = {
              id: `${slugify(form.name)}-${crypto.randomUUID().slice(0, 6)}`,
              name: form.name,
              date: form.date,
              endDate: form.endDate,
              location: form.city,
              city: form.city,
              venue: form.venue,
              host: form.host,
              focus: form.focus,
              registered_students: [],
              registration_deadline: form.deadline,
              status: "Planning",
              notes: form.notes,
              type: form.type,
              prep: 0,
              spotsTotal: Number(form.spotsTotal) || 20,
              estimatedCost: form.estimatedCost,
            };
            await saveTrainingCamp(camp, activeClub?.slug);
            setMessage("Camp plan saved.");
            setOpen(false);
          }}
          setLoading={setLoading}
          setMessage={setMessage}
        />
      </Drawer>
    </>
  );
}

export function EditTrainingCampButton({ camp }: { camp: TrainingCamp }) {
  const activeClub = useActiveClub();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<TrainingCampFormState>({
    name: camp.name,
    date: camp.date,
    endDate: camp.endDate,
    city: camp.city,
    venue: camp.venue,
    host: camp.host,
    focus: camp.focus,
    type: camp.type,
    deadline: camp.registration_deadline,
    spotsTotal: String(camp.spotsTotal),
    estimatedCost: camp.estimatedCost,
    notes: camp.notes,
  });

  return (
    <>
      <Button variant="surface" size="sm" onClick={() => setOpen(true)}>
        Edit
      </Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerHeader onClose={() => setOpen(false)}>
          <DrawerTitle>Edit training camp</DrawerTitle>
          <DrawerDescription>Update travel basics, focus, spots, and registration details.</DrawerDescription>
        </DrawerHeader>
        <TrainingCampDrawerForm
          form={form}
          loading={loading}
          message={message}
          onChange={setForm}
          onCancel={() => setOpen(false)}
          onSubmit={async () => {
            await saveTrainingCamp(
              {
                ...camp,
                name: form.name,
                date: form.date,
                endDate: form.endDate,
                location: form.city,
                city: form.city,
                venue: form.venue,
                host: form.host,
                focus: form.focus,
                registration_deadline: form.deadline,
                notes: form.notes,
                type: form.type,
                spotsTotal: Number(form.spotsTotal) || camp.spotsTotal,
                estimatedCost: form.estimatedCost,
              },
              activeClub?.slug,
            );
            setMessage("Training camp updated.");
            setOpen(false);
          }}
          setLoading={setLoading}
          setMessage={setMessage}
        />
      </Drawer>
    </>
  );
}

async function saveTrainingCamp(camp: TrainingCamp, clubSlug?: string) {
  const response = await fetch("/api/training-camps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...camp, ...(clubSlug ? { clubSlug } : {}) }),
  });
  const payload = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Camp save failed.");
}

function TrainingCampDrawerForm({
  form,
  loading,
  message,
  onChange,
  onCancel,
  onSubmit,
  setLoading,
  setMessage,
}: {
  form: TrainingCampFormState;
  loading: boolean;
  message: string | null;
  onChange: Dispatch<SetStateAction<TrainingCampFormState>>;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  setLoading: (value: boolean) => void;
  setMessage: (value: string | null) => void;
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
          setMessage(error instanceof Error ? error.message : "Camp save failed.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
        <p className="text-sm font-semibold text-[var(--foreground)]">Camp details</p>
        <p className="mt-1 text-xs text-[var(--muted)]">Plan travel, coaching focus, spots, and the registration window.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field id="camp-name" label="Name" value={form.name} onChange={(name) => onChange((value) => ({ ...value, name }))} />
        <Field id="camp-type" label="Type" value={form.type} onChange={(type) => onChange((value) => ({ ...value, type }))} />
        <Field id="camp-date" label="Start date" value={form.date} onChange={(date) => onChange((value) => ({ ...value, date }))} />
        <Field id="camp-end-date" label="End date" value={form.endDate} onChange={(endDate) => onChange((value) => ({ ...value, endDate }))} />
        <Field id="camp-city" label="City" value={form.city} onChange={(city) => onChange((value) => ({ ...value, city }))} />
        <Field id="camp-venue" label="Venue" value={form.venue} onChange={(venue) => onChange((value) => ({ ...value, venue }))} />
        <Field id="camp-host" label="Host" value={form.host} onChange={(host) => onChange((value) => ({ ...value, host }))} />
        <Field id="camp-deadline" label="Registration deadline" value={form.deadline} onChange={(deadline) => onChange((value) => ({ ...value, deadline }))} />
        <Field id="camp-spots" label="Spots" value={form.spotsTotal} onChange={(spotsTotal) => onChange((value) => ({ ...value, spotsTotal }))} />
        <Field id="camp-cost" label="Estimated cost" value={form.estimatedCost} onChange={(estimatedCost) => onChange((value) => ({ ...value, estimatedCost }))} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <TextField id="camp-focus" label="Camp focus" value={form.focus} onChange={(focus) => onChange((value) => ({ ...value, focus }))} />
        <TextField id="camp-notes" label="Travel notes" value={form.notes} onChange={(notes) => onChange((value) => ({ ...value, notes }))} />
      </div>

      {message && <p className="text-xs text-[var(--muted)]">{message}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Mountain size={16} />}
          Save camp
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

function TextField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
        required
      />
    </div>
  );
}
