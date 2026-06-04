import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/register-form";
import { StravaConnectButton } from "@/components/strava-connect-button";
import { Card } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth-session";
import { getWorkspaceIntentLabel, normalizeWorkspaceReturnTo } from "@/lib/workspace-intent";

export default async function RegisterPage({ searchParams }: { searchParams?: Promise<{ returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  const returnTo = normalizeWorkspaceReturnTo(params?.returnTo);
  const error = params?.error ? String(params.error) : null;
  const session = await getCurrentSession();
  if (session) {
    redirect(`/clubs?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const intentLabel = getWorkspaceIntentLabel(returnTo);

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
        <div className="mt-5 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/8 px-4 py-3 text-sm text-[var(--foreground)]">
          After setup, Grapply opens your new academy to {intentLabel}.
        </div>
        {error && (
          <div className="mt-4 rounded-xl border border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
            {error}
          </div>
        )}
        <StravaConnectButton href={`/api/strava/connect?returnTo=${encodeURIComponent(`/clubs?returnTo=${returnTo}`)}`} className="mt-7 w-full">
          Register with Strava
        </StravaConnectButton>
        <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--border)]" />
          Academy details
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <RegisterForm returnTo={returnTo} />
        <p className="mt-5 text-sm text-[var(--muted)]">
          Already invited? <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="text-[var(--accent)]">Sign in</Link>
        </p>
      </Card>
    </AuthShell>
  );
}
