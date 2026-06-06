"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarPlus, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveClub } from "@/components/use-active-club";
import { formatApiError, readApiJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export type ClassFormValue = {
  id?: string;
  name: string;
  coach: string;
  day: string;
  time: string;
  mat: string;
  level: string;
  durationMinutes: number;
  checkedIn?: number;
};

const classPresets: ClassFormValue[] = [
  {
    name: "No-Gi Fundamentals",
    coach: "Sofia Almeida",
    day: "Mon",
    time: "18:00",
    mat: "Main Mat",
    level: "white / blue",
    durationMinutes: 60,
  },
  {
    name: "Advanced Sparring",
    coach: "Sofia Almeida",
    day: "Wed",
    time: "19:00",
    mat: "Main Mat",
    level: "blue / purple / brown / black",
    durationMinutes: 90,
  },
  {
    name: "Open Mat",
    coach: "Lina Okafor",
    day: "Sat",
    time: "12:00",
    mat: "Main Mat",
    level: "all belts",
    durationMinutes: 60,
  },
];

const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeOptions = ["06:30", "08:00", "12:00", "16:00", "17:30", "18:00", "19:00", "20:30"];
const matOptions = ["Main Mat", "Mat A", "Mat B"];
const levelOptions = ["white / blue", "blue / purple / brown / black", "all belts", "competition team", "kids / teens"];
const durationOptions = [45, 60, 75, 90, 120];

export function CreateClassForm({
  initialOpen = false,
  onCreate,
  validateClass,
  initialValue,
  forceOpen = false,
  onCancel,
  onSaved,
  clubSlug,
}: {
  initialOpen?: boolean;
  onCreate?: (value: ClassFormValue) => void;
  validateClass?: (value: ClassFormValue) => string | null;
  initialValue?: Partial<ClassFormValue>;
  forceOpen?: boolean;
  onCancel?: () => void;
  onSaved?: () => void;
  clubSlug?: string;
}) {
  const activeClub = useActiveClub();
  const resolvedClubSlug = activeClub?.slug ?? clubSlug;
  const [open, setOpen] = useState(initialOpen);
  const [form, setForm] = useState<ClassFormValue>({
    name: "No-Gi Fundamentals",
    coach: "Sofia Almeida",
    day: initialValue?.day ?? "Mon",
    time: initialValue?.time ?? "18:00",
    mat: "Main Mat",
    level: "white / blue",
    durationMinutes: initialValue?.durationMinutes ?? 60,
    ...initialValue,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!forceOpen) return;
    setForm((value) => ({ ...value, ...initialValue }));
    setMessage(null);
  }, [forceOpen, initialValue]);

  if (!forceOpen && !open) {
    return (
      <div className="space-y-2">
        {message && (
          <div
            className={
              message.tone === "success"
                ? "flex items-start gap-2 rounded-lg border border-[var(--status-success)]/25 bg-[var(--status-success)]/10 px-3 py-2 text-xs font-semibold text-[var(--foreground)]"
                : "flex items-start gap-2 rounded-lg border border-[var(--status-danger)]/25 bg-[var(--status-danger)]/10 px-3 py-2 text-xs font-semibold text-[var(--foreground)]"
            }
          >
            {message.tone === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            <span>{message.text}</span>
          </div>
        )}
        <Button variant="primary" className="w-full justify-center" onClick={() => setOpen(true)}>
          <CalendarPlus size={16} /> Add training
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
          const validationError = validateClass?.(form);
          if (validationError) throw new Error(validationError);

          const response = await fetch("/api/classes", {
            method: form.id ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, ...(resolvedClubSlug ? { clubSlug: resolvedClubSlug } : {}) }),
          });
          const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string; class?: Partial<ClassFormValue> }>(response, "Training creation failed.");
          if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Training creation failed.", payload.requestId));
          onCreate?.({ ...form, ...payload.class });
          setMessage({
            tone: "success",
            text: form.id ? "Training updated." : "Training saved and added to the timetable.",
          });
          if (forceOpen) {
            onSaved?.();
          } else {
            setOpen(false);
          }
        } catch (error) {
          setMessage({ tone: "error", text: error instanceof Error ? error.message : "Training creation failed." });
        } finally {
          setLoading(false);
        }
      }}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Templates</p>
        <div className="mt-2 grid gap-2">
          {classPresets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left transition hover:border-[var(--accent)]/35 hover:bg-[var(--surface-hover)]"
              onClick={() => setForm(preset)}
            >
              <span className="block text-xs font-semibold text-[var(--foreground)]">{preset.name}</span>
              <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                {preset.day} / {preset.time} / {preset.level}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Field id="class-name" label="Training" value={form.name} onChange={(name) => setForm((value) => ({ ...value, name }))} />
        <Field id="class-coach" label="Coach" value={form.coach} onChange={(coach) => setForm((value) => ({ ...value, coach }))} />
        <div className="grid grid-cols-2 gap-2">
          <SelectField id="class-day" label="Day" value={form.day} options={dayOptions} onChange={(day) => setForm((value) => ({ ...value, day }))} />
          <SelectField id="class-time" label="Time" value={form.time} options={timeOptions} onChange={(time) => setForm((value) => ({ ...value, time }))} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SelectField id="class-mat" label="Mat" value={form.mat} options={matOptions} onChange={(mat) => setForm((value) => ({ ...value, mat }))} />
          <SelectField id="class-level" label="Level" value={form.level} options={levelOptions} onChange={(level) => setForm((value) => ({ ...value, level }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="class-duration">Duration</Label>
          <select
            id="class-duration"
            value={form.durationMinutes}
            onChange={(event) => setForm((value) => ({ ...value, durationMinutes: Number(event.target.value) }))}
            className={cn(
              "flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm outline-none transition",
              "focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15",
            )}
          >
            {durationOptions.map((minutes) => (
              <option key={minutes} value={minutes} className="bg-[var(--panel-strong)] text-[var(--foreground)]">
                {minutes} min
              </option>
            ))}
          </select>
        </div>
      </div>
      {message && (
        <div
          className={
            message.tone === "success"
              ? "flex items-start gap-2 rounded-lg border border-[var(--status-success)]/25 bg-[var(--status-success)]/10 px-3 py-2 text-xs font-semibold text-[var(--foreground)]"
              : "flex items-start gap-2 rounded-lg border border-[var(--status-danger)]/25 bg-[var(--status-danger)]/10 px-3 py-2 text-xs font-semibold text-[var(--foreground)]"
          }
        >
          {message.tone === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span>{message.text}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="ghost" onClick={() => (forceOpen ? onCancel?.() : setOpen(false))}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CalendarPlus size={16} />}
          Save
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

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm outline-none transition",
          "focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15",
        )}
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[var(--panel-strong)] text-[var(--foreground)]">
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
