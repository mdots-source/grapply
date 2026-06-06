import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, DoorOpen, Lock, Plus, Shield, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/oss/empty-state";
import { getCurrentSession } from "@/lib/auth-session";
import { getWorkspaceIntentLabel, normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo } from "@/lib/workspace-intent";

export default async function ClubsPage({ searchParams }: { searchParams?: Promise<{ user?: string; strava?: string; returnTo?: string; access?: string }> }) {
  const params = await searchParams;
  const session = await getCurrentSession();
  const user = session?.user;
  const memberships = session?.memberships ?? [];
  const stravaStatus = params?.strava;
  const workspaceReturnTo = normalizeWorkspaceReturnTo(params?.returnTo);
  const intentLabel = getWorkspaceIntentLabel(workspaceReturnTo);
  const accessDenied = params?.access === "denied";
  const inviteMailto = `mailto:?subject=${encodeURIComponent("Grapply club access request")}&body=${encodeURIComponent(
    `Hi,\n\nPlease invite ${user?.name ?? "me"} (${user?.email ?? "this account"}) to the right Grapply academy workspace.\n\nThanks!`,
  )}`;

  if (!user) {
    return null;
  }

  if (!accessDenied && memberships.length === 1) {
    const clubSlug = memberships[0].club.slug;
    redirect(`/clubs/select?club=${clubSlug}&returnTo=${encodeURIComponent(workspaceReturnTo)}`);
  }

  return (
    <AppShell
      title="Choose Academy"
      subtitle="Pick the workspace you want to open. The product navigation appears after this step."
      mode="account"
      initialSession={session}
    >
      <PageTransition>
        <div className="space-y-5">
          <Card className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Account ready</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Signed in as <span className="font-semibold text-[var(--foreground)]">{user.name}</span> · {user.email}
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/8 px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                Choose an academy to {intentLabel}.
                <ArrowRight size={15} className="text-[var(--accent)]" />
              </div>
            </div>
          </Card>

          {stravaStatus && (
            <Card className="border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/8 p-4">
              <div className="flex items-center gap-3 text-sm text-[var(--foreground)]">
                Training activity {stravaStatus === "connected" ? "connected" : "not connected yet"}
              </div>
            </Card>
          )}

          {accessDenied && (
            <Card className="border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/8 p-4">
              <div className="flex items-start gap-3 text-sm text-[var(--foreground)]">
                <Lock size={17} className="mt-0.5 shrink-0 text-[var(--accent-coral)]" />
                <div>
                  <p className="font-semibold">Manager access required.</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Ask an owner or admin to upgrade this account before opening the organization workspace.</p>
                </div>
              </div>
            </Card>
          )}

          {memberships.length === 0 ? (
            <EmptyState
              icon={DoorOpen}
              title="You are not a member of any club yet."
              description="When a coach or academy owner invites this account, the club workspace will appear here."
              className="min-h-[420px]"
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {memberships.map((membership) => {
                const canManageTeam = membership.role === "owner" || membership.role === "admin";
                const scopedReturnTo = scopeWorkspaceReturnTo(workspaceReturnTo, membership.club.slug);

                return (
                  <Card key={membership.id} className="group p-0 transition hover:border-[var(--accent)]/30 hover:bg-[var(--surface-hover)]">
                    <div className="border-b border-[var(--border)] p-5">
                      <CardHeader className="mb-0">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="accent" className="capitalize">{membership.role}</Badge>
                          </div>
                          <CardTitle className="mt-4 text-xl">{membership.club.name}</CardTitle>
                          <CardDescription>{membership.club.location}</CardDescription>
                        </div>
                        <div className="grid size-12 place-items-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/12 text-[var(--accent)]">
                          <Building2 size={22} />
                        </div>
                      </CardHeader>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-3">
                      <ClubMetric icon={Users} label="Members" value={membership.club.memberCount.toString()} />
                      <ClubMetric icon={Shield} label="Coach" value={membership.club.primaryCoach.split(" ")[0]} />
                      <ClubMetric icon={CheckCircle2} label="Joined" value={membership.joinedAt} />
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-[var(--border)] p-5">
                      <Button variant="primary" asChild>
                        <a href={`/clubs/select?club=${membership.club.slug}&returnTo=${encodeURIComponent(scopedReturnTo)}`}>
                          Open academy
                          <ArrowRight size={16} />
                        </a>
                      </Button>
                      {canManageTeam && (
                        <Button variant="surface" asChild>
                          <a href={`/clubs/select?club=${membership.club.slug}&returnTo=${encodeURIComponent(`/${membership.club.slug}/admin`)}`}>Manage team</a>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Need access to another academy?</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Ask the academy owner or head coach to invite your account.</p>
              </div>
              <Button variant="outline" asChild>
                <Link href={inviteMailto}>
                  <Plus size={16} />
                  Request invite
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </PageTransition>
    </AppShell>
  );
}

function ClubMetric({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <Icon size={16} className="text-[var(--accent)]" />
      <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">{value}</p>
      <p className="mt-1 text-[11px] text-[var(--muted)]">{label}</p>
    </div>
  );
}
