import { beltStyles, type Belt } from "@/data/academy";
import { cn } from "@/lib/utils";

export function formatBeltRank(belt: Belt, stripes = 0) {
  const stripeCount = Math.max(0, Math.min(4, stripes));
  return `${beltStyles[belt].label} Belt — ${stripeCount} ${stripeCount === 1 ? "stripe" : "stripes"}`;
}

export function BeltPill({ belt, stripes = 0, className }: { belt: Belt; stripes?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold", beltStyles[belt].className, className)} aria-label={formatBeltRank(belt, stripes)}>
      {beltStyles[belt].label}
      <span className="flex gap-0.5">
        {Array.from({ length: Math.max(stripes, 0) }).map((_, index) => (
          <span key={index} aria-hidden className="h-2.5 w-0.5 rounded-full bg-current opacity-70" />
        ))}
      </span>
    </span>
  );
}
