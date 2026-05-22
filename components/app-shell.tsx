"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Trophy,
  Users,
} from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenuButton } from "@/components/ui/sidebar";
import { students } from "@/data/academy";
import { cn } from "@/lib/utils";

const profileMember = students.find((member) => member.id === "st-003") ?? students[0];
const profileHref = `/members/${profileMember.id}`;

const nav = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/members", label: "Members", icon: Users },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/competitions", label: "Competitions", icon: Medal },
  { href: "/training-camps", label: "Training Camps", icon: Mountain },
  { href: "/training-feed", label: "Training Feed", icon: Flame },
  { href: "/rankings", label: "Rankings", icon: Trophy },
  { href: "/tv", label: "TV Screen", icon: MonitorPlay },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <Sidebar>
        <SidebarHeader>
        <Link href="/" className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition hover:bg-[var(--surface-hover)]">
          <div className="grid size-10 place-items-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)]">
            <Shield size={22} />
          </div>
          <div>
            <div className="text-sm font-black tracking-[0.22em] text-[var(--foreground)]">OSS OS</div>
            <div className="text-xs text-[var(--muted)]">Forge Jiu-Jitsu</div>
          </div>
        </Link>
        </SidebarHeader>

        <SidebarContent>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <SidebarMenuButton
                key={item.href}
                href={item.href}
                active={active}
                aria-current={active ? "page" : undefined}
              >
                {active && <motion.span layoutId="active-nav" className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[var(--accent)]" />}
                <Icon size={18} />
                {item.label}
              </SidebarMenuButton>
            );
          })}
        </SidebarContent>

        <SidebarFooter className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <Badge>Live academy pulse</Badge>
          <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">89%</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Evening classes are trending above weekly attendance baseline.</p>
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Forge Jiu-Jitsu Academy</p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)] md:text-4xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{subtitle}</p>
            </motion.div>

            <div className="mt-4 flex items-center gap-2 overflow-x-auto lg:hidden">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "page" : undefined}
                  className="whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
