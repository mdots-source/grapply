"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Building2, CheckCircle2, Loader2, Palette, Save, Upload, Users } from "lucide-react";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { StravaConnectButton } from "@/components/strava-connect-button";
import { useActiveClub } from "@/components/use-active-club";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardKicker, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabKeys = ["brand", "appearance", "coaches", "integrations", "tv"] as const;
type SaveMessage = { tone: "success" | "error"; text: string };

export function SettingsTabs() {
  const activeClub = useActiveClub();
  const [tab, setTab] = useState<(typeof tabKeys)[number]>("appearance");
  const [brand, setBrand] = useState({
    academyName: activeClub?.name ?? "Grapply Jiu-Jitsu Academy",
    location: "San Diego, CA",
    mats: "Mat A, Mat B, Main Mat",
    color: "#7c3aed",
  });
  const [savedBrand, setSavedBrand] = useState(brand);
  const [tvSettings, setTvSettings] = useState({
    showActiveAthletes: true,
    liveCheckInQr: true,
    rotatingAthleteCards: true,
    liveActivityTicker: true,
  });
  const [savedTvSettings, setSavedTvSettings] = useState(tvSettings);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<SaveMessage | null>(null);

  const brandDirty = JSON.stringify(brand) !== JSON.stringify(savedBrand);
  const tvDirty = JSON.stringify(tvSettings) !== JSON.stringify(savedTvSettings);
  const hasPendingChanges = brandDirty || tvDirty;

  useEffect(() => {
    if (!activeClub?.name) return;
    setBrand((current) => ({ ...current, academyName: activeClub.name }));
    setSavedBrand((current) => ({ ...current, academyName: activeClub.name }));
  }, [activeClub?.name]);

  const saveSetting = async (key: string, value: unknown) => {
    setSaving(key);
    setMessage(null);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, ...(activeClub?.slug ? { clubSlug: activeClub.slug } : {}) }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string; source?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Settings save failed.");
      if (key === "brand") setSavedBrand(brand);
      if (key === "tv") setSavedTvSettings(tvSettings);
      setMessage({ tone: "success", text: `Saved ${key} settings for ${activeClub?.name ?? "this academy"}.` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Settings save failed." });
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <div className="mb-5 rounded-[14px] border border-[var(--border)] bg-[var(--panel)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{activeClub?.name ?? "Academy settings"}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Changes apply to the selected academy workspace. Appearance changes stay on this device.
              </p>
            </div>
          </div>
          <Badge variant={hasPendingChanges ? "accent" : "success"}>
            {hasPendingChanges ? "Unsaved changes" : "Saved"}
          </Badge>
        </div>
      </div>

      <Tabs className="mb-5">
        <TabsList>
          {(
            [
              ["brand", "Brand"],
              ["appearance", "Appearance"],
              ["coaches", "Coaches"],
              ["integrations", "Integrations"],
              ["tv", "TV Mode"],
            ] as const
          ).map(([key, label]) => (
            <TabsTrigger key={key} active={tab === key} onClick={() => setTab(key)}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent />
      </Tabs>

      {tab === "appearance" && (
        <div className="max-w-xl">
          <AppearanceSettings />
        </div>
      )}

      {tab === "brand" && (
        <Card className="max-w-xl oss-hover-lift">
          <CardHeader>
            <div>
              <CardTitle>Academy Brand</CardTitle>
              <CardKicker>Logo, name, and primary color</CardKicker>
            </div>
            <Palette size={18} className="text-[var(--accent)]" />
          </CardHeader>
          <div className="grid size-24 place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--muted)]">
            Logo
          </div>
          <div className="mt-5 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="academy-name">Academy name</Label>
              <Input id="academy-name" value={brand.academyName} onChange={(event) => setBrand((current) => ({ ...current, academyName: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academy-city">Location</Label>
              <Input id="academy-city" value={brand.location} onChange={(event) => setBrand((current) => ({ ...current, location: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mats">Mats</Label>
              <Input id="mats" value={brand.mats} onChange={(event) => setBrand((current) => ({ ...current, mats: event.target.value }))} />
            </div>
            <div className="flex gap-2">
              {["#7c3aed", "#0284c7", "#16a34a", "#e11d48"].map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Use brand color ${color}`}
                  className="size-9 rounded-lg border border-[var(--border)] ring-offset-2 ring-offset-[var(--background)] transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ background: color, boxShadow: brand.color === color ? "0 0 0 2px var(--accent)" : undefined }}
                  onClick={() => setBrand((current) => ({ ...current, color }))}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="surface" type="button">
                <Upload size={16} /> Upload logo
              </Button>
              <Button variant="primary" type="button" onClick={() => saveSetting("brand", brand)} disabled={saving === "brand" || !brandDirty}>
                {saving === "brand" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {brandDirty ? "Save brand" : "Brand saved"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {tab === "coaches" && (
        <Card className="max-w-xl oss-hover-lift">
          <CardHeader>
            <div>
              <CardTitle>Coaches</CardTitle>
              <CardKicker>Teaching team and mat leadership</CardKicker>
            </div>
            <Users size={18} className="text-[var(--accent)]" />
          </CardHeader>
          {["Sofia Almeida", "Lina Okafor", "Noah Keller"].map((coach) => (
            <div key={coach} className="mb-3 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <span className="text-sm font-semibold text-[var(--foreground)]">{coach}</span>
              <Badge variant="accent">Coach</Badge>
            </div>
          ))}
        </Card>
      )}

      {tab === "integrations" && (
        <Card className="max-w-2xl oss-hover-lift">
          <CardHeader>
            <div>
              <CardTitle>Integrations</CardTitle>
              <CardKicker>Training data and connected services</CardKicker>
            </div>
            <Activity size={18} className="text-[var(--accent)]" />
          </CardHeader>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Strava</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Connect athlete activity so coaches can see training volume beside mat attendance.
                </p>
              </div>
              <StravaConnectButton href="/api/strava/connect?returnTo=/settings" />
            </div>
          </div>
        </Card>
      )}

      {tab === "tv" && (
        <Card className="max-w-3xl oss-hover-lift">
          <CardHeader>
            <div>
              <CardTitle>TV Mode</CardTitle>
              <CardKicker>Fullscreen academy display controls</CardKicker>
            </div>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["showActiveAthletes", "Show active athletes"],
                ["liveCheckInQr", "Live check-in QR"],
                ["rotatingAthleteCards", "Rotating athlete cards"],
                ["liveActivityTicker", "Live activity ticker"],
              ] as const
            ).map(([key, setting]) => (
              <Label key={key} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <span className="text-[var(--foreground)]">{setting}</span>
                <Switch checked={tvSettings[key]} onChange={(event) => setTvSettings((current) => ({ ...current, [key]: event.target.checked }))} />
              </Label>
            ))}
          </div>
          <Button className="mt-4" variant="primary" type="button" onClick={() => saveSetting("tv", tvSettings)} disabled={saving === "tv" || !tvDirty}>
            {saving === "tv" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {tvDirty ? "Save TV settings" : "TV settings saved"}
          </Button>
        </Card>
      )}

      {message && (
        <div
          className={
            message.tone === "success"
              ? "mt-4 flex max-w-xl items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-300"
              : "mt-4 flex max-w-xl items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-700 dark:text-rose-300"
          }
        >
          {message.tone === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span>{message.text}</span>
        </div>
      )}
    </>
  );
}
