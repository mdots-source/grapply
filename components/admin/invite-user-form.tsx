"use client";

import { useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Copy, ExternalLink, Loader2, Send } from "lucide-react";
import { useActiveClub } from "@/components/use-active-club";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlatformRole } from "@/data/platform";
import { formatApiError, readApiJson } from "@/lib/api-client";

type InviteMessage = { tone: "success" | "error"; text: string };
type InviteRow = {
  id: string;
  email: string;
  role: "owner" | "admin" | "coach" | "member";
  status: "pending" | "accepted" | "expired" | "revoked";
  created_at: string;
  token?: string;
};

export function InviteUserForm({
  currentRole,
  clubSlug,
  initialInvites,
}: {
  currentRole: PlatformRole;
  clubSlug: string;
  initialInvites: InviteRow[];
}) {
  const activeClub = useActiveClub();
  const resolvedClubSlug = activeClub?.slug ?? clubSlug;
  const [email, setEmail] = useState("");
  const assignableRoles = getAssignableInviteRoles(currentRole);
  const [role, setRole] = useState<"admin" | "coach" | "member">("member");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<InviteMessage | null>(null);
  const [invites, setInvites] = useState(() => initialInvites.filter((invite) => invite.status === "pending"));
  const [revokingInvite, setRevokingInvite] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);

  return (
    <div className="space-y-4">
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
              body: JSON.stringify({ email, role, clubSlug: resolvedClubSlug }),
            });
            const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string; invite?: InviteRow }>(response, "Invite failed.");
            if (!payload.ok || !payload.invite) throw new Error(formatApiError(payload.error ?? "Invite failed.", payload.requestId));
            setInvites((current) => [payload.invite as InviteRow, ...current.filter((item) => item.id !== payload.invite?.id)]);
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
          <p className="text-[11px] text-[var(--muted)]">{activeClub?.name ?? "Active academy"}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <select
            id="invite-role"
            value={role}
            onChange={(event) => setRole(event.target.value as "admin" | "coach" | "member")}
            className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          >
            {assignableRoles.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {currentRole !== "owner" && <p className="text-[11px] text-[var(--muted)]">Only owners can invite admins.</p>}
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
                ? "flex items-start gap-2 rounded-lg border border-[var(--status-success)]/25 bg-[var(--status-success)]/10 px-3 py-2 text-xs text-[var(--foreground)] md:col-span-3"
                : "flex items-start gap-2 rounded-lg border border-[var(--status-danger)]/25 bg-[var(--status-danger)]/10 px-3 py-2 text-xs text-[var(--foreground)] md:col-span-3"
            }
          >
            {message.tone === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            <span>{message.text}</span>
          </div>
        )}
      </form>

      <div className="space-y-2">
        {invites.length > 0 ? (
          invites.map((invite) => (
            <div key={invite.id} className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{invite.email}</p>
                  <Badge variant={invite.status === "pending" ? "accent" : invite.status === "accepted" ? "success" : "muted"}>{invite.status}</Badge>
                  <Badge variant="muted" className="capitalize">{invite.role}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">Created {formatInviteDate(invite.created_at)}</p>
              </div>
              {invite.status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  {invite.token && (
                    <>
                      <Button type="button" variant="surface" size="sm" asChild>
                        <a href={getInviteUrl(invite.token, resolvedClubSlug)} target="_blank" rel="noreferrer">
                          <ExternalLink size={14} />
                          Open
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const inviteUrl = getInviteUrl(invite.token ?? "", resolvedClubSlug);
                          await navigator.clipboard.writeText(inviteUrl);
                          setCopiedInvite(invite.id);
                          setMessage({ tone: "success", text: `Invite link copied for ${invite.email}.` });
                          window.setTimeout(() => setCopiedInvite((current) => (current === invite.id ? null : current)), 1800);
                        }}
                      >
                        <Copy size={14} />
                        {copiedInvite === invite.id ? "Copied" : "Copy link"}
                      </Button>
                    </>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={revokingInvite === invite.id}
                    onClick={async () => {
                      setRevokingInvite(invite.id);
                      setMessage(null);
                      try {
                        const response = await fetch("/api/invites", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: invite.id, clubSlug: resolvedClubSlug }),
                        });
                        const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string; invite?: InviteRow }>(response, "Could not revoke invite.");
                        if (!payload.ok || !payload.invite) throw new Error(formatApiError(payload.error ?? "Could not revoke invite.", payload.requestId));
                        setInvites((current) => current.filter((item) => item.id !== invite.id));
                        setMessage({ tone: "success", text: `Invite revoked for ${invite.email}.` });
                      } catch (error) {
                        setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not revoke invite." });
                      } finally {
                        setRevokingInvite(null);
                      }
                    }}
                  >
                    {revokingInvite === invite.id ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                    Revoke
                  </Button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
            No pending invites.
          </div>
        )}
      </div>
    </div>
  );
}

function getAssignableInviteRoles(currentRole: PlatformRole) {
  const roles = [
    { value: "member" as const, label: "Member - view only" },
    { value: "coach" as const, label: "Coach - planning and participants" },
  ];

  if (currentRole === "owner") {
    return [{ value: "admin" as const, label: "Admin - manage team and settings" }, ...roles];
  }

  return roles;
}

function formatInviteDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getInviteUrl(token: string, clubSlug?: string | null) {
  const returnTo = clubSlug ? `/${clubSlug}/schedule` : "/schedule";
  if (typeof window === "undefined") {
    return `/invite?invite=${encodeURIComponent(token)}&returnTo=${encodeURIComponent(returnTo)}`;
  }
  const url = new URL("/invite", window.location.origin);
  url.searchParams.set("invite", token);
  url.searchParams.set("returnTo", returnTo);
  return url.toString();
}
