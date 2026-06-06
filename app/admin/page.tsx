import Link from "next/link";
import { AlertTriangle, CalendarDays, KeyRound, MailCheck, ShieldCheck, UserCog, Users } from "lucide-react";
import { ClubUsersList } from "@/components/admin/club-users-list";
import { EmailOutboxActions } from "@/components/admin/email-outbox-actions";
import { InviteUserForm } from "@/components/admin/invite-user-form";
import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clubClasses, clubs, clubMemberships, platformUsers, roleDefinitions, type ClubClass, type ClubMembership, type PlatformRole, type PlatformUser, type RoleDefinition } from "@/data/platform";
import { getBackendClubId } from "@/lib/backend";
import { isEmailDeliveryConfigured } from "@/lib/email/delivery";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";
import { toClubClass, toClubMembership, toPlatformUser } from "@/lib/supabase/mappers";
import type { TableRow } from "@/lib/supabase/types";
import { requireWorkspaceRole } from "@/lib/workspace-access";
import { getWorkspaceHref } from "@/lib/workspace-url";

export default async function AdminPage() {
  const session = await requireWorkspaceRole(["owner", "admin"], "/admin");
  const { club, memberships, classes, roleDefs, rosterUsers, emailOutbox, emailDeliveryConfigured, errorEvents, invites, loadError } = await getAdminWorkspaceData(session);
  const organizationId = session.activeClub.slug;
  const roleCounts = roleDefs.map((role) => ({
    ...role,
    count: memberships.filter((membership) => membership.role === role.role).length,
  }));
  const coachCount = memberships.filter((membership) => membership.role === "coach").length;

  return (
    <AppShell
      title="Team Access"
      subtitle="Owner tools for coaches, members, roles, and organization access."
      initialSession={session}
    >
      <PageTransition>
        <div className="space-y-5">
          {loadError && (
            <Card className="border-[var(--accent-coral)]/30 bg-[var(--accent-coral)]/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--accent-coral)]/30 bg-[var(--surface)] text-[var(--accent-coral)]">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Team access data is partially unavailable</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{loadError}</p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Managing club</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{club.name}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{club.location}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="success">{coachCount} coaches</Badge>
                  <Badge variant="muted">{memberships.length} users</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Badge variant="accent" className="capitalize">{session.activeRole}</Badge>
                <Button variant="primary" size="sm" asChild>
                  <Link href={getWorkspaceHref("/members?add=1", organizationId)}>Add member</Link>
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <AdminStat icon={Users} label="Users" value={memberships.length.toString()} />
            <AdminStat icon={UserCog} label="Coaches" value={coachCount.toString()} />
            <AdminStat icon={CalendarDays} label="BJJ classes" value={classes.length.toString()} />
            <AdminStat icon={ShieldCheck} label="Roles" value={roleDefs.length.toString()} />
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
                <CardDescription>Invite staff or members into this academy with the right access.</CardDescription>
              </div>
            </CardHeader>
            <InviteUserForm currentRole={session.activeRole} clubSlug={organizationId} initialInvites={invites} />
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Email outbox</CardTitle>
                <CardDescription>Recent invite and welcome messages queued for this club.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <MailCheck size={20} className="text-[var(--accent)]" />
                <EmailOutboxActions clubSlug={organizationId} deliveryConfigured={emailDeliveryConfigured} />
              </div>
            </CardHeader>
            {!emailDeliveryConfigured && (
              <div className="mb-3 rounded-xl border border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 p-3 text-xs leading-5 text-[var(--foreground)]">
                Email delivery is queued but not sending yet. Add Resend env vars before sending invite and welcome emails.
              </div>
            )}
            {emailOutbox.length > 0 ? (
              <div className="space-y-2">
                {emailOutbox.slice(0, 5).map((email) => (
                  <div key={email.id} className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">{email.to_email}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{email.subject}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={email.status === "pending" ? "accent" : email.status === "sent" ? "success" : "muted"}>
                        {email.status}
                      </Badge>
                      <span className="text-xs text-[var(--muted)]">{formatAdminDate(email.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
                No queued emails yet. Invites and welcome messages will appear here.
              </div>
            )}
          </Card>

          {session.activeRole === "owner" && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Backend errors</CardTitle>
                  <CardDescription>Recent backend failures recorded by request id for support and demo debugging.</CardDescription>
                </div>
                <AlertTriangle size={20} className={errorEvents.length > 0 ? "text-[var(--status-danger)]" : "text-[var(--muted)]"} />
              </CardHeader>
              {errorEvents.length > 0 ? (
                <div className="space-y-2">
                  {errorEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={event.severity === "error" ? "muted" : "accent"}>{event.source}</Badge>
                            <span className="font-mono text-[11px] text-[var(--muted)]">{event.request_id}</span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm text-[var(--foreground)]">{event.message}</p>
                        </div>
                        <span className="shrink-0 text-xs text-[var(--muted)]">{formatAdminDate(event.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
                  No backend errors recorded yet.
                </div>
              )}
            </Card>
          )}

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Role management</CardTitle>
                <CardDescription>Choose the responsibilities each person has inside the academy.</CardDescription>
              </div>
              <UserCog size={20} className="text-[var(--accent)]" />
            </CardHeader>
            <div className="grid gap-3 lg:grid-cols-2">
              {roleDefs.map((role) => (
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
                <Link href={getWorkspaceHref("/members", organizationId)}>Open roster</Link>
              </Button>
            </CardHeader>
            <ClubUsersList
              currentRole={session.activeRole}
              clubSlug={organizationId}
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
                <Link href={getWorkspaceHref("/schedule?create=class", organizationId)}>Create class</Link>
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

type AdminWorkspaceData = {
  club: { id: string; slug: string; name: string; location: string };
  memberships: ClubMembership[];
  classes: ClubClass[];
  roleDefs: RoleDefinition[];
  rosterUsers: Array<{ membership: ClubMembership; user: PlatformUser }>;
  emailOutbox: EmailOutboxRow[];
  emailDeliveryConfigured: boolean;
  errorEvents: AppErrorEventRow[];
  invites: ClubInviteRow[];
  loadError: string | null;
};

async function getAdminWorkspaceData(session: Awaited<ReturnType<typeof requireWorkspaceRole>>): Promise<AdminWorkspaceData> {
  if (isSupabaseConfigured()) {
    try {
      const clubId = await getBackendClubId(session.activeClub.slug);
      if (!clubId) {
        return {
          club: session.activeClub,
          memberships: [],
          classes: [],
          roleDefs: roleDefinitions,
          rosterUsers: [],
          emailOutbox: [],
          emailDeliveryConfigured: isEmailDeliveryConfigured(),
          errorEvents: [],
          invites: [],
          loadError: "This club could not be found in Supabase.",
        };
      }

      const inviteRoleFilter = session.activeRole === "admin" ? "&role=in.(coach,member)" : "";
      const membershipRoleFilter = session.activeRole === "admin" ? "&role=in.(coach,member)" : "";
      const [roleRows, membershipRows, classRows, emailRows, errorRows, inviteRows] = await Promise.all([
        selectRows("role_definitions"),
        selectRows("club_memberships", `select=*&club_id=eq.${clubId}${membershipRoleFilter}`),
        selectRows("club_classes", `select=*&club_id=eq.${clubId}`),
        selectRows("email_outbox", `select=*&club_id=eq.${clubId}&order=created_at.desc&limit=10`),
        session.activeRole === "owner"
          ? selectRows("app_error_events", `select=*&club_id=eq.${clubId}&order=created_at.desc&limit=10`)
          : Promise.resolve([]),
        selectRows("club_invites", `select=*&club_id=eq.${clubId}${inviteRoleFilter}&order=created_at.desc`),
      ]);
      const userIds = membershipRows.map((membership) => membership.user_id);
      const [userRows, stravaRows] = await Promise.all([
        userIds.length ? selectRows("app_users", `select=*&id=in.(${userIds.join(",")})`) : Promise.resolve([]),
        userIds.length ? selectRows("strava_connections", `select=*&club_id=eq.${clubId}&user_id=in.(${userIds.join(",")})`) : Promise.resolve([]),
      ]);

      const memberships = membershipRows.map(toClubMembership);
      const users: PlatformUser[] = userRows.map((row) => {
        const user = toPlatformUser(row);
        const stravaConnection = stravaRows.find((connection) => connection.user_id === row.id);
        return {
          ...user,
          stravaStatus: stravaConnection ? "connected" as const : user.stravaStatus,
          ...(stravaConnection?.athlete_id ? { stravaAthleteId: stravaConnection.athlete_id } : {}),
        };
      });
      const rosterUsers: Array<{ membership: ClubMembership; user: PlatformUser }> = [];
      memberships.forEach((membership) => {
        const user = users.find((candidate) => candidate.id === membership.userId);
        if (user) rosterUsers.push({ membership, user });
      });

      return {
        club: session.activeClub,
        memberships,
        classes: classRows.map(toClubClass),
        roleDefs: roleRows
          .filter((role) => session.activeRole === "owner" || role.role === "coach" || role.role === "member")
          .map((role) => ({
            role: role.role,
            label: role.label,
            description: role.description,
            permissions: role.permissions,
          })),
        rosterUsers,
        emailOutbox: emailRows,
        emailDeliveryConfigured: isEmailDeliveryConfigured(),
        errorEvents: errorRows,
        invites: inviteRows,
        loadError: null,
      };
    } catch (error) {
      const club = clubs.find((item) => item.slug === session.activeClub.slug) ?? session.activeClub;
      const memberships = clubMemberships.filter(
        (membership) => membership.clubId === club.id && (session.activeRole === "owner" || membership.role === "coach" || membership.role === "member"),
      );
      const classes = clubClasses.filter((item) => item.clubId === club.id);
      return {
        club,
        memberships,
        classes,
        roleDefs: roleDefinitions.filter((role) => session.activeRole === "owner" || role.role === "coach" || role.role === "member"),
        rosterUsers: memberships
          .map((membership) => ({
            membership,
            user: platformUsers.find((candidate) => candidate.id === membership.userId),
          }))
          .filter((item): item is { membership: ClubMembership; user: PlatformUser } => Boolean(item.user)),
        emailOutbox: [],
        emailDeliveryConfigured: isEmailDeliveryConfigured(),
        errorEvents: [],
        invites: [],
        loadError: error instanceof Error ? error.message : "Could not load team access data from Supabase.",
      };
    }
  }

  const club = clubs.find((item) => item.slug === session.activeClub.slug) ?? session.activeClub;
  const memberships = clubMemberships.filter(
    (membership) => membership.clubId === club.id && (session.activeRole === "owner" || membership.role === "coach" || membership.role === "member"),
  );
  const classes = clubClasses.filter((item) => item.clubId === club.id);

  return {
    club,
    memberships,
    classes,
    roleDefs: roleDefinitions.filter((role) => session.activeRole === "owner" || role.role === "coach" || role.role === "member"),
    rosterUsers: memberships
      .map((membership) => ({
        membership,
        user: platformUsers.find((candidate) => candidate.id === membership.userId),
      }))
      .filter((item): item is { membership: ClubMembership; user: PlatformUser } => Boolean(item.user)),
    emailOutbox: [],
    emailDeliveryConfigured: false,
    errorEvents: [],
    invites: [],
    loadError: null,
  };
}

type EmailOutboxRow = TableRow<"email_outbox">;
type AppErrorEventRow = TableRow<"app_error_events">;
type ClubInviteRow = TableRow<"club_invites">;

function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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
