import { cn } from "@/lib/utils";

export function SectionHeader({
  kicker,
  title,
  description,
  action,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-1">
        {kicker && (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{kicker}</p>
        )}
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] md:text-[1.65rem]">{title}</h2>
        {description && <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
