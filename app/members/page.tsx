import { AppShell } from "@/components/app-shell";
import { MembersGrid, type RosterFilter } from "@/components/members-grid";
import { PageTransition } from "@/components/page-transition";

type MembersSearchParams = {
  add?: string;
  filter?: string;
};

export default async function MembersPage({ searchParams }: { searchParams?: Promise<MembersSearchParams> }) {
  const params = await searchParams;
  const filterOptions: RosterFilter[] = ["all", "active", "promotion", "inactive", "trial", "attention"];
  const initialFilter = filterOptions.includes(params?.filter as RosterFilter) ? (params?.filter as RosterFilter) : "all";

  return (
    <AppShell title="Members" subtitle="A high-signal roster for membership status, attendance momentum, belt progression, and coaching focus.">
      <PageTransition>
        <MembersGrid initialAdd={params?.add === "1"} initialFilter={initialFilter} />
      </PageTransition>
    </AppShell>
  );
}
