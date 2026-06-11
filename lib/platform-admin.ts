import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";

export type PlatformAdminRole = "platform_owner" | "platform_admin" | "support";

const defaultPlatformAdminEmails = ["sofia@grapply.app"];

export function isPlatformAdminPath(pathname: string) {
  return pathname === "/platform-admin" || pathname.startsWith("/platform-admin/");
}

export function getPlatformAdminRole(email?: string | null): PlatformAdminRole | null {
  if (!email) return null;

  const configuredEmails = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const adminEmails = configuredEmails.length > 0 ? configuredEmails : defaultPlatformAdminEmails;

  return adminEmails.includes(email.toLowerCase()) ? "platform_owner" : null;
}

export async function requirePlatformAdmin() {
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/api/auth/refresh?returnTo=${encodeURIComponent("/platform-admin/dashboard")}`);
  }

  const platformRole = getPlatformAdminRole(session.user.email);
  if (!platformRole) {
    redirect(`/clubs?access=denied&returnTo=${encodeURIComponent("/schedule")}`);
  }

  return {
    ...session,
    platformRole,
  };
}
