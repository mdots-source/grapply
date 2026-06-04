"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ImageIcon,
  Loader2,
  MapPin,
  MonitorPlay,
  Palette,
  Save,
  Shapes,
  Upload,
  Users,
} from "lucide-react";
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

const brandColors = ["#7c3aed", "#0284c7", "#16a34a", "#e11d48", "#111827"];
const accentColors = ["#22c55e", "#38bdf8", "#f43f5e", "#a78bfa", "#f97316"];

function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function SettingsTabs() {
  const activeClub = useActiveClub();
  const [tab, setTab] = useState<(typeof tabKeys)[number]>("brand");
  const [brand, setBrand] = useState({
    academyName: activeClub?.name ?? "Grapply Jiu-Jitsu Academy",
    location: "San Diego, CA",
    description: "Premium Brazilian Jiu-Jitsu academy focused on fundamentals, competition rounds, and visible member progression.",
    logoLabel: "GJ",
    mats: "Main Mat, Mat A, Mat B",
    classTypes: "Gi, No-Gi, Fundamentals, Competition, Youth, Open Mat",
    primaryColor: "#7c3aed",
    accentColor: "#22c55e",
  });
  const [savedBrand, setSavedBrand] = useState(brand);
  const [tvSettings, setTvSettings] = useState({
    displayName: "Grapply Live Mat",
    showActiveAthletes: true,
    liveCheckInQr: true,
    rotatingAthleteCards: true,
    liveActivityTicker: true,
    showCoachAndMat: true,
  });
  const [savedTvSettings, setSavedTvSettings] = useState(tvSettings);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<SaveMessage | null>(null);

  const brandDirty = JSON.stringify(brand) !== JSON.stringify(savedBrand);
  const tvDirty = JSON.stringify(tvSettings) !== JSON.stringify(savedTvSettings);
  const hasPendingChanges = brandDirty || tvDirty;
  const mats = useMemo(() => splitList(brand.mats), [brand.mats]);
  const classTypes = useMemo(() => splitList(brand.classTypes), [brand.classTypes]);
  const logoText = brand.logoLabel.trim() || initials(brand.academyName) || "G";

  useEffect(() => {
    if (!activeClub?.name) return;
    setBrand((current) => ({ ...current, academyName: activeClub.name, logoLabel: initials(activeClub.name) }));
    setSavedBrand((current) => ({ ...current, academyName: activeClub.name, logoLabel: initials(activeClub.name) }));
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
      const payload = (await response.json()) as { ok?: boolean; error?: string };
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div
              className="grid size-12 shrink-0 place-items-center rounded-2xl text-sm font-bold text-white shadow-[var(--shadow)]"
              style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.accentColor})` }}
            >
              {logoText.slice(0, 3)}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{brand.academyName}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs leading-5 text-[var(--muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} /> {brand.location}
                </span>
                <span>{mats.length} mats</span>
                <span>{classTypes.length} class types</span>
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
              ["brand", "Organization"],
              ["appearance", "Appearance"],
              ["coaches", "Coaches"],
              ["integrations", "Integrations"],
              ["tv", "TV Screen"],
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
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Card className="oss-hover-lift">
            <CardHeader>
              <div>
                <CardTitle>Organization Profile</CardTitle>
                <CardKicker>Name, location, academy identity, and public description</CardKicker>
              </div>
              <Building2 size={18} className="text-[var(--accent)]" />
            </CardHeader>

            <div className="grid gap-4 md:grid-cols-[112px_minmax(0,1fr)]">
              <div>
                <div
                  className="grid aspect-square w-28 place-items-center rounded-3xl border border-[var(--border)] text-2xl font-bold text-white shadow-[var(--shadow)]"
                  style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.accentColor})` }}
                >
                  {logoText.slice(0, 3)}
                </div>
                <Button className="mt-3 w-full justify-center" variant="surface" type="button">
                  <Upload size={16} /> Logo
                </Button>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="academy-name" label="Academy name" value={brand.academyName} onChange={(academyName) => setBrand((current) => ({ ...current, academyName }))} />
                  <Field id="academy-location" label="Location" value={brand.location} onChange={(location) => setBrand((current) => ({ ...current, location }))} />
                </div>
                <Field id="academy-logo-label" label="Logo initials" value={brand.logoLabel} onChange={(logoLabel) => setBrand((current) => ({ ...current, logoLabel }))} />
                <div className="space-y-1.5">
                  <Label htmlFor="academy-description">Description</Label>
                  <textarea
                    id="academy-description"
                    value={brand.description}
                    onChange={(event) => setBrand((current) => ({ ...current, description: event.target.value }))}
                    className="min-h-28 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="oss-hover-lift">
            <CardHeader>
              <div>
                <CardTitle>Brand Preview</CardTitle>
                <CardKicker>How the academy identity reads in product surfaces</CardKicker>
              </div>
              <ImageIcon size={18} className="text-[var(--accent)]" />
            </CardHeader>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-3">
                <div
                  className="grid size-12 place-items-center rounded-2xl text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.accentColor})` }}
                >
                  {logoText.slice(0, 3)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{brand.academyName}</p>
                  <p className="text-xs text-[var(--muted)]">{brand.location}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{brand.description}</p>
            </div>
            <ColorPicker title="Primary color" colors={brandColors} value={brand.primaryColor} onChange={(primaryColor) => setBrand((current) => ({ ...current, primaryColor }))} />
            <ColorPicker title="Accent color" colors={accentColors} value={brand.accentColor} onChange={(accentColor) => setBrand((current) => ({ ...current, accentColor }))} />
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Academy Operations</CardTitle>
                <CardKicker>Mats and class types used across schedule, TV, and member workflows</CardKicker>
              </div>
              <Shapes size={18} className="text-[var(--accent)]" />
            </CardHeader>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mats">Mats</Label>
                <Input id="mats" value={brand.mats} onChange={(event) => setBrand((current) => ({ ...current, mats: event.target.value }))} />
                <div className="flex flex-wrap gap-2">
                  {mats.map((mat) => (
                    <Badge key={mat} variant="muted">{mat}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-types">Class types</Label>
                <Input id="class-types" value={brand.classTypes} onChange={(event) => setBrand((current) => ({ ...current, classTypes: event.target.value }))} />
                <div className="flex flex-wrap gap-2">
                  {classTypes.map((type) => (
                    <Badge key={type} variant="muted">{type}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button variant="primary" type="button" onClick={() => saveSetting("brand", brand)} disabled={saving === "brand" || !brandDirty}>
                {saving === "brand" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {brandDirty ? "Save organization" : "Organization saved"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {tab === "coaches" && (
        <Card className="max-w-4xl oss-hover-lift">
          <CardHeader>
            <div>
              <CardTitle>Coaches</CardTitle>
              <CardKicker>Teaching team, mat leadership, and schedule ownership</CardKicker>
            </div>
            <Users size={18} className="text-[var(--accent)]" />
          </CardHeader>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Sofia Almeida", "Head coach", "Competition / Advanced No-Gi", "Main Mat"],
              ["Lina Okafor", "Coach", "No-Gi basics / Wrestling", "Mat B"],
              ["Noah Keller", "Coach", "Youth / Competition rounds", "Mat A"],
            ].map(([coach, role, focus, mat]) => (
              <div key={coach} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">{coach}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{role}</p>
                <div className="mt-4 space-y-2">
                  <Badge variant="accent">{mat}</Badge>
                  <p className="text-xs leading-5 text-[var(--muted)]">{focus}</p>
                </div>
              </div>
            ))}
          </div>
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
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="oss-hover-lift">
            <CardHeader>
              <div>
                <CardTitle>TV Screen</CardTitle>
                <CardKicker>Fullscreen academy display controls</CardKicker>
              </div>
              <MonitorPlay size={18} className="text-[var(--accent)]" />
            </CardHeader>
            <div className="space-y-4">
              <Field
                id="tv-display-name"
                label="Screen title"
                value={tvSettings.displayName}
                onChange={(displayName) => setTvSettings((current) => ({ ...current, displayName }))}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["showActiveAthletes", "Show active athletes"],
                    ["liveCheckInQr", "Live check-in QR"],
                    ["rotatingAthleteCards", "Rotating athlete cards"],
                    ["liveActivityTicker", "Live activity ticker"],
                    ["showCoachAndMat", "Show coach and mat"],
                  ] as const
                ).map(([key, setting]) => (
                  <Label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                    <span className="text-sm text-[var(--foreground)]">{setting}</span>
                    <Switch checked={tvSettings[key]} onChange={(event) => setTvSettings((current) => ({ ...current, [key]: event.target.checked }))} />
                  </Label>
                ))}
              </div>
              <Button variant="primary" type="button" onClick={() => saveSetting("tv", tvSettings)} disabled={saving === "tv" || !tvDirty}>
                {saving === "tv" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {tvDirty ? "Save TV settings" : "TV settings saved"}
              </Button>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-[var(--border)] p-4">
              <Badge variant="accent">Preview</Badge>
              <h3 className="mt-3 text-lg font-semibold text-[var(--foreground)]">{tvSettings.displayName}</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">{brand.academyName}</p>
            </div>
            <div className="p-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Live now</p>
                <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">Advanced No-Gi</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Sofia Almeida · Main Mat · 19:00</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {["Sofia", "Noah", "Lina"].map((name) => (
                    <div key={name} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-2 text-center">
                      <div className="mx-auto size-8 rounded-full bg-[var(--accent)]/20" />
                      <p className="mt-2 truncate text-[11px] font-semibold text-[var(--foreground)]">{name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {message && (
        <div
          className={
            message.tone === "success"
              ? "mt-4 flex max-w-xl items-start gap-2 rounded-xl border border-[var(--status-success)]/25 bg-[var(--status-success)]/10 px-4 py-3 text-xs text-[var(--foreground)]"
              : "mt-4 flex max-w-xl items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs text-[var(--foreground)]"
          }
        >
          {message.tone === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span>{message.text}</span>
        </div>
      )}
    </>
  );
}

function Field({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ColorPicker({ title, colors, value, onChange }: { title: string; colors: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{title}</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Use ${title.toLowerCase()} ${color}`}
            className="size-9 rounded-lg border border-[var(--border)] ring-offset-2 ring-offset-[var(--background)] transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ background: color, boxShadow: value === color ? "0 0 0 2px var(--accent)" : undefined }}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    </div>
  );
}
