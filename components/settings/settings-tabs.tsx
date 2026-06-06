"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  ImageIcon,
  Loader2,
  MapPin,
  MonitorPlay,
  Palette,
  RefreshCw,
  Save,
  Shapes,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { AppearanceSettings, type AppearanceSetting } from "@/components/settings/appearance-settings";
import { StravaConnectButton } from "@/components/strava-connect-button";
import { useActiveClub } from "@/components/use-active-club";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardKicker, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PlatformRole } from "@/data/platform";
import { formatApiError, readApiJson } from "@/lib/api-client";

const tabKeys = ["brand", "appearance", "coaches", "integrations", "billing", "tv"] as const;
type SaveMessage = { tone: "success" | "error"; text: string };
type StravaStatus = {
  source?: "supabase" | "mock" | "strava";
  status: "connected" | "not_connected" | "needs_reconnect" | "rate_limited" | "temporarily_unavailable" | "not_configured";
  athleteId: string | null;
  scopes?: string[];
  expiresAt?: number | null;
  refreshed?: boolean;
  savedActivities?: number;
  lastSyncedAt?: string | null;
  error?: string;
};
type StravaActivitySummary = {
  activityId: string;
  name: string;
  sportType: string;
  startDate: string;
  distanceMeters: number | null;
  movingTimeSeconds: number | null;
  syncedAt?: string | null;
};
type BrandSettings = {
  academyName: string;
  location: string;
  description: string;
  logoLabel: string;
  mats: string;
  classTypes: string;
  primaryColor: string;
  accentColor: string;
};
type TvSettings = {
  displayName: string;
  showActiveAthletes: boolean;
  liveCheckInQr: boolean;
  rotatingAthleteCards: boolean;
  liveActivityTicker: boolean;
  showCoachAndMat: boolean;
};
type CoachSettings = {
  name: string;
  role: string;
  focus: string;
  mat: string;
};
type BillingSubscription = {
  plan: "starter" | "growth" | "pro" | "enterprise";
  status: "trialing" | "active" | "past_due" | "canceled" | "incomplete";
  billing_email: string | null;
  trial_ends_at: string | null;
  current_period_ends_at: string | null;
  seats_included: number;
  member_limit: number;
};

const brandColors = ["#7c3aed", "#0284c7", "#16a34a", "#e11d48", "#111827"];
const accentColors = ["#22c55e", "#38bdf8", "#f43f5e", "#a78bfa", "#f97316"];
const defaultBrand: BrandSettings = {
  academyName: "Grapply Jiu-Jitsu Academy",
  location: "San Diego, CA",
  description: "Premium Brazilian Jiu-Jitsu academy focused on fundamentals, competition rounds, and visible member progression.",
  logoLabel: "GJ",
  mats: "Main Mat, Mat A, Mat B",
  classTypes: "Gi, No-Gi, Fundamentals, Competition, Youth, Open Mat",
  primaryColor: "#7c3aed",
  accentColor: "#22c55e",
};
const defaultTvSettings: TvSettings = {
  displayName: "Grapply Live Mat",
  showActiveAthletes: true,
  liveCheckInQr: true,
  rotatingAthleteCards: true,
  liveActivityTicker: true,
  showCoachAndMat: true,
};
const defaultAppearance: AppearanceSetting = {
  theme: "dark",
  accent: "purple",
};
const defaultCoaches: CoachSettings[] = [
  { name: "Sofia Almeida", role: "Head coach", focus: "Competition / Advanced No-Gi", mat: "Main Mat" },
  { name: "Lina Okafor", role: "Coach", focus: "No-Gi basics / Wrestling", mat: "Mat B" },
  { name: "Noah Keller", role: "Coach", focus: "Youth / Competition rounds", mat: "Mat A" },
];

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function parseBrandSettings(value: unknown, fallback = defaultBrand): BrandSettings {
  if (!isRecord(value)) return fallback;
  return {
    academyName: stringValue(value.academyName, stringValue(value.name, fallback.academyName)),
    location: stringValue(value.location, fallback.location),
    description: stringValue(value.description, fallback.description),
    logoLabel: stringValue(value.logoLabel, stringValue(value.shortName, fallback.logoLabel)),
    mats: stringValue(value.mats, fallback.mats),
    classTypes: stringValue(value.classTypes, fallback.classTypes),
    primaryColor: stringValue(value.primaryColor, fallback.primaryColor),
    accentColor: stringValue(value.accentColor, fallback.accentColor),
  };
}

