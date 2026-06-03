"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { AdminOverview } from "@/components/dashboard/admin-overview";
import { AcademyUpdates } from "@/components/dashboard/academy-updates";
import { CommandCenter } from "@/components/dashboard/command-center";
import { useActiveClubState } from "@/components/use-active-club";
import { Badge } from "@/components/ui/badge";
import { academyMeta } from "@/data/academy-meta";
import { dashboardStats } from "@/data/dashboard";

export type DashboardMeta = typeof academyMeta;
export type DashboardStats = typeof dashboardStats;

export function DashboardGrid() {
  const { activeClub, loading } = useActiveClubState();
  const [dashboard, setDashboard] = useState<{ meta: DashboardMeta; stats: DashboardStats }>({
    meta: academyMeta,
    stats: dashboardStats,
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(false);

  useEffect(() => {
    if (loading) return;

    const controller = new AbortController();
    const params = new URLSearchParams();
    if (activeClub?.slug) params.set("club", activeClub.slug);
    setDashboardLoading(true);
    setDashboardError(false);

    fetch(`/api/dashboard${params.size ? `?${params}` : ""}`, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Dashboard data failed.");
        return response.json();
      })
      .then((payload: { meta?: DashboardMeta; stats?: DashboardStats } | null) => {
        if (payload?.meta && payload?.stats) setDashboard({ meta: payload.meta, stats: payload.stats });
        else setDashboardError(true);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setDashboardError(true);
      })
      .finally(() => setDashboardLoading(false));

    return () => controller.abort();
  }, [activeClub?.slug, loading]);

  return (
    <div className="space-y-8 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">{activeClub?.name ?? "Academy dashboard"}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Operational view for today&apos;s classes, roster health, and coach actions.</p>
        </div>
        <Badge variant={dashboardError ? "muted" : "accent"}>
          {dashboardLoading ? <Loader2 size={13} className="animate-spin" /> : dashboardError ? <AlertTriangle size={13} /> : null}
          {dashboardLoading ? "Syncing" : dashboardError ? "Offline fallback" : "Live data"}
        </Badge>
      </div>
      <CommandCenter meta={dashboard.meta} stats={dashboard.stats} />
      <AdminOverview stats={dashboard.stats} />
      <AcademyUpdates />
    </div>
  );
}
