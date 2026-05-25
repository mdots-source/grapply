"use client";

import { motion } from "framer-motion";
import { Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PromotionCard({
  student,
  detail,
  awardedBy,
  when,
  type = "stripe",
  className,
}: {
  student: string;
  detail: string;
  awardedBy: string;
  when: string;
  type?: "stripe" | "belt" | "ranking" | "achievement";
  className?: string;
}) {
  const typeLabel = { stripe: "Stripe", belt: "Belt", ranking: "Ranking", achievement: "Achievement" }[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "rounded-xl border border-violet-400/20 bg-gradient-to-r from-violet-500/12 via-transparent to-transparent p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge className="gap-1 border-violet-400/25 bg-violet-400/10 text-violet-200">
          <Award size={12} />
          {typeLabel}
        </Badge>
        <span className="text-xs text-[var(--muted)]">{when}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
        <strong>{student}</strong> — {detail}
      </p>
      <p className="mt-2 text-xs text-[var(--muted)]">Awarded by {awardedBy}</p>
    </motion.div>
  );
}
