"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { BeltPill } from "@/components/belt-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Belt } from "@/data/academy";
import type { PlatformRole } from "@/data/platform";

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

export function ClubUsersList({ users }: { users: ClubUser[] }) {
  const [visibleUsers, setVisibleUsers] = useState(users);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);

  async function removeUser(user: ClubUser) {
    setPendingRemoval(user.membershipId);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: user.membershipId }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Could not remove access.");

      setVisibleUsers((current) => current.filter((item) => item.membershipId !== user.membershipId));
      setMessage(`${roleLabel(user.role)} access removed for ${user.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove access.");
    } finally {
      setPendingRemoval(null);
    }
  }

  return (
    <div className="space-y-3">
      {message && (
        <div className="rounded-xl border border-[var(--status-success)]/25 bg-[var(--status-success)]/10 px-3 py-2 text-xs font-semibold text-[var(--foreground)]">
          {message}
        </div>
      )}
      {visibleUsers.map((user) => {
        const canRemove = user.role !== "owner";

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
              {canRemove && (
                <Button type="button" variant="outline" size="sm" disabled={pendingRemoval === user.membershipId} onClick={() => removeUser(user)}>
                  <Trash2 size={14} />
                  {pendingRemoval === user.membershipId ? "Removing" : "Remove"}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
