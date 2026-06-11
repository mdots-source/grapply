"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DemoForm = {
  name: string;
  email: string;
  academyName: string;
  role: string;
  academySize: string;
  currentTools: string;
  message: string;
};

const initialForm: DemoForm = {
  name: "",
  email: "",
  academyName: "",
  role: "owner",
  academySize: "50-150",
  currentTools: "",
  message: "",
};

const selectClassName =
  "flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

export function DemoRequestForm() {
  const [form, setForm] = useState<DemoForm>(initialForm);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function updateField(field: keyof DemoForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (status === "error") {
      setStatus("idle");
      setMessage("");
    }
  }

  async function submitDemoRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not send the demo request.");
      }

      setStatus("success");
      setMessage("Request sent. We will reply with a product walkthrough.");
      setForm(initialForm);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not send the demo request.");
    }
  }

  return (
    <form onSubmit={submitDemoRequest} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow)] sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input required value={form.name} autoComplete="name" onChange={(event) => updateField("name", event.target.value)} placeholder="Sofia Almeida" />
        </Field>
        <Field label="Work email">
          <Input required type="email" value={form.email} autoComplete="email" onChange={(event) => updateField("email", event.target.value)} placeholder="sofia@academy.com" />
        </Field>
        <Field label="Academy">
          <Input required value={form.academyName} autoComplete="organization" onChange={(event) => updateField("academyName", event.target.value)} placeholder="Grapply Jiu-Jitsu Academy" />
        </Field>
        <Field label="Role">
          <select value={form.role} onChange={(event) => updateField("role", event.target.value)} className={selectClassName}>
            <option value="owner">Owner</option>
            <option value="head-coach">Head coach</option>
            <option value="admin">Admin</option>
            <option value="coach">Coach</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Academy size">
          <select value={form.academySize} onChange={(event) => updateField("academySize", event.target.value)} className={selectClassName}>
            <option value="under-50">Under 50 members</option>
            <option value="50-150">50-150 members</option>
            <option value="150-300">150-300 members</option>
            <option value="300-plus">300+ members</option>
            <option value="multi-location">Multi-location team</option>
          </select>
        </Field>
        <Field label="Current tools">
          <Input value={form.currentTools} onChange={(event) => updateField("currentTools", event.target.value)} placeholder="Sheets, Zen Planner, Wodify..." />
        </Field>
      </div>
      <Field label="What should we show you first?" className="mt-4">
        <textarea
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          placeholder="TV screen, member progression, schedule, rankings, competitions..."
          className="min-h-28 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--foreground)] shadow-sm outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
        />
      </Field>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-[var(--muted)]">No spam. Just a product walkthrough built around your academy.</p>
        <Button type="submit" variant="primary" size="lg" disabled={status === "loading"} className="sm:min-w-40">
          {status === "loading" ? <Loader2 className="animate-spin" /> : status === "success" ? <CheckCircle2 /> : <Send />}
          {status === "loading" ? "Sending" : status === "success" ? "Sent" : "Book demo"}
        </Button>
      </div>
      {message ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={status === "error" ? "mt-3 text-sm text-[var(--status-danger)]" : "mt-3 text-sm text-[var(--status-success)]"}
        >
          {message}
        </motion.p>
      ) : null}
    </form>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</Label>
      {children}
    </div>
  );
}
