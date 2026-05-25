"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteUserForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-[1fr_160px_auto]"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
          const response = await fetch("/api/invites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, role }),
          });
          const payload = (await response.json()) as { ok?: boolean; error?: string };
          if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Invite failed.");
          setEmail("");
          setMessage("Invite saved.");
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Invite failed.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="invite-email">Invite email</Label>
        <Input id="invite-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="coach@academy.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-role">Role</Label>
        <select
          id="invite-role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        >
          <option value="member">Member</option>
          <option value="coach">Coach</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex items-end">
        <Button type="submit" variant="primary" disabled={loading} className="w-full">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Invite
        </Button>
      </div>
      {message && <p className="text-xs text-[var(--muted)] md:col-span-3">{message}</p>}
    </form>
  );
}
