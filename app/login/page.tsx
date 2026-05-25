import Link from "next/link";
import Image from "next/image";
import { Shield } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { StravaConnectButton } from "@/components/strava-connect-button";
import { Card } from "@/components/ui/card";
import { platformUsers } from "@/data/platform";

export default function LoginPage() {
  return (
    <AuthShell mode="login">
      <Card className="w-full">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
            <Shield size={22} />
          </div>
          <div>
            <p className="font-black tracking-[0.22em]">Grapply</p>
            <p className="text-xs text-[var(--muted)]">Grapply · Demo</p>
          </div>
        </div>
        <h1 className="text-3xl font-semibold">Welcome back.</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Sign into the Grapply workspace, review the room, and keep athlete activity connected.
        </p>
        <StravaConnectButton href="/api/strava/connect?returnTo=/clubs" className="mt-7 w-full">
          Continue with Strava
        </StravaConnectButton>
        <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--border)]" />
          Academy login
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <LoginForm />
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Test users</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {platformUsers.map((user) => (
              <Link
                key={user.id}
                href={`/clubs?user=${user.id}`}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-left transition hover:border-[var(--accent)]/35 hover:bg-[var(--surface-hover)]"
              >
                <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[10px] font-black text-[var(--foreground)]">
                  {user.avatar ? (
                    <Image src={user.avatar} alt={`${user.name} avatar`} fill sizes="36px" className="object-cover" />
                  ) : (
                    user.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-[var(--foreground)]">{user.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-[var(--muted)]">{user.email}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-5 text-sm text-[var(--muted)]">
          New academy? <Link href="/register" className="text-[var(--accent)]">Create workspace</Link>
        </p>
      </Card>
    </AuthShell>
  );
}
