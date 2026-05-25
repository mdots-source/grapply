import { cn } from "@/lib/utils";

export function StripeIndicator({ stripes, max = 4, className }: { stripes: number; max?: number; className?: string }) {
  return (
    <div className={cn("flex gap-1", className)} aria-label={`${stripes} stripes`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-3 rounded-full border border-[var(--border)]",
            i < stripes ? "bg-[var(--accent)]" : "bg-[var(--surface)]",
          )}
        />
      ))}
    </div>
  );
}
