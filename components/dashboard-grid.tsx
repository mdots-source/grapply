"use client";

import { useEffect, useState } from "react";
import { AdminOverview } from "@/components/dashboard/admin-overview";
import { useActiveClubState } from "@/components/use-active-club";
import { academyMeta } from "@/data/academy-meta";
import { dashboardStats } from "@/data/dashboard";
import type { PlatformRole } from "@/data/platform";

export type DashboardMeta = typeof academyMeta;
export type DashboardStats = typeof dashboardStats;

export function DashboardGrid({ viewerRole }: { viewerRole: PlatformRole }) {
  const { activeClub, loading } = useActiveClubState();
  const [dashboard, setDashboard] = useState<{ meta: DashboardMeta; stats: DashboardStats }>({
    meta: academyMeta,
    stats: dashboardStats,
  });

  useEffect(() => {
    if (loading) return;

    const controller = new AbortController();
    const params = new URLSearchParams();
    if (activeClub?.slug) params.set("club", activeClub.slug);

    fetch(`/api/dashboard${params.size ? `?${params}` : ""}`, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Dashboard data failed.");
        return response.json();
      })
      .then((payload: { meta?: DashboardMeta; stats?: DashboardStats } | null) => {
        if (payload?.meta && payload?.stats) setDashboard({ meta: payload.meta, stats: payload.stats });
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });

    return () => controller.abort();
  }, [activeClub?.slug, loading]);

  return (
    <div className="space-y-5 pb-4">
      <AdminOverview stats={dashboard.stats} viewerRole={viewerRole} meta={dashboard.meta} />
    </div>
  );
}
