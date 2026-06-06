import { AppShell } from "@/components/app-shell";
import { MembersGrid, type RosterFilter } from "@/components/members-grid";
import { PageTransition } from "@/components/page-transition";
import { getVisibleMembersData } from "@/lib/backend-data";
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
  const session = await requireWorkspaceRole(["owner", "admin", "coach", "member"], `/members${returnToParams.size ? `?${returnToParams}` : ""}`);
  const canManageMembers = session.activeRole === "owner" || session.activeRole === "admin";
  const canUseStaffActions = session.activeRole === "owner" || session.activeRole === "admin" || session.activeRole === "coach";
  const canDeleteMembers = session.activeRole === "owner" || session.activeRole === "admin";
  const filterOptions: RosterFilter[] = ["all", "active", "promotion", "inactive", "trial", "follow-up"];
  const initialFilter = filterOptions.includes(params?.filter as RosterFilter) ? (params?.filter as RosterFilter) : "all";
  let initialMembersError: string | null = null;
  const initialMembers = await getVisibleMembersData({
    clubSlug: session.activeClub.slug,
    userId: session.user.id,
    userEmail: session.user.email,
    role: session.activeRole,
  }).catch((error) => {
    initialMembersError = error instanceof Error ? error.message : "Could not load members.";
    return [];
  });

  return (
    <AppShell title="Members" subtitle="Roster, belts, roles, and profiles for the active academy." initialSession={session}>
      <PageTransition>
        <MembersGrid
          initialMembers={initialMembers}
          initialMembersError={initialMembersError}
          initialClubSlug={session.activeClub.slug}
          initialAdd={canManageMembers && params?.add === "1"}
          initialFilter={initialFilter}
          initialMemberId={params?.member}
          canManageMembers={canManageMembers}
          canUseStaffActions={canUseStaffActions}
          canDeleteMembers={canDeleteMembers}
        />
      </PageTransition>
    </AppShell>
  );
}
