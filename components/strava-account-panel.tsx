"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { StravaConnectButton } from "@/components/strava-connect-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardKicker, CardTitle } from "@/components/ui/card";
import { formatApiError, readApiJson } from "@/lib/api-client";

type StravaStatus = {
  source?: "supabase" | "mock" | "strava";
  status: "connected" | "not_connected" | "needs_reconnect" | "rate_limited" | "temporarily_unavailable" | "not_configured";
  athleteId: string | null;
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
  syncedAt?: string | null;
};

type Message = { tone: "success" | "error"; text: string };

export function StravaAccountPanel({ clubSlug, returnTo }: { clubSlug: string; returnTo: string }) {
  const [status, setStatus] = useState<StravaStatus | null>(null);
  const [activities, setActivities] = useState<StravaActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStrava() {
      setLoading(true);
      try {
        const clubQuery = `?club=${encodeURIComponent(clubSlug)}`;
        const [statusResponse, activitiesResponse] = await Promise.all([
          fetch(`/api/strava/status${clubQuery}`, { cache: "no-store" }),
          fetch(`/api/strava/sync${clubQuery}`, { cache: "no-store" }),
        ]);
        const statusPayload = await readApiJson<StravaStatus>(statusResponse, "Cannot load Strava status.");
        const activitiesPayload = activitiesResponse.ok
          ? ((await activitiesResponse.json()) as { activities?: StravaActivitySummary[] })
          : null;
        if (!cancelled) {
          setStatus(statusPayload);
          setActivities(activitiesPayload?.activities ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus({
            source: "strava",
            status: "temporarily_unavailable",
            athleteId: null,
            error: error instanceof Error ? error.message : "Cannot load Strava status.",
          });
          setActivities([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadStrava();

    return () => {
      cancelled = true;
    };
  }, [clubSlug]);

  async function syncStrava() {
    setSyncing(true);
    setMessage(null);
    try {
      const response = await fetch("/api/strava/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubSlug }),
      });
      const payload = await readApiJson<{ ok?: boolean; error?: string; requestId?: string; synced?: number; activities?: StravaActivitySummary[]; refreshed?: boolean }>(
        response,
        "Strava sync failed.",
      );
      if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Strava sync failed.", payload.requestId));
      const nextActivities = payload.activities ?? [];
      setActivities(nextActivities);
      setStatus((current) => current ? {
        ...current,
        status: "connected",
        refreshed: Boolean(payload.refreshed),
        savedActivities: nextActivities.length,
        lastSyncedAt: nextActivities[0]?.syncedAt ?? new Date().toISOString(),
      } : current);
      setMessage({ tone: "success", text: `Synced ${payload.synced ?? 0} Strava activities.` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Strava sync failed." });
    } finally {
      setSyncing(false);
    }
  }

  async function disconnectStrava() {
    setDisconnecting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/strava/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubSlug }),
      });
      const payload = await readApiJson<StravaStatus & { ok?: boolean; error?: string; requestId?: string }>(response, "Strava disconnect failed.");
      if (payload.error) throw new Error(formatApiError(payload.error, payload.requestId));
      setStatus({ status: "not_connected", athleteId: null, source: payload.source });
      setActivities([]);
      setMessage({ tone: "success", text: "Strava disconnected for this club." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Strava disconnect failed." });
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <Card className="max-w-3xl oss-hover-lift">
      <CardHeader>
        <div>
          <CardTitle>Training Activity</CardTitle>
          <CardKicker>Personal Strava connection for this club</CardKicker>
        </div>
        <Activity size={18} className="text-[var(--accent)]" />
      </CardHeader>

      {message && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
          message.tone === "success"
            ? "border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--foreground)]"
            : "border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 text-[var(--foreground)]"
        }`}>
          {message.text}
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[var(--foreground)]">Strava</p>
              <StatusBadge loading={loading} status={status?.status} />
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {status?.status === "connected"
                ? `Athlete ${status.athleteId} is linked to this Grapply account.`
                : status?.status === "needs_reconnect"
                  ? "Strava is linked, but activity permission is missing. Reconnect and allow activity access."
                  : status?.error
                    ? status.error
                    : "Connect activity data so training volume can sit beside mat attendance."}
            </p>
            {status?.refreshed && <p className="mt-1 text-xs text-[var(--accent)]">Token refreshed automatically.</p>}
            {status?.status === "connected" && (
              <p className="mt-1 text-xs text-[var(--muted)]">
                {status.lastSyncedAt
                  ? `Last sync ${formatActivityDate(status.lastSyncedAt)} · ${status.savedActivities ?? activities.length} saved activities.`
                  : `${status.savedActivities ?? activities.length} saved activities. Sync to pull the latest workouts.`}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {status?.status === "connected" && (
              <Button variant="primary" onClick={syncStrava} disabled={syncing}>
                {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Sync activities
              </Button>
            )}
            {status?.status === "connected" && (
              <Button variant="surface" onClick={disconnectStrava} disabled={disconnecting || syncing}>
                {disconnecting ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Disconnect
              </Button>
            )}
            {status?.status === "not_configured" ? (
              <Button variant="surface" disabled>
                <XCircle size={16} />
                Configure Strava
              </Button>
            ) : (
              <StravaConnectButton href={`/api/strava/connect?returnTo=${encodeURIComponent(returnTo)}`}>
                {status?.status === "connected" ? "Reconnect Strava" : "Connect Strava"}
              </StravaConnectButton>
            )}
          </div>
        </div>

        {status?.status === "connected" && (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Recent synced activity</p>
              <Badge variant="muted">{status.savedActivities ?? activities.length} saved</Badge>
            </div>
            {activities.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {activities.slice(0, 3).map((activity) => (
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
  );
}

function StatusBadge({ loading, status }: { loading: boolean; status?: StravaStatus["status"] }) {
  if (loading) return <Badge variant="muted"><Loader2 size={12} className="animate-spin" />Checking</Badge>;
  if (status === "connected") return <Badge variant="success"><CheckCircle2 size={12} />Connected</Badge>;
  if (status === "needs_reconnect") return <Badge variant="accent"><RefreshCw size={12} />Reconnect needed</Badge>;
  if (status === "not_configured") return <Badge variant="muted"><XCircle size={12} />Setup needed</Badge>;
  if (status === "rate_limited" || status === "temporarily_unavailable") return <Badge variant="accent"><RefreshCw size={12} />Retry later</Badge>;
  return <Badge variant="muted"><XCircle size={12} />Not connected</Badge>;
}

function formatActivityDate(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function formatDistance(value?: number | null) {
  if (!value) return "0 km";
  return `${(value / 1000).toFixed(1)} km`;
}
