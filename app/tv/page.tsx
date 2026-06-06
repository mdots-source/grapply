import { TvScreen } from "@/components/tv/tv-screen";
import { getTvDisplayData } from "@/lib/backend-data";
import { requireWorkspaceRole } from "@/lib/workspace-access";

export default async function TvPage() {
  const session = await requireWorkspaceRole(["owner", "admin", "coach"], "/tv");
  const tvData = await getTvDisplayData(session.activeClub.slug).catch(() => null);

  return (
    <TvScreen
      session={tvData?.session}
      athletes={tvData?.athletes}
      tickerItems={tvData?.tickerItems}
      organizationId={session.activeClub.slug}
    />
  );
}
