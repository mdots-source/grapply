"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { uiLabEntries } from "@/lib/ui-lab";
import { cn } from "@/lib/utils";

export function UiLabShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const isIndex = pathname === "/ui";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--panel)]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              <ArrowLeft size={14} />
              Product
            </Link>
            <span className="text-[var(--border)]">|</span>
            <Link href="/ui" className="text-sm font-semibold tracking-wide text-[var(--foreground)]">
              UI Lab
            </Link>
            <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              dev only
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={cn(
                "rounded-lg border p-2 transition",
                theme === "dark" ? "border-[var(--accent)]/40 bg-[var(--accent)]/10" : "border-[var(--border)]",
              )}
              aria-label="Dark theme"
            >
              <Moon size={16} />
            </button>
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={cn(
                "rounded-lg border p-2 transition",
                theme === "light" ? "border-[var(--accent)]/40 bg-[var(--accent)]/10" : "border-[var(--border)]",
              )}
              aria-label="Light theme"
            >
              <Sun size={16} />
            </button>
          </div>
        </div>
        {!isIndex ? (
          <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto border-t border-[var(--border)] px-4 py-2 sm:px-6">
            {uiLabEntries.map((entry) => {
              const href = `/ui/${entry.slug}`;
              const active = pathname === href;
              return (
                <Link
                  key={entry.slug}
                  href={href}
                  className={cn(
                    "whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition",
                    active
                      ? "bg-[var(--accent)]/15 text-[var(--foreground)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]",
                  )}
                >
                  {entry.title}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
