import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Academy identity, appearance, coaches, and presentation settings prepared for future backend integration.">
      <PageTransition>
        <SettingsTabs />
      </PageTransition>
    </AppShell>
  );
}
