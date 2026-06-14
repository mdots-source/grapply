import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/register-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth-session";
import { hasRefreshSessionCookie, redirectToSessionRefreshIfPossible } from "@/lib/auth-refresh-redirect";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";
import type { TableRow } from "@/lib/supabase/types";
import { getRoleSafeWorkspaceReturnTo, normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo, splitOrganizationWorkspacePath } from "@/lib/workspace-intent";

type RegisterInvitePreview =
  | { status: "ready"; invite: TableRow<"club_invites">; club: TableRow<"clubs"> }
  | { status: "missing" | "unavailable" | "expired" | "invalid"; message: string };

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
    const membership = session.activeClub
      ? session.memberships.find((item) => item.club.slug === session.activeClub?.slug)
      : session.memberships[0];
    if (membership) {
      redirect(scopeWorkspaceReturnTo(getRoleSafeWorkspaceReturnTo(returnTo, membership.role), membership.club.slug));
    }
    redirect(`/clubs?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (inviteToken && (await hasRefreshSessionCookie())) {
    redirect(`/api/invites/accept?invite=${encodeURIComponent(inviteToken)}&returnTo=${encodeURIComponent(returnTo)}`);
  }
  await redirectToSessionRefreshIfPossible(returnTo);
  const invitePreview = inviteToken ? await getRegisterInvitePreview(inviteToken) : null;

  return (
    <AuthShell>
      <Card className="w-full">
        <h1 className="text-3xl font-semibold">{inviteToken ? "Join academy" : "Create account"}</h1>
        {error && (
          <div className="mt-4 rounded-xl border border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
            {error}
          </div>
        )}
        {invitePreview?.status === "ready" && (
          <div className="mt-4 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/8 p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)]">
                <Building2 size={18} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">{invitePreview.club.name}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Create your account with <span className="font-semibold text-[var(--foreground)]">{invitePreview.invite.email}</span> to join this club.
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="accent">{invitePreview.invite.role}</Badge>
              <Badge variant="muted">{invitePreview.club.slug}</Badge>
            </div>
          </div>
        )}
        {invitePreview && invitePreview.status !== "ready" && (
          <div className="mt-4 rounded-xl border border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
            {invitePreview.message}
          </div>
        )}
        {invitePreview?.status !== "ready" && inviteToken ? (
          <div className="mt-5">
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                Back to login
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-6" />
            <RegisterForm
              returnTo={returnTo}
              inviteToken={invitePreview?.status === "ready" ? inviteToken : undefined}
              inviteEmail={invitePreview?.status === "ready" ? invitePreview.invite.email : undefined}
            />
            <div className="mt-5 border-t border-[var(--border)] pt-5">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}${inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ""}`}>
                  Sign in
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </>
        )}
      </Card>
    </AuthShell>
  );
}

async function getRegisterInvitePreview(inviteToken: string): Promise<RegisterInvitePreview> {
  if (!inviteToken) return { status: "missing", message: "Invite link is missing. Ask the academy owner to send a new invitation." };
  if (!isSupabaseConfigured()) return { status: "unavailable", message: "Club invites need the Supabase backend to be configured." };

  try {
    const [invite] = await selectRows("club_invites", `select=*&token=eq.${encodeURIComponent(inviteToken)}&limit=1`);
    if (!invite || invite.status !== "pending") return { status: "invalid", message: "This invite was already used, revoked, or does not exist." };
    if (new Date(invite.expires_at).getTime() < Date.now()) return { status: "expired", message: "This invite has expired. Ask the academy owner to send a new invite." };

    const [club] = await selectRows("clubs", `select=*&id=eq.${invite.club_id}&limit=1`);
    if (!club) return { status: "invalid", message: "The invited academy could not be found." };

    return { status: "ready", invite, club };
  } catch {
    return { status: "unavailable", message: "Grapply could not load this invite right now. Try again in a moment." };
  }
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
