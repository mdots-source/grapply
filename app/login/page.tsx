import Link from "next/link";
import { Shield } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <AuthShell mode="login">
      <Card className="w-full">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]"><Shield size={22} /></div>
          <div>
            <p className="font-black tracking-[0.22em]">OSS OS</p>
            <p className="text-xs text-[var(--muted)]">Academy operations</p>
          </div>
        </div>
        <h1 className="text-3xl font-semibold">Welcome back.</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Sign into the demo workspace and jump straight into academy operations.</p>
        <div className="mt-7 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="coach@forgejj.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" placeholder="Password" type="password" />
          </div>
          <Button variant="primary" className="w-full">Sign in</Button>
        </div>
        <p className="mt-5 text-sm text-[var(--muted)]">New academy? <Link href="/register" className="text-[var(--accent)]">Create workspace</Link></p>
      </Card>
    </AuthShell>
  );
}
