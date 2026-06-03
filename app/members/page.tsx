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
  const filterOptions: RosterFilter[] = ["all", "active", "promotion", "inactive", "trial", "attention"];
  const initialFilter = filterOptions.includes(params?.filter as RosterFilter) ? (params?.filter as RosterFilter) : "all";

  return (
    <AppShell title="Members" subtitle="A high-signal roster for membership status, attendance momentum, belt progression, and coaching focus." initialSession={session}>
      <PageTransition>
        <MembersGrid initialAdd={params?.add === "1"} initialFilter={initialFilter} initialMemberId={params?.member} />
      </PageTransition>
    </AppShell>
  );
}
