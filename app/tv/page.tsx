import { TvScreen } from "@/components/tv/tv-screen";
import { requireWorkspaceRole } from "@/lib/workspace-access";

export default async function TvPage() {
  await requireWorkspaceRole(["owner", "admin", "coach"], "/tv");

  return <TvScreen />;
}
