import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieNames } from "@/lib/auth-cookies";

export async function redirectToSessionRefreshIfPossible(returnTo: string) {
  if (!(await hasRefreshSessionCookie())) return;
  redirect(`/api/auth/refresh?returnTo=${encodeURIComponent(returnTo)}`);
}

export async function hasRefreshSessionCookie() {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(authCookieNames.refreshToken)?.value);
}
