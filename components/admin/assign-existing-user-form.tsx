"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { useActiveClub } from "@/components/use-active-club";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlatformRole } from "@/data/platform";
import { formatApiError, readApiJson } from "@/lib/api-client";

type AssignMessage = { tone: "success" | "error"; text: string };

export function AssignExistingUserForm({ currentRole, clubSlug }: { currentRole: PlatformRole; clubSlug: string }) {
  const router = useRouter();
  const activeClub = useActiveClub();
  const resolvedClubSlug = activeClub?.slug ?? clubSlug;
  const roleOptions = getAssignableRoles(currentRole);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "coach" | "member">(roleOptions[0]?.value ?? "member");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<AssignMessage | null>(null);

  return (
    <form
      className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-[1fr_160px_auto]"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
          const response = await fetch("/api/admin/roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, role, clubSlug: resolvedClubSlug }),
          });
          const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string }>(response, "Could not add account.");
          if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Could not add account.", payload.requestId));

          setEmail("");
          setMessage({ tone: "success", text: `Access added for ${email}.` });
          router.refresh();
        } catch (error) {
          setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not add account." });
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="assign-email">Existing account email</Label>
        <Input
          id="assign-email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="member@academy.com"
          required
        />
        <p className="text-[11px] text-[var(--muted)]">Use this when the person already has a Grapply account.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="assign-role">Role</Label>
        <select
          id="assign-role"
          value={role}
          onChange={(event) => setRole(event.target.value as "admin" | "coach" | "member")}
          className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <Button type="submit" variant="surface" disabled={loading} className="w-full">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          Add access
        </Button>
      </div>
      {message && (
        <div
          className={
            message.tone === "success"
              ? "flex items-start gap-2 rounded-lg border border-[var(--status-success)]/25 bg-[var(--status-success)]/10 px-3 py-2 text-xs text-[var(--foreground)] md:col-span-3"
              : "flex items-start gap-2 rounded-lg border border-[var(--status-danger)]/25 bg-[var(--status-danger)]/10 px-3 py-2 text-xs text-[var(--foreground)] md:col-span-3"
          }
        >
          {message.tone === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span>{message.text}</span>
        </div>
      )}
    </form>
  );
}

function getAssignableRoles(currentRole: PlatformRole) {
  const baseRoles = [
    { value: "member" as const, label: "Member" },
    { value: "coach" as const, label: "Coach" },
  ];

  if (currentRole === "owner") return [{ value: "admin" as const, label: "Admin" }, ...baseRoles];
  return baseRoles;
}
