import { NextResponse } from "next/server";
import { setActiveClubCookie, setMockAuthCookie } from "@/lib/auth-cookies";
import { getCurrentSession, getDemoWorkspaceSession } from "@/lib/auth-session";

export async function GET() {
  const session = await getCurrentSession();
  if (session) return NextResponse.json({ authenticated: true, ...session });

  if (process.env.GRAPPLY_DEMO_AUTO_LOGIN !== "false") {
    const demoSession = getDemoWorkspaceSession();
    if (demoSession) {
      const response = NextResponse.json({ authenticated: true, ...demoSession, source: "demo" });
      setMockAuthCookie(response, demoSession.user.id);
      if (demoSession.activeClub?.slug) setActiveClubCookie(response, demoSession.activeClub.slug);
      return response;
    }
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
