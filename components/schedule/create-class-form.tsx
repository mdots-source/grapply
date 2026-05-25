"use client";

import { useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateClassForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "No-Gi Fundamentals",
    coach: "Sofia Almeida",
    day: "Mon",
    time: "18:00",
    mat: "Main Mat",
    level: "white / blue",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="primary" className="w-full justify-center" onClick={() => setOpen(true)}>
        <CalendarPlus size={16} /> Add class
      </Button>
    );
  }

  return (
    <form
      className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
          const response = await fetch("/api/classes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
          const payload = (await response.json()) as { ok?: boolean; error?: string };
          if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Class creation failed.");
          setMessage("Class saved in Supabase.");
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Class creation failed.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="grid gap-2">
        <Field id="class-name" label="Class" value={form.name} onChange={(name) => setForm((value) => ({ ...value, name }))} />
        <Field id="class-coach" label="Coach" value={form.coach} onChange={(coach) => setForm((value) => ({ ...value, coach }))} />
        <div className="grid grid-cols-2 gap-2">
          <Field id="class-day" label="Day" value={form.day} onChange={(day) => setForm((value) => ({ ...value, day }))} />
          <Field id="class-time" label="Time" value={form.time} onChange={(time) => setForm((value) => ({ ...value, time }))} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field id="class-mat" label="Mat" value={form.mat} onChange={(mat) => setForm((value) => ({ ...value, mat }))} />
          <Field id="class-level" label="Level" value={form.level} onChange={(level) => setForm((value) => ({ ...value, level }))} />
        </div>
      </div>
      {message && <p className="text-xs text-[var(--muted)]">{message}</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
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
