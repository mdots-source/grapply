import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieNames } from "@/lib/auth-cookies";
import { getWorkspaceHref } from "@/lib/workspace-url";

export default async function StudentsRedirectPage() {
  const cookieStore = await cookies();
  redirect(getWorkspaceHref("/members", cookieStore.get(authCookieNames.activeClub)?.value));
}
