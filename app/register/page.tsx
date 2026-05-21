import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <AuthShell mode="register">
      <Card className="w-full">
        <div className="mb-8 grid size-12 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]"><Sparkles size={23} /></div>
        <h1 className="text-3xl font-semibold">Launch your academy OS.</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Mock onboarding for a premium Brazilian Jiu-Jitsu SaaS workspace.</p>
        <div className="mt-7 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="academy">Academy name</Label>
            <Input id="academy" placeholder="Forge Jiu-Jitsu Academy" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner">Owner email</Label>
            <Input id="owner" placeholder="owner@forgejj.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="Zurich" />
          </div>
          <Button variant="primary" className="w-full">Create workspace</Button>
        </div>
        <p className="mt-5 text-sm text-[var(--muted)]">Already invited? <Link href="/login" className="text-[var(--accent)]">Sign in</Link></p>
      </Card>
    </AuthShell>
  );
}
