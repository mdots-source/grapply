"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ returnTo = "/dashboard" }: { returnTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("sofia@grapply.app");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const payload = (await response.json()) as { ok?: boolean; user?: { id: string }; error?: string };
          if (!response.ok || !payload.ok || !payload.user?.id) {
            throw new Error(payload.error ?? "Login failed.");
          }
          const clubsUrl = new URL("/clubs", window.location.origin);
          clubsUrl.searchParams.set("returnTo", returnTo);
          router.push(`${clubsUrl.pathname}${clubsUrl.search}`);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Login failed.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input id="email" className="pl-9" placeholder="coach@grapply.app" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input id="password" className="pl-9" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        <p className="text-xs text-[var(--muted)]">Demo account: sofia@grapply.app / demo123</p>
      </div>
      {error && <p className="rounded-lg border border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 p-3 text-xs text-[var(--foreground)]">{error}</p>}
      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading && <Loader2 size={16} className="animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
