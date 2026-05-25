"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickAction = {
  href: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  accent?: "accent" | "blue" | "coral";
};

const accentMap = {
  accent: "border-[var(--accent)]/30 bg-[var(--accent)]/8 text-[var(--accent)] hover:bg-[var(--accent)]/14",
  blue: "border-sky-400/25 bg-sky-400/8 text-[var(--accent-blue)] hover:bg-sky-400/14",
  coral: "border-rose-400/25 bg-rose-400/8 text-[var(--accent-coral)] hover:bg-rose-400/14",
};

export function QuickActions({ actions, className }: { actions: QuickAction[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        const accent = action.accent ?? "accent";
        return (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.04 }}
          >
            <Link
              href={action.href}
              className={cn(
                "group inline-flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition",
                accentMap[accent],
              )}
            >
              <Icon size={16} className="shrink-0 opacity-90 transition group-hover:scale-105" />
              <span className="text-[var(--foreground)]">{action.label}</span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
