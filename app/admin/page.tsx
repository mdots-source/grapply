import Link from "next/link";
import { CalendarDays, KeyRound, ShieldCheck, UserCog, Users } from "lucide-react";
import { ClubUsersList } from "@/components/admin/club-users-list";
import { InviteUserForm } from "@/components/admin/invite-user-form";
import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clubClasses, clubs, clubMemberships, platformUsers, roleDefinitions } from "@/data/platform";
import { requireWorkspaceRole } from "@/lib/workspace-access";

export default async function AdminPage() {
  const session = await requireWorkspaceRole(["owner", "admin"], "/admin");
  const club = clubs.find((item) => item.slug === session.activeClub.slug) ?? session.activeClub;
  const memberships = clubMemberships.filter((membership) => membership.clubId === club.id);
  const classes = clubClasses.filter((item) => item.clubId === club.id);
  const roleCounts = roleDefinitions.map((role) => ({
    ...role,
    count: memberships.filter((membership) => membership.role === role.role).length,
  }));
  const rosterUsers = memberships
    .map((membership) => ({
      membership,
      user: platformUsers.find((candidate) => candidate.id === membership.userId),
    }))
    .filter((item): item is { membership: (typeof memberships)[number]; user: (typeof platformUsers)[number] } => Boolean(item.user));
  const trainerCount = memberships.filter((membership) => membership.role === "coach").length;

  return (
    <AppShell
      title="Team Access"
      subtitle="Owner tools for trainers, members, roles, and organization access."
      initialSession={session}
    >
      <PageTransition>
        <div className="space-y-5">
          <Card className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Managing club</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{club.name}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{club.location}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="success">{trainerCount} trainers</Badge>
                  <Badge variant="muted">{memberships.length} users</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Badge variant="accent" className="capitalize">{session.activeRole}</Badge>
                <Button variant="surface" size="sm" asChild>
                  <Link href="/clubs?returnTo=/admin">Switch club</Link>
                </Button>
                <Button variant="primary" size="sm" asChild>
                  <Link href="/members?add=1">Add member</Link>
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <AdminStat icon={Users} label="Users" value={memberships.length.toString()} />
            <AdminStat icon={UserCog} label="Trainers" value={trainerCount.toString()} />
            <AdminStat icon={CalendarDays} label="BJJ classes" value={classes.length.toString()} />
            <AdminStat icon={ShieldCheck} label="Roles" value={roleDefinitions.length.toString()} />
          </div>

          <Card className="p-4">
            <div className="grid gap-3 lg:grid-cols-4">
              {roleCounts.map((role) => (
                <div key={role.role} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={role.count > 0 ? "accent" : "muted"}>{role.label}</Badge>
                    <span className="text-xl font-semibold tabular-nums text-[var(--foreground)]">{role.count}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{role.description}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Invite user</CardTitle>
                <CardDescription>Invite a trainer or member into this academy.</CardDescription>
              </div>
            </CardHeader>
            <InviteUserForm />
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Role management</CardTitle>
                <CardDescription>Choose the responsibilities each person has inside the academy.</CardDescription>
              </div>
              <UserCog size={20} className="text-[var(--accent)]" />
            </CardHeader>
            <div className="grid gap-3 lg:grid-cols-2">
              {roleDefinitions.map((role) => (
                <div key={role.role} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="accent">{role.label}</Badge>
                      <h3 className="mt-3 text-sm font-semibold text-[var(--foreground)]">{role.label}</h3>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{role.description}</p>
                    </div>
                    <KeyRound size={18} className="text-[var(--muted)]" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {role.permissions.map((permission) => (
                      <Badge key={permission} variant="muted">{permission}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Club users</CardTitle>
                <CardDescription>People with access to this academy.</CardDescription>
              </div>
              <Button variant="surface" size="sm" asChild>
                <Link href="/members">Open roster</Link>
              </Button>
            </CardHeader>
            <ClubUsersList
              users={rosterUsers.map(({ membership, user }) => ({
                membershipId: membership.id,
                name: user.name,
                email: user.email,
                belt: user.belt,
                stripes: user.stripes,
                role: membership.role,
                joinedAt: membership.joinedAt,
                stravaStatus: user.stravaStatus,
              }))}
            />
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Academy classes</CardTitle>
                <CardDescription>Current classes available to members.</CardDescription>
              </div>
              <Button variant="surface" size="sm" asChild>
                <Link href="/schedule?create=class">Create class</Link>
              </Button>
            </CardHeader>
            <div className="grid gap-3 lg:grid-cols-2">
              {classes.map((item) => (
                <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{item.name}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{item.day} · {item.time} · {item.mat}</p>
                    </div>
                    <Badge variant="muted">{item.checkedIn} checked in</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="muted">Coach {item.coach}</Badge>
                    <Badge variant="muted">{item.level}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </PageTransition>
    </AppShell>
  );
}

function AdminStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <Card className="p-4">
      <Icon size={18} className="text-[var(--accent)]" />
      <p className="mt-4 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{label}</p>
    </Card>
  );
}
