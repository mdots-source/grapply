import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 text-[var(--foreground)]">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Grapply</p>
        <h1 className="mt-3 text-4xl font-semibold">404</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">This page does not exist in the academy prototype.</p>
        <Button variant="primary" className="mt-6" asChild>
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
