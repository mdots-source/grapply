import { cn } from "@/lib/utils";

/** Isolated preview canvas for a single UI primitive or variant. */
export function Specimen({
  title,
  subtitle,
  importPath,
  className,
  canvasClassName,
  children,
}: {
  title: string;
  subtitle?: string;
  importPath?: string;
  className?: string;
  canvasClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <article className={cn("overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel-strong)]", className)}>
      <header className="border-b border-[var(--border)] px-5 py-4">
        <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
        {importPath ? (
          <p className="mt-2 font-mono text-xs text-[var(--accent)]">{importPath}</p>
        ) : null}
      </header>
      <div
        className={cn(
          "grid min-h-[140px] place-items-center bg-[var(--background)] p-8",
          canvasClassName,
        )}
      >
        {children}
      </div>
    </article>
  );
}
