import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/register-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth-session";
import { normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo, splitOrganizationWorkspacePath } from "@/lib/workspace-intent";

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

  return (
    <AuthShell mode="register">
      <Card className="w-full">
        <div className="mb-8 grid size-12 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
          <Sparkles size={23} />
        </div>
        <h1 className="text-3xl font-semibold">{inviteToken ? "Join academy" : "Create account"}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Use your invite or assigned academy access.</p>
        {error && (
          <div className="mt-4 rounded-xl border border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
            {error}
          </div>
        )}
        <div className="mt-6" />
        <RegisterForm returnTo={returnTo} inviteToken={inviteToken} />
        <div className="mt-5 border-t border-[var(--border)] pt-5">
          <Button asChild variant="outline" className="w-full">
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
