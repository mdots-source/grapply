import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/register-form";
import { StravaConnectButton } from "@/components/strava-connect-button";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <AuthShell mode="register">
      <Card className="w-full">
        <div className="mb-8 grid size-12 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
          <Sparkles size={23} />
        </div>
        <h1 className="text-3xl font-semibold">Create your academy workspace.</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Set up the academy profile and invite your coaching team when you are ready.
        </p>
        <StravaConnectButton href="/api/strava/connect?returnTo=/clubs" className="mt-7 w-full">
          Register with Strava
        </StravaConnectButton>
        <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--border)]" />
          Academy details
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <RegisterForm />
        <p className="mt-5 text-sm text-[var(--muted)]">Already invited? <Link href="/login" className="text-[var(--accent)]">Sign in</Link></p>
      </Card>
    </AuthShell>
  );
}
