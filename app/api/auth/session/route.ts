import { clearActiveClubCookie, setAuthCookies } from "@/lib/auth-cookies";
import { noStoreJson } from "@/lib/api-json";
import { getCurrentSessionWithRefresh } from "@/lib/auth-session";

export async function GET() {
  const { session, refreshedSession } = await getCurrentSessionWithRefresh();
  if (session) {
    const response = noStoreJson({
      authenticated: true,
      user: session.user,
      memberships: session.memberships,
      activeClub: session.activeClub,
      activeRole: session.activeRole,
    });
    if (refreshedSession) setAuthCookies(response, refreshedSession);
    if (!session.activeClub) clearActiveClubCookie(response);
    return response;
  }

  return noStoreJson({ authenticated: false }, { status: 401 });
}
