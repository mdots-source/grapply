import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { requireWorkspaceRole } from "@/lib/workspace-access";

export default async function SettingsPage({ searchParams }: { searchParams?: Promise<{ strava?: string }> }) {
  const params = await searchParams;
  const session = await requireWorkspaceRole(["owner", "admin"], "/settings");

  return (
    <AppShell title="Settings" subtitle="Appearance, integrations, and academy preferences for the active club." initialSession={session}>
      <PageTransition>
        <SettingsTabs
          currentRole={session.activeRole}
          stravaResult={params?.strava}
          initialClubSlug={session.activeClub.slug}
          initialClubName={session.activeClub.name}
        />
      </PageTransition>
    </AppShell>
  );
}
