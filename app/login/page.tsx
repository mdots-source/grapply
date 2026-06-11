import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth-session";
import { hasRefreshSessionCookie, redirectToSessionRefreshIfPossible } from "@/lib/auth-refresh-redirect";
import { isMockAuthFallbackAllowed } from "@/lib/auth-mode";
import { normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo, splitOrganizationWorkspacePath } from "@/lib/workspace-intent";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ returnTo?: string; error?: string; invite?: string }> }) {
  const params = await searchParams;
  const returnTo = normalizeLoginReturnTo(params?.returnTo);
  const error = params?.error ? String(params.error) : null;
  const inviteToken = params?.invite ? String(params.invite) : undefined;
  const session = await getCurrentSession();
  if (session) {
    if (inviteToken) {
      redirect(`/api/invites/accept?invite=${encodeURIComponent(inviteToken)}&returnTo=${encodeURIComponent(returnTo)}`);
    }
    if (splitOrganizationWorkspacePath(new URL(returnTo, "https://grapply.local").pathname)) redirect(returnTo);
    redirect(`/clubs?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (inviteToken && (await hasRefreshSessionCookie())) {
    redirect(`/api/invites/accept?invite=${encodeURIComponent(inviteToken)}&returnTo=${encodeURIComponent(returnTo)}`);
  }
  await redirectToSessionRefreshIfPossible(returnTo);

  const showDemoLogin = isMockAuthFallbackAllowed();
  const registerHref = `/register?returnTo=${encodeURIComponent(returnTo)}${inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ""}`;

  return (
    <AuthShell>
      <Card className="w-full">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        {error && (
          <div className="mt-4 rounded-xl border border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
            {error}
          </div>
        )}
        <div className="mt-6" />
        <LoginForm returnTo={returnTo} inviteToken={inviteToken} showDemoCredentials={showDemoLogin} />
        <div className="mt-5 border-t border-[var(--border)] pt-5">
          <Button asChild variant="outline" className="w-full">
            <Link href={registerHref}>
              Create account
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </Card>
    </AuthShell>
  );
}

function normalizeLoginReturnTo(rawReturnTo?: string | null) {
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
