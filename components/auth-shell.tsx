"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { academyMeta } from "@/data/academy-meta";

export function AuthShell({ children, mode }: { children: React.ReactNode; mode: "login" | "register" }) {
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
            <div className="grid size-11 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
              <Shield size={22} />
            </div>
            <div>
              <p className="font-black tracking-[0.22em]">Grapply</p>
              <p className="text-xs text-[var(--muted)]">{mode === "login" ? "Academy login" : "Account registration"} · {academyMeta.shortName}</p>
            </div>
          </div>
          {children}
        </motion.section>
      </div>
    </main>
  );
}
