"use client";

import { useState } from "react";
import { Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  return (
    <form action="/api/auth/login" className="space-y-4" method="post">
      <input type="hidden" name="returnTo" value={returnTo} />
      {inviteToken && <input type="hidden" name="inviteToken" value={inviteToken} />}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input id="email" name="email" className="pl-9" placeholder="sofia@grapply.app" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input id="password" name="password" className="pl-9" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        {showDemoCredentials && <p className="text-xs text-[var(--muted)]">Test: sofia@grapply.app / demo123</p>}
      </div>
      <Button type="submit" variant="primary" className="w-full">
        Sign in
      </Button>
    </form>
  );
}
