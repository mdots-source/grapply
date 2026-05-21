"use client";

import { cn } from "@/lib/utils";

export function DropdownMenu({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative inline-block", className)} {...props} />;
}

export function DropdownMenuTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)]", className)} {...props} />;
}

export function DropdownMenuContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("absolute right-0 top-full z-50 mt-2 min-w-44 rounded-lg border border-[var(--border)] bg-[#101116] p-1 shadow-2xl", className)} {...props} />;
}

export function DropdownMenuItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-md px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]", className)} {...props} />;
}
