import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function Command({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]", className)} {...props} />;
}

export function CommandInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex items-center gap-3 px-3">
      <Search size={16} className="text-[var(--muted)]" />
      <input
        className={cn("h-10 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]", className)}
        {...props}
      />
    </div>
  );
}
