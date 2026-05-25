"use client";

import { useEffect, useState } from "react";
import "@/lib/ag-grid-setup";
import { cn } from "@/lib/utils";

/** Client-only mount wrapper — avoids AG Grid SSR/hydration mismatches. */
export function AgGridHost({
  className,
  heightClassName = "min-h-[200px] w-full",
  children,
}: {
  className: string;
  heightClassName?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={cn(className, heightClassName)}>
      {mounted ? (
        children
      ) : (
        <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-[var(--muted)]">Loading table…</div>
      )}
    </div>
  );
}
