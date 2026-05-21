import { AppShell } from "@/components/app-shell";
import { MembersGrid } from "@/components/members-grid";
import { PageTransition } from "@/components/page-transition";

export default function MembersPage() {
  return (
    <AppShell title="Members" subtitle="A high-signal roster for membership status, attendance momentum, belt progression, and coaching focus.">
      <PageTransition>
        <MembersGrid />
      </PageTransition>
    </AppShell>
  );
}
