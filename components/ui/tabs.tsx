"use client";

import { cn } from "@/lib/utils";

export function Tabs({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-4", className)} {...props} />;
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="tablist" className={cn("inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1", className)} {...props} />;
}

export function TabsTrigger({
  className,
  active,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active ?? false}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]",
        active && "bg-[var(--surface-hover)] text-[var(--foreground)] shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="tabpanel" className={cn("outline-none", className)} {...props} />;
}
