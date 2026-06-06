import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MemberProfile } from "@/components/member-profile";
import { PageTransition } from "@/components/page-transition";
import { getVisibleMemberData } from "@/lib/backend-data";
import { getMemberProfileLiveData } from "@/lib/member-profile-data";
import { requireWorkspaceRole } from "@/lib/workspace-access";

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireWorkspaceRole(["owner", "admin", "coach", "member"], `/members/${id}`);
  const member = await getVisibleMemberData({
    memberId: id,
    clubSlug: session.activeClub.slug,
    userId: session.user.id,
    userEmail: session.user.email,
    role: session.activeRole,
  });
  if (!member) notFound();
  let liveDataError: string | null = null;
  const liveData = await getMemberProfileLiveData({
    clubSlug: session.activeClub.slug,
    memberId: member.id,
    userId: session.user.id,
    userEmail: session.user.email,
    role: session.activeRole,
  }).catch((error) => {
    liveDataError = error instanceof Error ? error.message : "Could not load member live history.";
    return null;
  });

  return (
    <AppShell title={member.name} subtitle="Coach-ready profile with belt progression, attendance, competition record, and academy milestones." initialSession={session}>
      <PageTransition>
        <MemberProfile
          member={member}
          viewerRole={session.activeRole}
          viewerUserId={session.user.id}
          initialLiveData={liveData}
          initialLiveDataError={liveDataError}
          initialClubSlug={session.activeClub.slug}
        />
      </PageTransition>
    </AppShell>
  );
}
