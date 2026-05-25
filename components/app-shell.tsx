"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  Flame,
  Medal,
  MonitorPlay,
  Mountain,
  Radio,
  Settings,
  Shield,
  LogOut,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenuButton } from "@/components/ui/sidebar";
import { students } from "@/data/academy";
import { academyMeta } from "@/data/academy-meta";
import { getNavBeltAccent } from "@/lib/nav-belt";
import { cn } from "@/lib/utils";

const profileMember = students.find((member) => member.id === "st-003") ?? students[0];
const profileHref = `/members/${profileMember.id}`;

type Role = "owner" | "admin" | "coach" | "member";

const nav = [
  { href: "/", label: "Dashboard", icon: BarChart3, roles: ["owner", "admin", "coach"] as Role[] },
  { href: "/members", label: "Members", icon: Users, roles: ["owner", "admin", "coach"] as Role[] },
  { href: "/schedule", label: "Schedule", icon: CalendarDays, roles: ["owner", "admin", "coach", "member"] as Role[] },
  { href: "/competitions", label: "Competitions", icon: Medal, roles: ["owner", "admin", "coach", "member"] as Role[] },
  { href: "/training-camps", label: "Training Camps", icon: Mountain, roles: ["owner", "admin", "coach", "member"] as Role[] },
  { href: "/training-feed", label: "Training Feed", icon: Flame, roles: ["owner", "admin", "coach", "member"] as Role[] },
  { href: "/rankings", label: "Rankings", icon: Trophy, roles: ["owner", "admin", "coach", "member"] as Role[] },
  { href: "/tv", label: "TV Screen", icon: MonitorPlay, roles: ["owner", "admin", "coach"] as Role[] },
  { href: "/admin", label: "Admin", icon: UserCog, roles: ["owner", "admin"] as Role[] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["owner", "admin"] as Role[] },
];

export function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const pathname = usePathname();
  const [session, setSession] = useState<{
    user?: { name: string; email: string };
    activeClub?: { name: string; slug: string };
    activeRole?: Role;
  } | null>(null);
  const role = session?.activeRole ?? "owner";
  const visibleNav = useMemo(() => nav.filter((item) => item.roles.includes(role)), [role]);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then(setSession)
      .catch(() => setSession(null));
  }, []);
  const activeNavStyle = (belt: ReturnType<typeof getNavBeltAccent>) =>
    ({
      "--nav-active-bg": belt.bg,
      "--nav-active-text": belt.text,
      "--nav-active-ring": belt.ring,
      "--nav-active-bg-dark": belt.darkBg ?? belt.bg,
      "--nav-active-text-dark": belt.darkText ?? belt.text,
      "--nav-active-ring-dark": belt.darkRing ?? belt.ring,
    }) as React.CSSProperties;

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <Sidebar>
        <SidebarHeader>
        <Link href="/" className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition hover:border-[var(--accent)]/25 hover:bg-[var(--surface-hover)]">
          <div className="grid size-10 place-items-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)]">
            <Shield size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-black tracking-[0.18em] text-[var(--foreground)]">Grapply</div>
            <div className="truncate text-xs text-[var(--muted)]">{session?.activeClub?.name ?? academyMeta.name}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              Academy online
            </div>
          </div>
        </Link>
        </SidebarHeader>

        <SidebarContent>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const belt = getNavBeltAccent(item.href);
            return (
              <SidebarMenuButton
                key={item.href}
                href={item.href}
                active={active}
                style={active ? activeNavStyle(belt) : undefined}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="active-nav"
                    className="absolute inset-y-2 left-0 w-1 rounded-r-full"
                    style={{ backgroundColor: belt.bar }}
                  />
                )}
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-md border border-transparent transition",
                    active && "border-[color-mix(in_srgb,currentColor_25%,transparent)]",
                  )}
                  style={active ? { backgroundColor: belt.bar, color: belt.belt === "white" ? "#09090b" : "#fff" } : undefined}
                  aria-hidden
                >
                  <Icon size={14} className={active ? "" : "opacity-80"} />
                </span>
                {item.label}
              </SidebarMenuButton>
            );
          })}
        </SidebarContent>

        <SidebarFooter className="space-y-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/6 p-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              <Radio size={12} />
              Live now
            </div>
            <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{academyMeta.liveClass.name}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {academyMeta.liveClass.coach} · {academyMeta.liveClass.room}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2 py-2">
              <p className="text-lg font-semibold tabular-nums text-[var(--accent)]">{academyMeta.checkedInToday}</p>
              <p className="text-[10px] text-[var(--muted)]">Checked in</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2 py-2">
              <p className="text-lg font-semibold tabular-nums">{academyMeta.academyPulse}%</p>
              <p className="text-[10px] text-[var(--muted)]">Pulse</p>
            </div>
          </div>
          <Link
            href="/clubs"
            className="block rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs text-[var(--muted)] transition hover:border-[var(--accent)]/30 hover:text-[var(--foreground)]"
          >
            Switch club · <span className="capitalize text-[var(--accent)]">{role}</span>
          </Link>
          <Link
            href="/api/auth/logout"
            className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--accent-coral)]/30 hover:text-[var(--foreground)]"
          >
            <LogOut size={14} />
            Logout
          </Link>
        </SidebarFooter>
      </Sidebar>

      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <header className="relative mb-7 border-b border-[var(--border)] pb-6">
            <Link
              href={profileHref}
              className={cn(
                "absolute right-0 top-0 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 transition hover:border-[var(--accent)]/35 hover:bg-[var(--surface-hover)]",
                pathname.startsWith(profileHref) && "border-[var(--accent)]/40 bg-[var(--accent)]/10",
              )}
            >
              <StudentAvatar student={profileMember} size="sm" />
              <span className="hidden text-right sm:block">
                <span className="block text-xs font-semibold text-[var(--foreground)]">Profile</span>
                <span className="block text-[11px] text-[var(--muted)]">{profileMember.name.split(" ")[0]}</span>
              </span>
            </Link>

            <motion.div
              className="pr-28 sm:pr-40"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                {session?.activeClub?.name ?? "Grapply Jiu-Jitsu Academy"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)] md:text-4xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{subtitle}</p>
            </motion.div>

            <div className="mt-4 flex items-center gap-2 overflow-x-auto lg:hidden">
              {visibleNav.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const belt = getNavBeltAccent(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className="whitespace-nowrap rounded-full border px-3 py-2 text-xs transition"
                    style={
                      active
                        ? {
                            borderColor: belt.ring,
                            backgroundColor: belt.bg,
                            color: belt.text,
                          }
                        : {
                            borderColor: "var(--border)",
                            backgroundColor: "var(--surface)",
                            color: "var(--muted)",
                          }
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
