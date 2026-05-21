import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]",
        accent: "border-[var(--accent)]/30 bg-[var(--accent)]/12 text-[var(--accent)]",
        success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
        muted: "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { badgeVariants };
