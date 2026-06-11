"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatApiError, readApiJson } from "@/lib/api-client";

type AuthCallbackMode = "magic" | "recovery";
type TokenPayload = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export function AuthCallbackCard({ mode, returnTo, inviteToken }: { mode: AuthCallbackMode; returnTo: string; inviteToken?: string }) {
  const tokens = useMemo(readTokensFromHash, []);
  const [status, setStatus] = useState<"loading" | "ready" | "success" | "error">(tokens ? "loading" : "error");
  const [message, setMessage] = useState(tokens ? "Securing your Grapply session..." : "This auth link is missing session tokens.");
  const [password, setPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!tokens) return;
    if (mode === "recovery") {
      setStatus("ready");
      setMessage("Choose a new password for this Grapply account.");
      return;
    }

    void createSession(tokens, returnTo, inviteToken, setStatus, setMessage);
  }, [inviteToken, mode, returnTo, tokens]);

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tokens) return;
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setStatus("error");
      return;
    }

    setSavingPassword(true);
    setStatus("loading");
    setMessage("Updating password...");

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresIn: tokens.expiresIn, password }),
      });
      const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string }>(response, "Password update failed.");
      if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Password update failed.", payload.requestId));
      setStatus("success");
      setMessage(inviteToken ? "Password updated. Accepting your academy invite..." : "Password updated. Opening your workspace...");
      window.location.assign(getPostAuthDestination(returnTo, inviteToken));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Password update failed.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <Card className="w-full">
      <div className="mb-7 grid size-12 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
        {status === "success" ? <CheckCircle2 size={23} /> : status === "error" ? <ShieldAlert size={23} /> : <KeyRound size={23} />}
      </div>
      <h1 className="text-3xl font-semibold">{mode === "recovery" ? "Reset password." : "Signing you in."}</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{message}</p>

      {status === "loading" && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]">
          <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
          Working on it...
        </div>
      )}

      {mode === "recovery" && tokens && status !== "success" && (
        <form className="mt-6 space-y-3" onSubmit={submitPassword}>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="primary" className="w-full" disabled={savingPassword}>
            {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            Update password
          </Button>
        </form>
      )}
    </Card>
  );
}

async function createSession(
  tokens: TokenPayload,
  returnTo: string,
  inviteToken: string | undefined,
  setStatus: (status: "loading" | "ready" | "success" | "error") => void,
  setMessage: (message: string) => void,
) {
  try {
    const response = await fetch("/api/auth/callback-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokens),
    });
    const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string }>(response, "Auth link failed.");
    if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Auth link failed.", payload.requestId));
    setStatus("success");
    setMessage(inviteToken ? "Signed in. Accepting your academy invite..." : "Signed in. Opening your workspace...");
    window.location.assign(getPostAuthDestination(returnTo, inviteToken));
  } catch (error) {
    setStatus("error");
    setMessage(error instanceof Error ? error.message : "Auth link failed.");
  }
}

function getPostAuthDestination(returnTo: string, inviteToken?: string) {
  if (inviteToken) {
    return `/api/invites/accept?invite=${encodeURIComponent(inviteToken)}&returnTo=${encodeURIComponent(returnTo)}`;
  }

  return `/api/auth/refresh?returnTo=${encodeURIComponent(returnTo)}`;
}

function readTokensFromHash(): TokenPayload | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token") ?? "";
  const refreshToken = params.get("refresh_token") ?? "";
  const expiresIn = Number(params.get("expires_in") ?? 3600);
  if (!accessToken || !refreshToken) return null;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  return { accessToken, refreshToken, expiresIn: Number.isFinite(expiresIn) ? expiresIn : 3600 };
}
