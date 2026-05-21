"use client";

import { cn } from "@/lib/utils";

export function Switch({ className, checked = true, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      defaultChecked={checked}
      className={cn(
        "relative h-5 w-9 cursor-pointer appearance-none rounded-full border border-[var(--border)] bg-[var(--surface)] transition checked:bg-[var(--accent)] before:absolute before:left-0.5 before:top-0.5 before:size-4 before:rounded-full before:bg-[var(--foreground)] before:transition checked:before:translate-x-4 checked:before:bg-[var(--accent-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40",
        className,
      )}
      {...props}
    />
  );
}
