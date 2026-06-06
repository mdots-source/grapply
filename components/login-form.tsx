"use client";

import { useState } from "react";
import { KeyRound, Loader2, Lock, Mail, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatApiError, readApiJson } from "@/lib/api-client";

export function LoginForm({
  returnTo = "/schedule",
  inviteToken,
  showDemoCredentials = false,
}: {
  returnTo?: string;
  inviteToken?: string;
  showDemoCredentials?: boolean;
}) {
  const [email, setEmail] = useState(showDemoCredentials ? "sofia@grapply.app" : "");
  const [password, setPassword] = useState(showDemoCredentials ? "demo123" : "");
  const [emailAction, setEmailAction] = useState<"magic" | "reset" | null>(null);
  const [emailMessage, setEmailMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function requestEmailAuth(kind: "magic" | "reset") {
    setEmailAction(kind);
    setEmailMessage(null);

    try {
      const response = await fetch(kind === "magic" ? "/api/auth/magic-link" : "/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, returnTo, inviteToken }),
      });
      const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string }>(response, "Email request failed.");
      if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Email request failed.", payload.requestId));
      setEmailMessage({
        tone: "success",
        text: kind === "magic"
          ? "If this account exists, a magic link will arrive shortly."
          : "If this account exists, a password reset email will arrive shortly.",
      });
    } catch (error) {
      setEmailMessage({ tone: "error", text: error instanceof Error ? error.message : "Email request failed." });
    } finally {
      setEmailAction(null);
    }
  }

  return (
    <div className="space-y-3">
      <form action="/api/auth/login" className="space-y-3" method="post">
        <input type="hidden" name="returnTo" value={returnTo} />
        {inviteToken && <input type="hidden" name="inviteToken" value={inviteToken} />}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
            <Input id="email" name="email" className="pl-9" placeholder="coach@grapply.app" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
            <Input id="password" name="password" className="pl-9" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          {showDemoCredentials && <p className="text-xs text-[var(--muted)]">Demo account: sofia@grapply.app / demo123</p>}
        </div>
        <Button type="submit" variant="primary" className="w-full">
          Sign in
        </Button>
      </form>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="surface" onClick={() => requestEmailAuth("magic")} disabled={!email || Boolean(emailAction)}>
          {emailAction === "magic" ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
          Magic link
        </Button>
        <Button type="button" variant="outline" onClick={() => requestEmailAuth("reset")} disabled={!email || Boolean(emailAction)}>
          {emailAction === "reset" ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          Reset password
        </Button>
      </div>
      {emailMessage && (
        <p className={`rounded-lg border px-3 py-2 text-xs ${emailMessage.tone === "success" ? "border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--foreground)]" : "border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 text-[var(--foreground)]"}`}>
          {emailMessage.text}
        </p>
      )}
    </div>
  );
}
