"use client";

import { useState } from "react";
import { LayoutGrid, Lock, Unlock } from "lucide-react";
import { SectionHeader } from "@/components/oss/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const widgets = [
  { id: "attendance", label: "Attendance chart", span: "xl:col-span-2" },
  { id: "schedule", label: "Today schedule", span: "xl:col-span-1" },
  { id: "attention", label: "Needs attention", span: "xl:col-span-1" },
  { id: "belts", label: "Belt distribution", span: "xl:col-span-1" },
  { id: "promotions", label: "Recent promotions", span: "xl:col-span-1" },
  { id: "competitions", label: "Upcoming competitions", span: "xl:col-span-1" },
  { id: "feed", label: "Training activity", span: "xl:col-span-2" },
  { id: "trials", label: "Trial students", span: "xl:col-span-1" },
];

export function WidgetGridPreview() {
  const [editable, setEditable] = useState(false);

  return (
    <section className="space-y-4">
      <SectionHeader
        kicker="Layout"
        title="Configurable widgets"
        description="Drag-and-drop dashboard layout — prototype preview. Full react-grid-layout integration ready for backend phase."
        action={
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setEditable((v) => !v)}
          >
            {editable ? <Unlock size={14} /> : <Lock size={14} />}
            {editable ? "Lock layout" : "Customize layout"}
          </Button>
        }
      />

      <div
        className={cn(
          "grid gap-3 rounded-[14px border border-dashed p-4 transition md:grid-cols-2 xl:grid-cols-3",
          editable ? "border-[var(--accent)]/40 bg-[var(--accent)]/5" : "border-[var(--border)]",
        )}
      >
        {widgets.map((w) => (
          <Card
            key={w.id}
            className={cn(
              "flex min-h-[88px] items-center justify-between p-4",
              w.span,
              editable && "cursor-grab ring-1 ring-[var(--accent)]/20 active:cursor-grabbing",
            )}
          >
            <div className="flex items-center gap-2">
              <LayoutGrid size={16} className="text-[var(--muted)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">{w.label}</span>
            </div>
            {editable && <Badge variant="muted">Drag</Badge>}
          </Card>
        ))}
      </div>
      {editable && (
        <p className="text-center text-xs text-[var(--muted)]">
          Layout editing is visual-only in this demo — widgets map to sections below.
        </p>
      )}
    </section>
  );
}
