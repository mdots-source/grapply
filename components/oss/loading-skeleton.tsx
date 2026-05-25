import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-[var(--surface)] via-[var(--surface-hover)] to-[var(--surface)] bg-[length:200%_100%]",
        className,
      )}
      style={{ animation: "oss-shimmer 1.8s ease-in-out infinite" }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-[14px] p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-8 w-32" />
      <Skeleton className="mt-6 h-24 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
