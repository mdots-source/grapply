"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5",
        className,
      )}
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "rounded-md p-2 transition",
          theme === "light" ? "bg-[var(--accent)]/15 text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]",
        )}
        aria-pressed={theme === "light"}
        title="Light theme"
      >
        <Sun size={16} />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "rounded-md p-2 transition",
          theme === "dark" ? "bg-[var(--accent)]/15 text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]",
        )}
        aria-pressed={theme === "dark"}
        title="Dark theme"
      >
        <Moon size={16} />
      </button>
    </div>
  );
}
