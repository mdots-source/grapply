import Link from "next/link";
import { Shield } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { StravaConnectButton } from "@/components/strava-connect-button";
import { Card } from "@/components/ui/card";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ returnTo?: string }> }) {
  const params = await searchParams;
  const returnTo = params?.returnTo?.startsWith("/") ? params.returnTo : "/dashboard";

  return (
    <AuthShell mode="login">
      <Card className="w-full">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
            <Shield size={22} />
          </div>
          <div>
            <p className="font-black tracking-[0.22em]">Grapply</p>
            <p className="text-xs text-[var(--muted)]">Academy workspace</p>
          </div>
        </div>
        <h1 className="text-3xl font-semibold">Welcome back.</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Sign into the Grapply workspace, review the room, and keep athlete activity connected.
        </p>
        <StravaConnectButton href={`/api/strava/connect?returnTo=${encodeURIComponent(`/clubs?returnTo=${returnTo}`)}`} className="mt-7 w-full">
          Continue with Strava
        </StravaConnectButton>
        <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--border)]" />
          Academy login
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <LoginForm returnTo={returnTo} />
        <p className="mt-5 text-sm text-[var(--muted)]">
          New academy? <Link href="/register" className="text-[var(--accent)]">Create workspace</Link>
        </p>
      </Card>
    </AuthShell>
  );
}
