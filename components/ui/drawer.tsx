"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
};

export function Drawer({ open, onOpenChange, children, className }: DrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--background)_55%,transparent)] backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />
      <Sheet
        role="dialog"
        aria-modal="true"
        className={cn("relative z-10 flex h-full flex-col overflow-y-auto", className)}
      >
        {children}
      </Sheet>
    </div>
  );
}

export function DrawerHeader({
  className,
  onClose,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-[var(--border)] pb-5", className)} {...props}>
      <SheetHeader className="mb-0 flex-1">{children}</SheetHeader>
      {onClose && (
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X size={18} />
        </Button>
      )}
    </div>
  );
}

export { SheetTitle as DrawerTitle, SheetDescription as DrawerDescription };
