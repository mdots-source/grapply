"use client";

import { Loader2, Save } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardKicker, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ThemeMode } from "@/lib/theme";

export type AppearanceSetting = {
  theme: ThemeMode;
  accent: "purple" | "blue" | "green" | "coral";
};

const accentOptions: Array<{ value: AppearanceSetting["accent"]; label: string; swatch: string }> = [
  { value: "purple", label: "Purple", swatch: "#7c3aed" },
  { value: "blue", label: "Blue", swatch: "#0284c7" },
  { value: "green", label: "Green", swatch: "#16a34a" },
  { value: "coral", label: "Coral", swatch: "#e11d48" },
];

export function AppearanceSettings({
  value,
  dirty = false,
  saving = false,
  canSaveWorkspace = true,
  onChange,
  onSave,
}: {
  value: AppearanceSetting;
  dirty?: boolean;
  saving?: boolean;
  canSaveWorkspace?: boolean;
  onChange?: (value: AppearanceSetting) => void;
  onSave?: () => void;
}) {
  const { theme, setTheme } = useTheme();

  const setWorkspaceTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    onChange?.({ ...value, theme: nextTheme });
  };

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
          <p className="mt-1 text-xs text-[var(--muted)]">Light for bright rooms. Dark for TV and front-desk use.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle />
          <Button type="button" variant="surface" size="sm" onClick={() => setWorkspaceTheme(theme)}>
            Use current
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label>Club default theme</Label>
            <p className="mt-1 text-xs text-[var(--muted)]">Saved to this academy workspace for new sessions.</p>
          </div>
          <Tabs>
            <TabsList>
              {(["dark", "light"] as const).map((item) => (
                <TabsTrigger
                  key={item}
                  active={value.theme === item}
                  onClick={() => setWorkspaceTheme(item)}
                >
                  {item === "dark" ? "Dark" : "Light"}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent />
          </Tabs>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <Label>Accent</Label>
        <div className="mt-3 flex flex-wrap gap-2">
          {accentOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={value.accent === option.value}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]/30"
              style={{ boxShadow: value.accent === option.value ? "0 0 0 2px var(--accent)" : undefined }}
              onClick={() => onChange?.({ ...value, accent: option.value })}
            >
              <span className="size-3 rounded-full" style={{ background: option.swatch }} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--muted)]">
          {canSaveWorkspace
            ? "Local theme changes apply immediately; saving stores the club default in Supabase."
            : "Local theme changes apply immediately. Club defaults are managed by owners and admins."}
        </p>
        {canSaveWorkspace && (
          <Button type="button" variant="primary" disabled={!dirty || saving} onClick={onSave}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {dirty ? "Save appearance" : "Appearance saved"}
          </Button>
        )}
      </div>
    </Card>
  );
}
