import Link from "next/link";
import { cn } from "@/lib/utils";

export function Sidebar({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-[var(--border)] bg-[var(--panel)] p-4 backdrop-blur-2xl lg:flex",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-6 shrink-0", className)} {...props} />;
}

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-h-0 flex-1 space-y-1 overflow-y-auto pr-1", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 shrink-0", className)} {...props} />;
}

export type NavBeltAccent = { bar: string; bg: string; text: string; ring: string };

export function SidebarMenuButton({
  className,
  active,
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  active?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]",
        active && "sidebar-menu-active",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
