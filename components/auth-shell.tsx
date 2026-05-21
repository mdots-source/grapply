import { Shield } from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { students } from "@/data/academy";

export function AuthShell({ children, mode }: { children: React.ReactNode; mode: "login" | "register" }) {
  const featured = students.filter((student) => student.avatar).slice(0, 4);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 text-[var(--foreground)]">
      <div className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden lg:block">
          <Badge variant="accent">OSS OS access</Badge>
          <h1 className="mt-6 max-w-xl text-6xl font-black leading-[0.94]">
            {mode === "login" ? "Run the room before the doors open." : "Launch an academy OS with a premium first impression."}
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-[var(--muted)]">
            A cinematic operating layer for classes, athletes, rankings, promotions, and wall-screen energy.
          </p>
          <Card className="mt-8 max-w-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex -space-x-3">
                {featured.map((student) => (
                  <StudentAvatar key={student.id} student={student} size="lg" className="ring-4 ring-[var(--background)]" priority />
                ))}
              </div>
              <div className="text-right">
                <p className="text-3xl font-semibold text-[var(--accent)]">247</p>
                <p className="text-xs text-[var(--muted)]">members in sync</p>
              </div>
            </div>
          </Card>
        </section>
        <section className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="grid size-11 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
              <Shield size={22} />
            </div>
            <div>
              <p className="font-black tracking-[0.22em]">OSS OS</p>
              <p className="text-xs text-[var(--muted)]">Academy operations</p>
            </div>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
