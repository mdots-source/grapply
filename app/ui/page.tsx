import Link from "next/link";
import { uiLabEntries } from "@/lib/ui-lab";

export default function UiLabIndexPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Technical reference</p>
        <h1 className="mt-2 text-3xl font-semibold">UI Lab</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
          Not part of the product. Open each element on its own page — one primitive per route, isolated preview.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {uiLabEntries.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={`/ui/${entry.slug}`}
              className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]/35 hover:bg-[var(--surface-hover)]"
            >
              <span className="font-semibold text-[var(--foreground)]">{entry.title}</span>
              <span className="mt-1 block text-sm text-[var(--muted)]">{entry.description}</span>
              <span className="mt-3 block font-mono text-xs text-[var(--accent)]">/ui/{entry.slug}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
