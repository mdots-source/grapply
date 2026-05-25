"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LiveTicker({ items, intervalMs = 5000 }: { items: string[]; intervalMs?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), intervalMs);
    return () => clearInterval(id);
  }, [items.length, intervalMs]);

  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2 shadow-[var(--shadow)] backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Live</span>
        <div className="relative min-h-[1.25rem] flex-1">
          <AnimatePresence mode="wait">
            <motion.p
              key={items[index]}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="truncate text-sm text-[var(--foreground)]"
            >
              {items[index]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
