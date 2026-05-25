"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { academyMeta } from "@/data/academy-meta";
import { students } from "@/data/academy";

export function AuthShell({ children, mode }: { children: React.ReactNode; mode: "login" | "register" }) {
  const featured = students.filter((student) => student.avatar).slice(0, 4);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 text-[var(--foreground)]">
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(167,139,250,0.16),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.1),transparent_35%)]"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden lg:block">
          <Badge variant="accent">Grapply · {academyMeta.shortName}</Badge>
          <h1 className="mt-6 max-w-xl text-6xl font-black leading-[0.94]">
            {mode === "login" ? "Run the room before the doors open." : "Launch an academy OS with a premium first impression."}
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-[var(--muted)]">
            {academyMeta.tagline}. San Diego competition culture — classes, athletes, rankings, and wall-screen energy in one layer.
          </p>
          <Card className="mt-8 max-w-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex -space-x-3">
                {featured.map((student) => (
                  <StudentAvatar key={student.id} student={student} size="lg" className="ring-4 ring-[var(--background)]" priority />
                ))}
              </div>
              <div className="text-right">
                <p className="text-3xl font-semibold tabular-nums text-[var(--accent)]">{academyMeta.memberCount}</p>
                <p className="text-xs text-[var(--muted)]">members in sync</p>
              </div>
            </div>
          </Card>
          <p className="mt-6 text-xs text-[var(--muted)]">
            <Link href="/" className="text-[var(--accent)] hover:underline">
              View demo dashboard →
            </Link>
          </p>
        </section>
        <motion.section
          className="mx-auto w-full max-w-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="grid size-11 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
              <Shield size={22} />
            </div>
            <div>
              <p className="font-black tracking-[0.22em]">Grapply</p>
              <p className="text-xs text-[var(--muted)]">{academyMeta.location}</p>
            </div>
          </div>
          {children}
        </motion.section>
      </div>
    </main>
  );
}
