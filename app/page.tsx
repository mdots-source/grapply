import { redirect } from "next/navigation";
import { LandingPage } from "@/components/marketing/landing-page";
import { getCurrentSession } from "@/lib/auth-session";

export default async function Page() {
  const session = await getCurrentSession();

  if (session?.activeClub) {
    redirect(session.activeRole === "member" ? "/schedule" : "/dashboard");
  }

  if (session) {
    redirect("/clubs?returnTo=%2Fschedule");
  }

  return <LandingPage />;
}
