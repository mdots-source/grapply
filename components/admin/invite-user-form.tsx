"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Send } from "lucide-react";
import { useActiveClub } from "@/components/use-active-club";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InviteMessage = { tone: "success" | "error"; text: string };

export function InviteUserForm() {
  const activeClub = useActiveClub();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<InviteMessage | null>(null);
  const [pendingInvites, setPendingInvites] = useState<Array<{ email: string; role: string }>>([]);

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
            body: JSON.stringify({ email, role, ...(activeClub?.slug ? { clubSlug: activeClub.slug } : {}) }),
          });
          const payload = (await response.json()) as { ok?: boolean; error?: string };
          if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Invite failed.");
          setPendingInvites((current) => [{ email, role }, ...current].slice(0, 3));
          setEmail("");
          setMessage({ tone: "success", text: `Invite saved for ${activeClub?.name ?? "this academy"}.` });
        } catch (error) {
          setMessage({ tone: "error", text: error instanceof Error ? error.message : "Invite failed." });
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="invite-email">Invite email</Label>
        <Input id="invite-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="coach@academy.com" required />
        <p className="text-[11px] text-[var(--muted)]">Invites are scoped to {activeClub?.name ?? "the active club"}.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-role">Role</Label>
        <select
          id="invite-role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        >
          <option value="member">Member - view only</option>
          <option value="coach">Trainer - planning and participants</option>
        </select>
      </div>
      <div className="flex items-end">
        <Button type="submit" variant="primary" disabled={loading} className="w-full">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Invite
        </Button>
      </div>
      {message && (
        <div
          className={
            message.tone === "success"
              ? "flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300 md:col-span-3"
              : "flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300 md:col-span-3"
          }
        >
          {message.tone === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span>{message.text}</span>
        </div>
      )}
      {pendingInvites.length > 0 && (
        <div className="space-y-2 md:col-span-3">
          {pendingInvites.map((invite) => (
            <div key={`${invite.email}-${invite.role}`} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs">
              <span className="truncate text-[var(--foreground)]">{invite.email}</span>
              <span className="capitalize text-[var(--accent)]">{invite.role}</span>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
