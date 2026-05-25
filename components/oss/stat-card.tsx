"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const toneStyles = {
  accent: "text-[var(--accent)] bg-[var(--accent)]/12 border-[var(--accent)]/25",
  blue: "text-[var(--accent-blue)] bg-sky-400/10 border-sky-400/20",
  coral: "text-[var(--accent-coral)] bg-rose-400/10 border-rose-400/20",
  live: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  default: "text-[var(--muted)] bg-[var(--surface)] border-[var(--border)]",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  tone = "default",
  index = 0,
  live,
  className,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  trend?: string;
  tone?: keyof typeof toneStyles;
  index?: number;
  live?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Card className={cn("relative overflow-hidden p-4", className)}>
        <div className="flex items-start justify-between gap-3">
          <div className={cn("grid size-10 place-items-center rounded-xl border", toneStyles[tone])}>
            <Icon size={18} />
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            {trend && (
              <Badge variant="muted" className="max-w-[8.5rem] truncate text-[10px]">
                {trend}
              </Badge>
            )}
            {live && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                </span>
                Live
              </span>
            )}
          </div>
        </div>
        <p className="mt-4 text-2xl font-semibold tabular-nums text-[var(--foreground)]">{value}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{label}</p>
      </Card>
    </motion.div>
  );
}
