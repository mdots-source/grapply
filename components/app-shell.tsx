"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  Flame,
  Medal,
  MonitorPlay,
  Mountain,
  Settings,
  Shield,
  LogOut,
  Building2,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenuButton } from "@/components/ui/sidebar";
import { ActiveClubProvider } from "@/components/use-active-club";
import { academyMeta } from "@/data/academy-meta";
import { getNavBeltAccent } from "@/lib/nav-belt";
import { cn, initials } from "@/lib/utils";

type Role = "owner" | "admin" | "coach" | "member";
const managerRoles: Role[] = ["owner", "admin", "coach"];

export type ShellSession = {
  user?: { name: string; email: string; avatar?: string };
  activeClub?: { name: string; slug: string } | null;
  activeRole?: Role | null;
  memberships?: Array<{ club: { name: string; slug: string }; role: Role }>;
};

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3, roles: managerRoles },
  { href: "/members", label: "Members", icon: Users, roles: managerRoles },
  { href: "/schedule", label: "Schedule", icon: CalendarDays, roles: managerRoles },
  { href: "/competitions", label: "Competitions", icon: Medal, roles: managerRoles },
  { href: "/training-camps", label: "Training Camps", icon: Mountain, roles: managerRoles },
  { href: "/training-feed", label: "Training Feed", icon: Flame, roles: managerRoles },
  { href: "/rankings", label: "Rankings", icon: Trophy, roles: managerRoles },
  { href: "/tv", label: "TV Screen", icon: MonitorPlay, roles: managerRoles },
  { href: "/admin", label: "Team", icon: UserCog, roles: ["owner", "admin"] as Role[] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["owner", "admin"] as Role[] },
];

function getWorkspaceHref(href: string, organizationId?: string | null) {
  return organizationId ? `/${organizationId}${href}` : href;
}

function getWorkspacePath(pathname: string, organizationId?: string | null) {
  if (!organizationId) return pathname;
  const prefix = `/${organizationId}`;
  if (pathname === prefix) return "/";
  return pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) || "/" : pathname;
}

export function AppShell({
  children,
  title,
  subtitle,
  mode = "workspace",
  initialSession = null,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  mode?: "workspace" | "account";
  initialSession?: ShellSession | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAccountMode = mode === "account";
  const [session, setSession] = useState<ShellSession | null | undefined>(initialSession);
  const role = session?.activeRole;
  const organizationId = session?.activeClub?.slug;
  const workspacePath = getWorkspacePath(pathname, organizationId);
  const displayRole = role === "coach" ? "trainer" : role ?? "member";
  const visibleNav = useMemo(
    () => (isAccountMode ? [] : nav.filter((item) => (role ? item.roles.includes(role) : workspacePath.startsWith(item.href)))),
    [isAccountMode, role, workspacePath],
  );
  const currentPath = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;
  const switchReturnTo = pathname.startsWith("/clubs") ? searchParams.get("returnTo") ?? "/schedule" : currentPath;
  const switchClubHref = `/clubs?returnTo=${encodeURIComponent(switchReturnTo)}`;
  const workspaceHomeHref = getWorkspaceHref("/dashboard", organizationId);
  const shellHomeHref = isAccountMode ? "/clubs" : workspaceHomeHref;
  const profileLabel = session?.user?.name ?? "Profile";
  const profileDetail = session?.user?.email ?? "Account";

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
    <ActiveClubProvider activeClub={session?.activeClub ?? null}>
      <div className="min-h-screen text-[var(--foreground)]">
      <Sidebar>
        <SidebarHeader>
          <Link href={shellHomeHref} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition hover:border-[var(--accent)]/25 hover:bg-[var(--surface-hover)]">
            <div className="grid size-10 place-items-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)]">
              <Shield size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black tracking-[0.18em] text-[var(--foreground)]">Grapply</div>
              <div className="truncate text-xs text-[var(--muted)]">{session?.activeClub?.name ?? academyMeta.name}</div>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          {isAccountMode ? (
            <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="grid size-10 place-items-center rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]">
                <Building2 size={20} />
              </div>
              <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">Choose academy</p>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                Pick the workspace you want to open. Navigation appears after the academy is selected.
              </p>
            </div>
          ) : visibleNav.map((item) => {
            const Icon = item.icon;
            const active = workspacePath.startsWith(item.href);
            const belt = getNavBeltAccent(item.href);
            const href = getWorkspaceHref(item.href, organizationId);
            return (
              <SidebarMenuButton
                key={item.href}
                href={href}
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
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
            <div className="flex items-start gap-2">
              <Building2 size={15} className="mt-0.5 shrink-0 text-[var(--accent)]" />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[var(--foreground)]">
                  {isAccountMode ? session?.user?.name ?? "Account" : session?.activeClub?.name ?? "Choose club"}
                </p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  {isAccountMode ? (
                    session?.user?.email ?? "Choose a workspace"
                  ) : (
                    <>
                      <span className="capitalize text-[var(--accent)]">{displayRole}</span>
                      {session?.memberships?.length ? ` · ${session.memberships.length} workspace${session.memberships.length === 1 ? "" : "s"}` : ""}
                    </>
                  )}
                </p>
              </div>
            </div>
            {!isAccountMode && (
              <Link
                href={switchClubHref}
                className="mt-3 block rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-center text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--accent)]/30 hover:text-[var(--foreground)]"
              >
                Switch club
              </Link>
            )}
          </div>
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
              href="/clubs"
              className={cn(
                "absolute right-0 top-0 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 transition hover:border-[var(--accent)]/35 hover:bg-[var(--surface-hover)]",
                pathname.startsWith("/clubs") && "border-[var(--accent)]/40 bg-[var(--accent)]/10",
              )}
            >
              <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] text-xs font-black text-[var(--foreground)]">
                {session?.user?.avatar ? (
                  <Image src={session.user.avatar} alt={`${profileLabel} avatar`} fill sizes="36px" className="object-cover" />
                ) : (
                  initials(profileLabel)
                )}
              </span>
              <span className="hidden text-right sm:block">
                <span className="block max-w-32 truncate text-xs font-semibold text-[var(--foreground)]">{profileLabel}</span>
                <span className="block max-w-32 truncate text-[11px] text-[var(--muted)]">{profileDetail}</span>
              </span>
            </Link>

            <motion.div
              className="pr-28 sm:pr-40"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                {isAccountMode ? "Account portal" : session?.activeClub?.name ?? "Grapply Jiu-Jitsu Academy"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)] md:text-4xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{subtitle}</p>
              {!isAccountMode && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant="accent" className="capitalize">{displayRole}</Badge>
                  <Link
                    href={switchClubHref}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--accent)]/30 hover:text-[var(--foreground)]"
                  >
                    Switch club
                  </Link>
                </div>
              )}
            </motion.div>

            {!isAccountMode && <div className="mt-4 flex items-center gap-2 overflow-x-auto lg:hidden">
              {visibleNav.map((item) => {
                const active = workspacePath.startsWith(item.href);
                const belt = getNavBeltAccent(item.href);
                const href = getWorkspaceHref(item.href, organizationId);
                return (
                  <Link
                    key={item.href}
                    href={href}
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
            </div>}
          </header>
          {children}
        </div>
      </main>
      </div>
    </ActiveClubProvider>
  );
}
