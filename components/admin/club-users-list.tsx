"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { BeltPill } from "@/components/belt-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Belt } from "@/data/academy";
import type { PlatformRole } from "@/data/platform";
import { formatApiError, readApiJson } from "@/lib/api-client";

type ClubUser = {
  membershipId: string;
  name: string;
  email: string;
  belt: Belt;
  stripes: number;
  role: PlatformRole;
  joinedAt: string;
  stravaStatus: string;
};

function roleLabel(role: PlatformRole) {
  if (role === "coach") return "Coach";
  return role[0].toUpperCase() + role.slice(1);
}

export function ClubUsersList({ users, currentRole, clubSlug }: { users: ClubUser[]; currentRole: PlatformRole; clubSlug: string }) {
  const [visibleUsers, setVisibleUsers] = useState(users);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [confirmRemoval, setConfirmRemoval] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  async function updateRole(user: ClubUser, role: PlatformRole) {
    if (role === user.role || user.role === "owner" || role === "owner") return;
    setPendingRole(user.membershipId);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: user.membershipId, role, clubSlug }),
      });
      const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string }>(response, "Could not update role.");
      if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Could not update role.", payload.requestId));

      setVisibleUsers((current) => current.map((item) => (item.membershipId === user.membershipId ? { ...item, role } : item)));
      setConfirmRemoval(null);
      setMessage({ tone: "success", text: `${user.name} is now ${roleLabel(role)}.` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not update role." });
    } finally {
      setPendingRole(null);
    }
  }

  async function removeUser(user: ClubUser) {
    if (confirmRemoval !== user.membershipId) {
      setConfirmRemoval(user.membershipId);
      setMessage({ tone: "error", text: `Confirm removing ${user.name} from this academy.` });
      return;
    }

    setPendingRemoval(user.membershipId);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: user.membershipId, clubSlug }),
      });
      const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string }>(response, "Could not remove access.");
      if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Could not remove access.", payload.requestId));

      setVisibleUsers((current) => current.filter((item) => item.membershipId !== user.membershipId));
      setConfirmRemoval(null);
      setMessage({ tone: "success", text: `${roleLabel(user.role)} access removed for ${user.name}.` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not remove access." });
    } finally {
      setPendingRemoval(null);
    }
  }

  return (
    <div className="space-y-3">
      {message && (
        <div
          className={
            message.tone === "success"
              ? "flex items-start gap-2 rounded-xl border border-[var(--status-success)]/25 bg-[var(--status-success)]/10 px-3 py-2 text-xs font-semibold text-[var(--foreground)]"
              : "flex items-start gap-2 rounded-xl border border-[var(--status-danger)]/25 bg-[var(--status-danger)]/10 px-3 py-2 text-xs font-semibold text-[var(--foreground)]"
          }
        >
          {message.tone === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span>{message.text}</span>
        </div>
      )}
      {visibleUsers.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
          No users have access to this academy yet. Invite coaches or members to build the club workspace.
        </div>
      )}
      {visibleUsers.map((user) => {
        const canManage = canManageUserAccess(currentRole, user);
        const canRemove = canManage && user.role !== "owner";
        const roleOptions = getAssignableRoleOptions(currentRole, user);
        const confirmingRemoval = confirmRemoval === user.membershipId;

        return (
          <div key={user.membershipId} className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[var(--foreground)]">{user.name}</p>
                <Badge variant="accent">{roleLabel(user.role)}</Badge>
                <BeltPill belt={user.belt} stripes={user.stripes} />
              </div>
              <p className="mt-1 truncate text-xs text-[var(--muted)]">{user.email}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">Joined {user.joinedAt}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={user.stravaStatus === "connected" ? "success" : "muted"}>
                {user.stravaStatus === "connected" ? "Training connected" : "Training not connected"}
              </Badge>
              {user.stravaStatus === "error" && (
                <Badge variant="muted">
                  <AlertTriangle size={12} /> Sync error
                </Badge>
              )}
              <label className="sr-only" htmlFor={`role-${user.membershipId}`}>
                Role for {user.name}
              </label>
              <div className="relative">
                {pendingRole === user.membershipId && <Loader2 size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 animate-spin text-[var(--muted)]" />}
                <select
                  id={`role-${user.membershipId}`}
                  className="h-9 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!canManage || pendingRole === user.membershipId}
                  value={user.role}
                  onChange={(event) => updateRole(user, event.target.value as PlatformRole)}
                  style={{ paddingLeft: pendingRole === user.membershipId ? 28 : undefined }}
                >
                  {user.role === "owner" && <option value="owner">Owner</option>}
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{roleLabel(role)}</option>
                  ))}
                </select>
              </div>
              {canRemove && (
                <Button type="button" variant="outline" size="sm" disabled={pendingRemoval === user.membershipId} onClick={() => removeUser(user)}>
                  <Trash2 size={14} />
                  {pendingRemoval === user.membershipId ? "Removing" : confirmingRemoval ? "Confirm remove" : "Remove"}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function canManageUserAccess(currentRole: PlatformRole, user: ClubUser) {
  if (user.role === "owner") return false;
  if (currentRole === "owner") return true;
  if (currentRole === "admin") return user.role === "coach" || user.role === "member";
  return false;
}

function getAssignableRoleOptions(currentRole: PlatformRole, user: ClubUser): PlatformRole[] {
  if (user.role === "owner") return [];
  if (currentRole === "owner") return ["admin", "coach", "member"];
  if (currentRole === "admin" && user.role === "admin") return [user.role];
  if (currentRole === "admin") return ["coach", "member"];
  return [user.role];
}
