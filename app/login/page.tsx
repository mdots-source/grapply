import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth-session";
import { isMockAuthFallbackAllowed } from "@/lib/auth-mode";
import { getWorkspaceIntentLabel, normalizeWorkspaceReturnTo } from "@/lib/workspace-intent";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ returnTo?: string; error?: string; invite?: string }> }) {
  const params = await searchParams;
  const returnTo = normalizeWorkspaceReturnTo(params?.returnTo);
  const error = params?.error ? String(params.error) : null;
  const inviteToken = params?.invite ? String(params.invite) : undefined;
  const session = await getCurrentSession();
  if (session) {
    if (inviteToken) {
      redirect(`/api/invites/accept?invite=${encodeURIComponent(inviteToken)}&returnTo=${encodeURIComponent(returnTo)}`);
    }
    redirect(`/clubs?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const intentLabel = getWorkspaceIntentLabel(returnTo);
  const showDemoLogin = isMockAuthFallbackAllowed();
  const registerHref = `/register?returnTo=${encodeURIComponent(returnTo)}${inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ""}`;

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
        <Link
          href={registerHref}
          className="mt-5 flex min-h-14 items-center justify-between gap-4 rounded-xl border border-[var(--accent)]/35 bg-[var(--accent)]/10 px-4 py-3 text-[var(--foreground)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]/55 hover:bg-[var(--accent)]/14"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)]">
              <Sparkles size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{inviteToken ? "Create account to join" : "Create academy workspace"}</span>
              <span className="mt-0.5 block text-xs leading-5 text-[var(--muted)]">
                {inviteToken ? "Register and accept this club invite." : "New club owner? Start with registration."}
              </span>
            </span>
          </span>
          <ArrowRight size={16} className="shrink-0 text-[var(--accent)]" />
        </Link>
        {error && (
          <div className="mt-4 rounded-xl border border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
            {error}
          </div>
        )}
        {showDemoLogin && (
          <Link
            href={`/api/auth/demo?returnTo=${encodeURIComponent(returnTo)}`}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-foreground)] transition hover:-translate-y-0.5"
          >
            Open demo workspace
            <ArrowRight size={16} />
          </Link>
        )}
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
          Strava connects from Settings after login, so training data is linked to the right Grapply account.
        </div>
        <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--border)]" />
          Academy login
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <LoginForm returnTo={returnTo} inviteToken={inviteToken} showDemoCredentials={showDemoLogin} />
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {inviteToken ? "Need a Grapply account?" : "No Grapply account yet?"}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            {inviteToken ? "Create one and Grapply will attach this invite to the right club." : "Register a new academy workspace with owner access."}
          </p>
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link href={registerHref}>
              {inviteToken ? "Create account and join" : "Create account"}
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </Card>
    </AuthShell>
  );
}
