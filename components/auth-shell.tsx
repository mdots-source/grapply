"use client";

import { motion } from "framer-motion";
import { BrandLogo } from "@/components/brand-logo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-8 text-[var(--foreground)]">
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(167,139,250,0.14),transparent_42%)]"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative mx-auto w-full max-w-md">
        <motion.section
          className="w-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="mb-5 flex items-center gap-3">
            <BrandLogo className="size-11 rounded-xl border border-[var(--border)] shadow-[var(--glow-accent)]" priority />
            <div>
              <p className="font-black tracking-[0.22em]">Grapply</p>
            </div>
          </div>
          {children}
        </motion.section>
      </div>
    </main>
  );
}
