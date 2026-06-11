import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, Mail, ShieldCheck, UserRoundCheck } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { hasRefreshSessionCookie } from "@/lib/auth-refresh-redirect";
import { getCurrentSession } from "@/lib/auth-session";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";
import type { TableRow } from "@/lib/supabase/types";
import { getRoleSafeWorkspaceReturnTo, getWorkspaceIntentLabel, normalizeWorkspaceReturnTo } from "@/lib/workspace-intent";

type InvitePreview =
  | {
      status: "ready";
      invite: TableRow<"club_invites">;
      club: TableRow<"clubs">;
    }
  | {
      status: "missing" | "unavailable" | "expired" | "invalid";
      message: string;
    };

export default async function InvitePage({ searchParams }: { searchParams?: Promise<{ invite?: string; returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  const inviteToken = params?.invite ? String(params.invite).trim() : "";
  const returnTo = normalizeWorkspaceReturnTo(params?.returnTo);
  const session = await getCurrentSession();

  if (session && inviteToken) {
    redirect(`/api/invites/accept?invite=${encodeURIComponent(inviteToken)}&returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (!session && inviteToken && (await hasRefreshSessionCookie())) {
    redirect(`/api/invites/accept?invite=${encodeURIComponent(inviteToken)}&returnTo=${encodeURIComponent(returnTo)}`);
  }

  const preview = await getInvitePreview(inviteToken);
  const safeReturnTo = preview.status === "ready" ? getRoleSafeWorkspaceReturnTo(returnTo, preview.invite.role) : returnTo;
  const intentLabel = getWorkspaceIntentLabel(safeReturnTo);
  const authQuery = `returnTo=${encodeURIComponent(safeReturnTo)}${inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ""}`;

  return (
    <AuthShell>
      <Card className="w-full">
        <div className="mb-8 grid size-12 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
          <UserRoundCheck size={23} />
        </div>
        <h1 className="text-3xl font-semibold">Academy invite.</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Accept the club invite with the same email address it was sent to.
        </p>

        {preview.status === "ready" ? (
          <div className="mt-6 space-y-3 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/8 p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)]">
                <Building2 size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">{preview.club.name}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  You are invited as <span className="font-semibold text-[var(--foreground)]">{preview.invite.role}</span>. After login, Grapply will {intentLabel}.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="accent">{preview.invite.status}</Badge>
              <Badge variant="muted">{preview.club.slug}</Badge>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 px-4 py-3 text-sm leading-6 text-[var(--foreground)]">
            {preview.message}
          </div>
        )}

        {params?.error && (
          <div className="mt-4 rounded-xl border border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
            {params.error}
          </div>
        )}

        <div className="mt-5 grid gap-3">
          <Button asChild variant="primary" className="w-full" disabled={preview.status !== "ready"}>
            <Link href={`/login?${authQuery}`}>
              <ShieldCheck size={16} />
              Sign in and accept
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full" disabled={preview.status !== "ready"}>
            <Link href={`/register?${authQuery}`}>
              <Mail size={16} />
              Create account and join
            </Link>
          </Button>
        </div>

        <Link href="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
          Back to login
          <ArrowRight size={15} />
        </Link>
      </Card>
    </AuthShell>
  );
}

async function getInvitePreview(inviteToken: string): Promise<InvitePreview> {
  if (!inviteToken) {
    return { status: "missing", message: "Invite link is missing. Ask the academy owner to send a new invitation." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "unavailable", message: "Club invites need the Supabase backend to be configured." };
  }

  try {
    const [invite] = await selectRows("club_invites", `select=*&token=eq.${encodeURIComponent(inviteToken)}&limit=1`);
    if (!invite || invite.status !== "pending") {
      return { status: "invalid", message: "This invite was already used, revoked, or does not exist." };
    }

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return { status: "expired", message: "This invite has expired. Ask the academy owner to send a new invite." };
    }

    const [club] = await selectRows("clubs", `select=*&id=eq.${invite.club_id}&limit=1`);
    if (!club) {
      return { status: "invalid", message: "The invited academy could not be found." };
    }

    return { status: "ready", invite, club };
  } catch {
    return { status: "unavailable", message: "Grapply could not load this invite right now. Try again in a moment." };
  }
}
