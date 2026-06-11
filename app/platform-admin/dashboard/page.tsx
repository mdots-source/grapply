import { Activity, Building2, CreditCard, HeartPulse, Mail, ShieldCheck, UsersRound } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { BrandLogo } from "@/components/brand-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clubs, platformUsers } from "@/data/platform";

const platformModules = [
  {
    title: "Academies",
    description: "Create academies manually, archive workspaces, and assign owners.",
    icon: Building2,
  },
  {
    title: "Users & access",
    description: "Manage platform users, club memberships, invites, and staff roles.",
    icon: UsersRound,
  },
  {
    title: "Manual billing",
    description: "Track invoice status while payments are handled outside Grapply.",
    icon: CreditCard,
  },
  {
    title: "Health checks",
    description: "Watch Supabase, email delivery, Strava OAuth, and production config.",
    icon: HeartPulse,
  },
];

export default async function PlatformAdminDashboardPage() {
  const session = await requirePlatformAdmin();

  return (
    <main className="min-h-screen px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <BrandLogo className="mt-1 size-12 rounded-xl border border-[var(--border)]" priority />
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="accent">Platform admin</Badge>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{session.platformRole}</span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold md:text-4xl">Grapply Platform Admin</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Internal control room for the Grapply team. This is separate from academy admin workspaces.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="surface">
              <a href="/clubs">Academy portal</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/api/auth/logout">Logout</a>
            </Button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Academies" value={clubs.length} detail="Seeded workspaces" />
          <MetricCard label="Users" value={platformUsers.length} detail="Known app accounts" />
          <MetricCard label="Billing" value="Manual" detail="Stripe SaaS disabled for now" />
          <MetricCard label="Access model" value="Split" detail="Platform roles are not club roles" />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {platformModules.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title}>
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]">
                    <Icon size={20} />
                  </div>
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </section>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Next build targets</CardTitle>
            <CardDescription>Foundation is ready; these actions should become real CRUD in this internal area.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Todo icon={Building2} text="Create academy" />
              <Todo icon={ShieldCheck} text="Assign academy owner" />
              <Todo icon={Mail} text="Send invite" />
              <Todo icon={Activity} text="View production health" />
              <Todo icon={UsersRound} text="Review all users" />
              <Todo icon={CreditCard} text="Mark invoice status" />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: React.ReactNode; detail: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
        <p className="text-xs text-[var(--muted)]">{detail}</p>
      </CardHeader>
    </Card>
  );
}

function Todo({ icon: Icon, text }: { icon: typeof Building2; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-semibold">
      <Icon size={16} className="text-[var(--accent)]" />
      {text}
    </div>
  );
}
