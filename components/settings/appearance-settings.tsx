"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardKicker, CardTitle } from "@/components/ui/card";

export function AppearanceSettings() {
  const { theme } = useTheme();

  return (
    <Card className="oss-hover-lift">
      <CardHeader>
        <div>
          <CardTitle>Appearance</CardTitle>
          <CardKicker>Theme and interface density</CardKicker>
        </div>
        <Badge variant="accent">{theme === "dark" ? "Dark" : "Light"}</Badge>
      </CardHeader>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Theme</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Light — bright daytime UI. Dark — premium mat-side display.</p>
        </div>
        <ThemeToggle />
      </div>
      <p className="text-xs text-[var(--muted)]">Preference is saved locally in this browser.</p>
    </Card>
  );
}