function parseTvSettings(value: unknown): TvSettings {
  if (!isRecord(value)) return defaultTvSettings;
  return {
    displayName: stringValue(value.displayName, defaultTvSettings.displayName),
    showActiveAthletes: booleanValue(value.showActiveAthletes, defaultTvSettings.showActiveAthletes),
    liveCheckInQr: booleanValue(value.liveCheckInQr, defaultTvSettings.liveCheckInQr),
    rotatingAthleteCards: booleanValue(value.rotatingAthleteCards, defaultTvSettings.rotatingAthleteCards),
    liveActivityTicker: booleanValue(value.liveActivityTicker, defaultTvSettings.liveActivityTicker),
    showCoachAndMat: booleanValue(value.showCoachAndMat, defaultTvSettings.showCoachAndMat),
  };
}

function parseCoachSettings(value: unknown): CoachSettings[] {
  if (!Array.isArray(value)) return defaultCoaches;
  const coaches = value
    .map((item) => {
      if (!isRecord(item)) return null;
      return {
        name: stringValue(item.name, ""),
        role: stringValue(item.role, "Coach"),
        focus: stringValue(item.focus, ""),
        mat: stringValue(item.mat, "Main Mat"),
      };
    })
    .filter((item): item is CoachSettings => Boolean(item?.name));
  return coaches.length ? coaches : defaultCoaches;
}

function parseAppearanceSettings(value: unknown): AppearanceSetting {
  if (!isRecord(value)) return defaultAppearance;
  const theme = value.theme === "light" ? "light" : "dark";
  const accent = value.accent === "blue" || value.accent === "green" || value.accent === "coral" || value.accent === "purple"
    ? value.accent
    : defaultAppearance.accent;
  return { theme, accent };
}

function getStravaResultMessage(value: string): SaveMessage | null {
  if (value === "connected") return { tone: "success", text: "Strava connected for this academy workspace." };
  if (value === "denied") return { tone: "error", text: "Strava connection was cancelled before access was granted." };
  if (value === "missing-config") return { tone: "error", text: "Strava is not configured on this deployment yet." };
  if (value === "missing-scope") return { tone: "error", text: "Strava did not grant activity access. Reconnect and allow activity permissions." };
  if (value === "invalid-state") return { tone: "error", text: "Strava connection expired. Start the connection again from this page." };
  if (value === "login-required") return { tone: "error", text: "Sign in before connecting Strava." };
  if (value === "real-login-required") return { tone: "error", text: "Use a real Supabase account before connecting Strava." };
  if (value === "club-required") return { tone: "error", text: "Choose an academy before connecting Strava." };
  if (value === "club-not-found") return { tone: "error", text: "The selected academy could not be found for Strava." };
  if (value === "missing-code") return { tone: "error", text: "Strava did not return an authorization code." };
  if (value === "error") return { tone: "error", text: "Strava connection failed. Try again from this page." };
  return null;
}

