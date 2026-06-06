"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getWorkspaceHref } from "@/lib/workspace-url";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [scheduleHref, setScheduleHref] = useState("/schedule");

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    let alive = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { activeClub?: { slug?: string } | null } | null) => {
        if (alive) setScheduleHref(getWorkspaceHref("/schedule", payload?.activeClub?.slug));
      })
      .catch(() => {
        if (alive) setScheduleHref("/schedule");
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 text-[var(--foreground)]">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Grapply</p>
        <h1 className="mt-3 text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">An unexpected error occurred. Try again or return to the workspace.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
          <Button variant="surface" asChild>
            <Link href={scheduleHref}>Back to schedule</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
