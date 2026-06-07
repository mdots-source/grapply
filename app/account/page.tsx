import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { StravaAccountPanel } from "@/components/strava-account-panel";
import { requireWorkspaceRole } from "@/lib/workspace-access";

export default async function AccountPage() {
  const session = await requireWorkspaceRole(["owner", "admin", "coach", "member"], "/account");
  const returnTo = `/${session.activeClub.slug}/account`;

  return (
    <AppShell title="Account" subtitle="Personal academy access and connected training activity." initialSession={session}>
      <PageTransition>
        <StravaAccountPanel clubSlug={session.activeClub.slug} returnTo={returnTo} />
      </PageTransition>
    </AppShell>
  );
}