export function SettingsTabs({
  currentRole,
  stravaResult,
  initialClubSlug,
  initialClubName,
}: {
  currentRole: PlatformRole;
  stravaResult?: string;
  initialClubSlug?: string;
  initialClubName?: string;
}) {
  const activeClub = useActiveClub();
  const resolvedClubSlug = activeClub?.slug ?? initialClubSlug;
  const resolvedClubName = activeClub?.name ?? initialClubName;
  const canManageSettings = currentRole === "owner" || currentRole === "admin";
  const isOwner = currentRole === "owner";
  const [tab, setTab] = useState<(typeof tabKeys)[number]>(canManageSettings ? "brand" : "integrations");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [brand, setBrand] = useState<BrandSettings>({ ...defaultBrand, academyName: resolvedClubName ?? defaultBrand.academyName });
  const [savedBrand, setSavedBrand] = useState(brand);
  const [tvSettings, setTvSettings] = useState<TvSettings>(defaultTvSettings);
  const [savedTvSettings, setSavedTvSettings] = useState(tvSettings);
  const [appearance, setAppearance] = useState<AppearanceSetting>(defaultAppearance);
  const [savedAppearance, setSavedAppearance] = useState<AppearanceSetting>(defaultAppearance);
  const [coaches, setCoaches] = useState<CoachSettings[]>(defaultCoaches);
  const [savedCoaches, setSavedCoaches] = useState<CoachSettings[]>(defaultCoaches);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<SaveMessage | null>(null);
  const [stravaStatus, setStravaStatus] = useState<StravaStatus | null>(null);
  const [stravaActivities, setStravaActivities] = useState<StravaActivitySummary[]>([]);
  const [stravaLoading, setStravaLoading] = useState(true);
  const [stravaDisconnecting, setStravaDisconnecting] = useState(false);
  const [stravaSyncing, setStravaSyncing] = useState(false);
  const [billing, setBilling] = useState<BillingSubscription | null>(null);
  const [billingEmail, setBillingEmail] = useState("");
  const [billingLoading, setBillingLoading] = useState(isOwner);
  const [billingSaving, setBillingSaving] = useState(false);

  const brandDirty = JSON.stringify(brand) !== JSON.stringify(savedBrand);
  const tvDirty = JSON.stringify(tvSettings) !== JSON.stringify(savedTvSettings);
  const appearanceDirty = JSON.stringify(appearance) !== JSON.stringify(savedAppearance);
  const coachesDirty = JSON.stringify(coaches) !== JSON.stringify(savedCoaches);
  const hasPendingChanges = canManageSettings && (brandDirty || tvDirty || appearanceDirty || coachesDirty);
  const mats = useMemo(() => splitList(brand.mats), [brand.mats]);
  const classTypes = useMemo(() => splitList(brand.classTypes), [brand.classTypes]);
  const logoText = brand.logoLabel.trim() || initials(brand.academyName) || "G";

  useEffect(() => {
    if (!stravaResult) return;

    const message = getStravaResultMessage(stravaResult);
    if (message) setMessage(message);
  }, [stravaResult]);

  useEffect(() => {
    if (!canManageSettings && (tab === "brand" || tab === "coaches" || tab === "tv" || tab === "billing")) {
      setTab("integrations");
    }
  }, [canManageSettings, tab]);

  useEffect(() => {
    if (!resolvedClubName) return;
    if (!settingsLoading) return;
    setBrand((current) => ({ ...current, academyName: resolvedClubName, logoLabel: initials(resolvedClubName) }));
    setSavedBrand((current) => ({ ...current, academyName: resolvedClubName, logoLabel: initials(resolvedClubName) }));
  }, [resolvedClubName, settingsLoading]);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setSettingsLoading(true);
      try {
        const params = new URLSearchParams();
        if (resolvedClubSlug) params.set("club", resolvedClubSlug);
        const response = await fetch(`/api/settings${params.size ? `?${params}` : ""}`, { cache: "no-store" });
        const payload = await readApiJson<{ settings?: Record<string, unknown> }>(response, "Cannot load settings.");
        const loadedBrand = parseBrandSettings(payload.settings?.brand, {
          ...defaultBrand,
          academyName: resolvedClubName ?? defaultBrand.academyName,
          logoLabel: resolvedClubName ? initials(resolvedClubName) : defaultBrand.logoLabel,
        });
        const loadedTv = parseTvSettings(payload.settings?.tv);
        const loadedAppearance = parseAppearanceSettings(payload.settings?.appearance);
        const loadedCoaches = parseCoachSettings(payload.settings?.coaches);
        if (cancelled) return;
        setBrand(loadedBrand);
        setSavedBrand(loadedBrand);
        setTvSettings(loadedTv);
        setSavedTvSettings(loadedTv);
        setAppearance(loadedAppearance);
        setSavedAppearance(loadedAppearance);
        setCoaches(loadedCoaches);
        setSavedCoaches(loadedCoaches);
      } catch (error) {
        if (!cancelled) setMessage({ tone: "error", text: error instanceof Error ? error.message : "Cannot load settings." });
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [resolvedClubName, resolvedClubSlug]);

  useEffect(() => {
    if (!isOwner) return;
    let cancelled = false;

    async function loadBilling() {
      setBillingLoading(true);
      try {
        const params = new URLSearchParams();
        if (resolvedClubSlug) params.set("club", resolvedClubSlug);
        const response = await fetch(`/api/billing${params.size ? `?${params}` : ""}`, { cache: "no-store" });
        const payload = await readApiJson<{ subscription?: BillingSubscription }>(response, "Cannot load billing.");
        if (cancelled) return;
        const subscription = payload.subscription ?? null;
        setBilling(subscription);
        setBillingEmail(subscription?.billing_email ?? "");
      } catch (error) {
        if (!cancelled) setMessage({ tone: "error", text: error instanceof Error ? error.message : "Cannot load billing." });
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    }

    void loadBilling();

    return () => {
      cancelled = true;
    };
  }, [isOwner, resolvedClubSlug]);

  useEffect(() => {
    let cancelled = false;

    async function loadStravaStatus() {
      setStravaLoading(true);
      try {
        const clubQuery = resolvedClubSlug ? `?club=${encodeURIComponent(resolvedClubSlug)}` : "";
        const [statusResponse, activitiesResponse] = await Promise.all([
          fetch(`/api/strava/status${clubQuery}`, { cache: "no-store" }),
          fetch(`/api/strava/sync${clubQuery}`, { cache: "no-store" }),
        ]);
        const statusPayload = await readApiJson<StravaStatus>(statusResponse, "Cannot load Strava status.");
        const activitiesPayload = activitiesResponse.ok
          ? ((await activitiesResponse.json()) as { activities?: StravaActivitySummary[] })
          : null;
        if (!cancelled) {
          setStravaStatus(statusPayload);
          setStravaActivities(activitiesPayload?.activities ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setStravaStatus({
            source: "strava",
            status: "temporarily_unavailable",
            athleteId: null,
            error: error instanceof Error ? error.message : "Cannot load Strava status.",
          });
          setStravaActivities([]);
        }
      } finally {
        if (!cancelled) setStravaLoading(false);
      }
    }

    void loadStravaStatus();

    return () => {
      cancelled = true;
    };
  }, [resolvedClubSlug]);

  const saveSetting = async (key: string, value: unknown) => {
    setSaving(key);
    setMessage(null);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, ...(resolvedClubSlug ? { clubSlug: resolvedClubSlug } : {}) }),
      });
      const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string }>(response, "Settings save failed.");
      if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Settings save failed.", payload.requestId));
      if (key === "brand") setSavedBrand(brand);
      if (key === "tv") setSavedTvSettings(tvSettings);
      if (key === "appearance") setSavedAppearance(appearance);
      if (key === "coaches") setSavedCoaches(coaches);
      setMessage({ tone: "success", text: `Saved ${key} settings for ${resolvedClubName ?? "this academy"}.` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Settings save failed." });
    } finally {
      setSaving(null);
    }
  };

  const disconnectStrava = async () => {
    setStravaDisconnecting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/strava/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(resolvedClubSlug ? { clubSlug: resolvedClubSlug } : {}) }),
      });
      const payload = await readApiJson<StravaStatus & { ok?: boolean; error?: string; requestId?: string }>(response, "Strava disconnect failed.");
      if (payload.error) throw new Error(formatApiError(payload.error, payload.requestId));
      setStravaStatus({ status: "not_connected", athleteId: null, source: payload.source });
      setStravaActivities([]);
      setMessage({ tone: "success", text: "Strava disconnected for this account." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Strava disconnect failed." });
    } finally {
      setStravaDisconnecting(false);
    }
  };

  const syncStrava = async () => {
    setStravaSyncing(true);
    setMessage(null);
    try {
      const response = await fetch("/api/strava/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(resolvedClubSlug ? { clubSlug: resolvedClubSlug } : {}) }),
      });
      const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string; synced?: number; activities?: StravaActivitySummary[]; refreshed?: boolean }>(response, "Strava sync failed.");
      if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Strava sync failed.", payload.requestId));
      const activities = payload.activities ?? [];
      setStravaActivities(activities);
      setStravaStatus((current) => current ? {
        ...current,
        refreshed: Boolean(payload.refreshed),
        savedActivities: activities.length,
        lastSyncedAt: activities[0]?.syncedAt ?? new Date().toISOString(),
      } : current);
      setMessage({ tone: "success", text: `Synced ${payload.synced ?? 0} Strava activities for ${resolvedClubName ?? "this club"}.` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Strava sync failed." });
    } finally {
      setStravaSyncing(false);
    }
  };

  const saveBilling = async () => {
    setBillingSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billing_email: billingEmail, ...(resolvedClubSlug ? { clubSlug: resolvedClubSlug } : {}) }),
      });
      const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string; subscription?: BillingSubscription }>(response, "Billing save failed.");
      if (!payload.ok || !payload.subscription) throw new Error(formatApiError(payload.error ?? "Billing save failed.", payload.requestId));
      setBilling(payload.subscription);
      setBillingEmail(payload.subscription.billing_email ?? "");
      setMessage({ tone: "success", text: "Billing contact saved for this club." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Billing save failed." });
    } finally {
      setBillingSaving(false);
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
          <Badge variant={settingsLoading ? "muted" : hasPendingChanges ? "accent" : "success"}>
            {settingsLoading ? "Loading settings" : hasPendingChanges ? "Unsaved changes" : "Saved"}
          </Badge>
        </div>
      </div>

      <Tabs className="mb-5">
        <TabsList>
          {(
            [
              ...(canManageSettings ? ([["brand", "Organization"]] as const) : []),
              ["appearance", "Appearance"],
              ...(canManageSettings ? ([["coaches", "Coaches"]] as const) : []),
              ["integrations", "Integrations"],
              ...(isOwner ? ([["billing", "Billing"]] as const) : []),
              ...(canManageSettings ? ([["tv", "TV Screen"]] as const) : []),
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
          <AppearanceSettings
            value={appearance}
            dirty={appearanceDirty}
            saving={saving === "appearance"}
            canSaveWorkspace={canManageSettings}
            onChange={setAppearance}
            onSave={() => saveSetting("appearance", appearance)}
          />
        </div>
      )}

      {tab === "brand" && canManageSettings && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Card className="oss-hover-lift">
            <CardHeader>
              <div>
                <CardTitle>Organization Profile</CardTitle>
                <CardKicker>Name, location, logo, and public description</CardKicker>
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
                <CardKicker>How the academy profile appears in the app</CardKicker>
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

      {tab === "coaches" && canManageSettings && (
        <Card className="max-w-4xl oss-hover-lift">
          <CardHeader>
            <div>
              <CardTitle>Coaches</CardTitle>
              <CardKicker>Teaching team, mat leadership, and schedule ownership</CardKicker>
            </div>
            <Users size={18} className="text-[var(--accent)]" />
          </CardHeader>
          <div className="space-y-3">
            {coaches.map((coach, index) => (
              <div key={`${coach.name}-${index}`} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field
                    id={`coach-name-${index}`}
                    label="Name"
                    value={coach.name}
                    onChange={(name) => setCoaches((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, name } : item)))}
                  />
                  <Field
                    id={`coach-role-${index}`}
                    label="Role"
                    value={coach.role}
                    onChange={(role) => setCoaches((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, role } : item)))}
                  />
                  <Field
                    id={`coach-mat-${index}`}
                    label="Mat"
                    value={coach.mat}
                    onChange={(mat) => setCoaches((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, mat } : item)))}
                  />
                  <Field
                    id={`coach-focus-${index}`}
                    label="Focus"
                    value={coach.focus}
                    onChange={(focus) => setCoaches((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, focus } : item)))}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="accent">{coach.mat || "Main Mat"}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCoaches((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    disabled={coaches.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="surface"
                onClick={() => setCoaches((current) => [...current, { name: "New coach", role: "Coach", focus: "Class ownership", mat: "Main Mat" }])}
              >
                Add coach
              </Button>
              <Button variant="primary" type="button" onClick={() => saveSetting("coaches", coaches)} disabled={saving === "coaches" || !coachesDirty}>
                {saving === "coaches" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {coachesDirty ? "Save coaches" : "Coaches saved"}
              </Button>
            </div>
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
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--foreground)]">Strava</p>
                  {stravaLoading ? (
                    <Badge variant="muted">
                      <Loader2 size={12} className="animate-spin" />
                      Checking
                    </Badge>
                  ) : stravaStatus?.status === "connected" ? (
                    <Badge variant="success">
                      <CheckCircle2 size={12} />
                      Connected
                    </Badge>
                  ) : stravaStatus?.status === "needs_reconnect" ? (
                    <Badge variant="accent">
                      <RefreshCw size={12} />
                      Reconnect needed
                    </Badge>
                  ) : stravaStatus?.status === "not_configured" ? (
                    <Badge variant="muted">
                      <XCircle size={12} />
                      Setup needed
                    </Badge>
                  ) : stravaStatus?.status === "rate_limited" || stravaStatus?.status === "temporarily_unavailable" ? (
                    <Badge variant="accent">
                      <RefreshCw size={12} />
                      Retry later
                    </Badge>
                  ) : (
                    <Badge variant="muted">
                      <XCircle size={12} />
                      Not connected
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  {stravaStatus?.status === "connected"
                    ? `Athlete ${stravaStatus.athleteId} is linked to this account.`
                    : stravaStatus?.status === "needs_reconnect"
                      ? "Strava is linked, but activity permission is missing. Reconnect and allow activity access."
                      : stravaStatus?.error
                        ? stravaStatus.error
                    : "Connect athlete activity so coaches can see training volume beside mat attendance."}
                </p>
                {stravaStatus?.refreshed && <p className="mt-1 text-xs text-[var(--accent)]">Token refreshed automatically.</p>}
                {stravaStatus?.status === "connected" && (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {stravaStatus.lastSyncedAt
                      ? `Last sync ${formatActivityDate(stravaStatus.lastSyncedAt)} · ${stravaStatus.savedActivities ?? stravaActivities.length} saved activities.`
                      : `${stravaStatus.savedActivities ?? stravaActivities.length} saved activities. Sync to pull the latest workouts.`}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {stravaStatus?.status === "connected" && (
                  <Button variant="primary" onClick={syncStrava} disabled={stravaSyncing}>
                    {stravaSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Sync activities
                  </Button>
                )}
                {stravaStatus?.status === "connected" && (
                  <Button variant="surface" onClick={disconnectStrava} disabled={stravaDisconnecting || stravaSyncing}>
                    {stravaDisconnecting ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                    Disconnect
                  </Button>
                )}
                {stravaStatus?.status === "not_configured" ? (
                  <Button variant="surface" disabled>
                    <XCircle size={16} />
                    Configure Strava
                  </Button>
                ) : (
                  <StravaConnectButton href={`/api/strava/connect?returnTo=${encodeURIComponent(resolvedClubSlug ? `/${resolvedClubSlug}/settings` : "/settings")}`}>
                    {stravaStatus?.status === "connected" ? "Reconnect Strava" : "Connect Strava"}
                  </StravaConnectButton>
                )}
              </div>
            </div>
            {stravaStatus?.status === "connected" && (
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Recent synced activity</p>
                  <Badge variant="muted">{stravaStatus?.savedActivities ?? stravaActivities.length} saved</Badge>
                </div>
                {stravaActivities.length > 0 ? (
                  <div className="mt-3 grid gap-2">
                    {stravaActivities.slice(0, 3).map((activity) => (
                      <div key={activity.activityId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--foreground)]">{activity.name}</p>
                          <p className="mt-0.5 text-xs text-[var(--muted)]">{activity.sportType} · {formatActivityDate(activity.startDate)}</p>
                        </div>
                        <p className="text-xs font-semibold text-[var(--accent)]">{formatDistance(activity.distanceMeters)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--panel)] px-3 py-3 text-xs text-[var(--muted)]">
                    No activities synced yet. Use Sync activities after connecting Strava.
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === "billing" && isOwner && (
        <Card className="max-w-3xl oss-hover-lift">
          <CardHeader>
            <div>
              <CardTitle>Billing</CardTitle>
              <CardKicker>Manual invoices, receipts, and billing contact</CardKicker>
            </div>
            <CreditCard size={18} className="text-[var(--accent)]" />
          </CardHeader>
          {billingLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
              <Loader2 size={16} className="animate-spin" />
              Loading billing...
            </div>
          ) : billing ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <BillingMetric label="Plan" value={billing.plan} />
                <BillingMetric label="Status" value={billing.status} />
                <BillingMetric label="Seats" value={String(billing.seats_included)} />
                <BillingMetric label="Member limit" value={String(billing.member_limit)} />
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="billing-email">Billing email</Label>
                    <Input id="billing-email" value={billingEmail} onChange={(event) => setBillingEmail(event.target.value)} placeholder="billing@academy.com" />
                  </div>
                  <Button type="button" variant="primary" disabled={billingSaving || billingEmail === (billing.billing_email ?? "")} onClick={saveBilling}>
                    {billingSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save billing contact
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <BillingDetail label="Trial ends" value={formatBillingDate(billing.trial_ends_at)} />
                <BillingDetail label="Current period ends" value={formatBillingDate(billing.current_period_ends_at)} />
                <BillingDetail label="Invoice method" value="Manual" />
                <BillingDetail label="Receipts" value={billing.billing_email ? "Sent by email" : "Contact needed"} />
              </div>

              <p className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-xs leading-5 text-[var(--muted)]">
                Online checkout is not enabled for this phase. Grapply tracks the billing contact and subscription status; invoices and receipts are handled manually.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
              No billing record exists for this club yet.
            </div>
          )}
        </Card>
      )}

      {tab === "tv" && canManageSettings && (
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

function BillingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-2 capitalize text-lg font-semibold text-[var(--foreground)]">{value.replaceAll("_", " ")}</p>
    </div>
  );
}

function BillingDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 break-all text-sm text-[var(--foreground)]">{value}</p>
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

function formatDistance(distanceMeters: number | null) {
  if (!distanceMeters || distanceMeters <= 0) return "No distance";
  const kilometers = distanceMeters / 1000;
  return `${kilometers.toFixed(kilometers >= 10 ? 0 : 1)} km`;
}

function formatActivityDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function formatBillingDate(value: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
