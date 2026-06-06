"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { AdminOverview } from "@/components/dashboard/admin-overview";
import { CardSkeleton } from "@/components/oss/loading-skeleton";
import { useActiveClubState } from "@/components/use-active-club";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { academyMeta } from "@/data/academy-meta";
import { dashboardStats } from "@/data/dashboard";
import { readApiJson } from "@/lib/api-client";
import type { ClubClass, PlatformRole } from "@/data/platform";

export type DashboardMeta = Omit<typeof academyMeta, "liveClass"> & {
  city?: string;
  liveClass: {
    name: string;
    coach: string;
    room: string;
    time: string;
    trainingType: string;
  };
};
export type DashboardStats = typeof dashboardStats;
export type DashboardClass = Pick<ClubClass, "id" | "name" | "coach" | "time" | "mat" | "day">;
export type DashboardPayload = { meta: DashboardMeta; stats: DashboardStats; classes: DashboardClass[] };

export function DashboardGrid({
  viewerRole,
  initialDashboard = null,
  initialError = null,
  initialClubSlug,
}: {
  viewerRole: PlatformRole;
  initialDashboard?: DashboardPayload | null;
  initialError?: string | null;
  initialClubSlug?: string;
}) {
  const { activeClub, loading } = useActiveClubState();
  const resolvedClubSlug = activeClub?.slug ?? initialClubSlug;
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(initialError);
  const [dashboard, setDashboard] = useState<DashboardPayload>(
    initialDashboard ?? {
      meta: academyMeta,
      stats: dashboardStats,
      classes: [],
    },
  );

  useEffect(() => {
    if (loading && !resolvedClubSlug) return;
    if (reloadKey === 0 && initialDashboard && resolvedClubSlug === initialClubSlug) return;
    if (!resolvedClubSlug) {
      setError("Choose a club to load the dashboard.");
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("club", resolvedClubSlug);
    setError(null);

    fetch(`/api/dashboard${params.size ? `?${params}` : ""}`, { cache: "no-store", signal: controller.signal })
      .then((response) => readApiJson<Partial<DashboardPayload> | null>(response, "Dashboard data failed."))
      .then((payload: Partial<DashboardPayload> | null) => {
        if (payload?.meta && payload?.stats) {
          setDashboard({ meta: payload.meta, stats: payload.stats, classes: payload.classes ?? [] });
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setError(error instanceof Error ? error.message : "Dashboard data failed.");
      });

    return () => controller.abort();
  }, [initialClubSlug, initialDashboard, loading, reloadKey, resolvedClubSlug]);

  if (loading) {
    return (
      <div className="grid gap-4 pb-4 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      {error && (
        <Card className="border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--status-danger)]/25 bg-[var(--status-danger)]/10 text-[var(--status-danger)]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Dashboard could not load live data</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{error}</p>
              </div>
            </div>
            <Button type="button" variant="surface" size="sm" onClick={() => setReloadKey((value) => value + 1)}>
              <RefreshCw size={14} />
              Retry
            </Button>
          </div>
        </Card>
      )}
      <AdminOverview
        stats={dashboard.stats}
        viewerRole={viewerRole}
        meta={dashboard.meta}
        classes={dashboard.classes}
        clubSlug={resolvedClubSlug}
      />
    </div>
  );
}
