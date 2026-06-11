import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/register-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth-session";
import { getWorkspaceIntentLabel, normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo, splitOrganizationWorkspacePath } from "@/lib/workspace-intent";

export default async function RegisterPage({ searchParams }: { searchParams?: Promise<{ returnTo?: string; error?: string; invite?: string }> }) {
  const params = await searchParams;
  const returnTo = normalizeRegisterReturnTo(params?.returnTo);
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

  return (
    <AuthShell mode="register">
      <Card className="w-full">
        <div className="mb-8 grid size-12 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
          <Sparkles size={23} />
        </div>
        <h1 className="text-3xl font-semibold">{inviteToken ? "Join your academy." : "Create your account."}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {inviteToken ? "Create your user account to accept the club invite and open the workspace." : "Create a user account. Academy access is assigned separately by the Grapply team or through a club invite."}
        </p>
        <div className="mt-5 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/8 px-4 py-3 text-sm text-[var(--foreground)]">
          {inviteToken ? `After joining, Grapply opens the invited academy to ${intentLabel}.` : "After registration, Grapply shows the academies assigned to your account."}
        </div>
        {error && (
          <div className="mt-4 rounded-xl border border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
            {error}
          </div>
        )}
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
          Strava can be connected after registration from Settings, once Grapply knows which account and club should own the activity data.
        </div>
        <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--border)]" />
          Account details
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <RegisterForm returnTo={returnTo} inviteToken={inviteToken} />
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {inviteToken ? "Already have the invited account?" : "Already have an account?"}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Sign in and Grapply will send you to club selection before opening the workspace.
          </p>
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}${inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ""}`}>
              Sign in
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </Card>
    </AuthShell>
  );
}

function normalizeRegisterReturnTo(rawReturnTo?: string | null) {
  const normalizedReturnTo = normalizeWorkspaceReturnTo(rawReturnTo);
  if (!rawReturnTo?.startsWith("/")) return normalizedReturnTo;

  try {
    const destination = new URL(rawReturnTo, "https://grapply.local");
    const route = splitOrganizationWorkspacePath(destination.pathname);
    return route ? scopeWorkspaceReturnTo(normalizedReturnTo, route.organizationId) : normalizedReturnTo;
  } catch {
    return normalizedReturnTo;
  }
}
