"use client";

import { cn } from "@/lib/utils";

export function Sheet({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-[var(--border)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow)] backdrop-blur-2xl", className)} {...props} />;
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-6 space-y-1.5", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold text-[var(--foreground)]", className)} {...props} />;
}

export function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-[var(--muted)]", className)} {...props} />;
}
