import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MemberProfile } from "@/components/member-profile";
import { PageTransition } from "@/components/page-transition";
import { students } from "@/data/academy";

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = students.find((item) => item.id === id);
  if (!member) notFound();

  return (
    <AppShell title={member.name} subtitle="Coach-ready profile with belt progression, attendance, competition record, and academy milestones.">
      <PageTransition>
        <MemberProfile member={member} />
      </PageTransition>
    </AppShell>
  );
}
