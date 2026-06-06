import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { authCookieNames } from "@/lib/auth-cookies";
import { getWorkspaceHref } from "@/lib/workspace-url";

export default async function NotFound() {
  const cookieStore = await cookies();
  const organizationId = cookieStore.get(authCookieNames.activeClub)?.value;

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 text-[var(--foreground)]">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Grapply</p>
        <h1 className="mt-3 text-4xl font-semibold">404</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">This page is not part of the academy workspace.</p>
        <Button variant="primary" className="mt-6" asChild>
          <Link href={getWorkspaceHref("/schedule", organizationId)}>Back to schedule</Link>
        </Button>
      </div>
    </main>
  );
}
