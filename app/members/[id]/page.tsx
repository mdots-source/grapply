import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MemberProfile } from "@/components/member-profile";
import { PageTransition } from "@/components/page-transition";
import { getClubRoster } from "@/data/platform";
import { getMockClubId } from "@/lib/backend";
import { requireWorkspaceRole } from "@/lib/workspace-access";

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireWorkspaceRole(["owner", "admin", "coach"], `/members/${id}`);
  const clubId = getMockClubId(session.activeClub?.slug);
  const member = getClubRoster(clubId).find((item) => item.id === id);
  if (!member) notFound();

  return (
    <AppShell title={member.name} subtitle="Coach-ready profile with belt progression, attendance, competition record, and academy milestones." initialSession={session}>
      <PageTransition>
        <MemberProfile member={member} viewerRole={session.activeRole} />
      </PageTransition>
    </AppShell>
  );
}
