import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieNames } from "@/lib/auth-cookies";
import { getWorkspaceHref } from "@/lib/workspace-url";

export default async function StudentProfileRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const { id } = await params;
  redirect(getWorkspaceHref(`/members/${id}`, cookieStore.get(authCookieNames.activeClub)?.value));
}
