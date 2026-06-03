import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { requireWorkspaceRole } from "@/lib/workspace-access";

export default async function SettingsPage() {
  const session = await requireWorkspaceRole(["owner", "admin"], "/settings");

  return (
    <AppShell title="Settings" subtitle="Academy identity, appearance, coaches, and presentation preferences." initialSession={session}>
      <PageTransition>
        <SettingsTabs />
      </PageTransition>
    </AppShell>
  );
}
