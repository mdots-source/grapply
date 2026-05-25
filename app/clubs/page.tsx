import Link from "next/link";
import { Activity, Building2, CheckCircle2, DoorOpen, Plus, Shield, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/oss/empty-state";
import { getCurrentSession } from "@/lib/auth-session";

export default async function ClubsPage({ searchParams }: { searchParams?: Promise<{ user?: string; strava?: string }> }) {
  const params = await searchParams;
  const session = await getCurrentSession();
  const user = session?.user;
  const memberships = session?.memberships ?? [];
  const stravaStatus = params?.strava;

  if (!user) {
    return null;
  }

  return (
    <AppShell
      title="My Clubs"
      subtitle="Your account can belong to one academy, several clubs, or none yet. Every workspace opens with the role assigned by that club."
    >
      <PageTransition>
        <div className="space-y-5">
          <Card className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Signed in as</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{user.name}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{user.email}</p>
              </div>
            </div>
          </Card>

          {stravaStatus && (
            <Card className="border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/8 p-4">
              <div className="flex items-center gap-3 text-sm text-[var(--foreground)]">
                <Activity size={18} className="text-[var(--accent-coral)]" />
                Strava status: {stravaStatus}
              </div>
            </Card>
          )}

          {memberships.length === 0 ? (
            <EmptyState
              icon={DoorOpen}
              title="You are not a member of any club yet."
              description="When a coach or academy admin invites this account, the club workspace will appear here with your assigned role and access level."
              className="min-h-[420px]"
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {memberships.map((membership) => (
                <Card key={membership.id} className="p-0">
                  <div className="border-b border-[var(--border)] p-5">
                    <CardHeader className="mb-0">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={membership.club.status === "active" ? "success" : "muted"}>{membership.club.status}</Badge>
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
                      <Link href={`/api/workspace/select?club=${membership.club.slug}&returnTo=/`}>Enter workspace</Link>
                    </Button>
                    <Button variant="surface" asChild>
                      <Link href={`/api/workspace/select?club=${membership.club.slug}&returnTo=/admin`}>Admin roles</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Club invite model</p>
                <p className="mt-1 text-xs text-[var(--muted)]">In production this becomes invite links, pending approvals, and domain-based membership rules.</p>
              </div>
              <Button variant="outline">
                <Plus size={16} />
                Request invite
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
