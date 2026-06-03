import { AppShell } from "@/components/app-shell";
import { MembersGrid, type RosterFilter } from "@/components/members-grid";
import { PageTransition } from "@/components/page-transition";
import { requireWorkspaceRole } from "@/lib/workspace-access";

type MembersSearchParams = {
  add?: string;
  filter?: string;
  member?: string;
};

export default async function MembersPage({ searchParams }: { searchParams?: Promise<MembersSearchParams> }) {
  const params = await searchParams;
  const returnToParams = new URLSearchParams();
  if (params?.add) returnToParams.set("add", params.add);
  if (params?.filter) returnToParams.set("filter", params.filter);
  if (params?.member) returnToParams.set("member", params.member);
  const session = await requireWorkspaceRole(["owner", "admin", "coach"], `/members${returnToParams.size ? `?${returnToParams}` : ""}`);
  const canManageMembers = session.activeRole !== "member";
  const filterOptions: RosterFilter[] = ["all", "active", "promotion", "inactive", "trial", "follow-up"];
  const initialFilter = filterOptions.includes(params?.filter as RosterFilter) ? (params?.filter as RosterFilter) : "all";

  return (
    <AppShell title="Members" subtitle="Roster, belts, roles, and profiles for the active academy." initialSession={session}>
      <PageTransition>
        <MembersGrid initialAdd={canManageMembers && params?.add === "1"} initialFilter={initialFilter} initialMemberId={params?.member} canManageMembers={canManageMembers} />
      </PageTransition>
    </AppShell>
  );
}
