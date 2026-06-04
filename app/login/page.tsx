import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Shield } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { StravaConnectButton } from "@/components/strava-connect-button";
import { Card } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth-session";
import { getWorkspaceIntentLabel, normalizeWorkspaceReturnTo } from "@/lib/workspace-intent";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  const returnTo = normalizeWorkspaceReturnTo(params?.returnTo);
  const error = params?.error ? String(params.error) : null;
  const session = await getCurrentSession();
  if (session) {
    redirect(`/clubs?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const intentLabel = getWorkspaceIntentLabel(returnTo);

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
        <div className="mt-5 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/8 px-4 py-3 text-sm text-[var(--foreground)]">
          After sign in, choose an academy to {intentLabel}.
        </div>
        {error && (
          <div className="mt-4 rounded-xl border border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
            {error}
          </div>
        )}
        <Link
          href={`/api/auth/demo?returnTo=${encodeURIComponent(returnTo)}`}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-foreground)] transition hover:-translate-y-0.5"
        >
          Open demo workspace
          <ArrowRight size={16} />
        </Link>
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
          New academy? <Link href={`/register?returnTo=${encodeURIComponent(returnTo)}`} className="text-[var(--accent)]">Create workspace</Link>
        </p>
      </Card>
    </AuthShell>
  );
}
