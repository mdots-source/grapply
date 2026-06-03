"use client";

import { useEffect, useState } from "react";
import { AdminOverview } from "@/components/dashboard/admin-overview";
import { AcademyUpdates } from "@/components/dashboard/academy-updates";
import { CommandCenter } from "@/components/dashboard/command-center";
import { useActiveClubState } from "@/components/use-active-club";
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

  useEffect(() => {
    if (loading) return;

    const controller = new AbortController();
    const params = new URLSearchParams();
    if (activeClub?.slug) params.set("club", activeClub.slug);

    fetch(`/api/dashboard${params.size ? `?${params}` : ""}`, { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { meta?: DashboardMeta; stats?: DashboardStats } | null) => {
        if (payload?.meta && payload?.stats) setDashboard({ meta: payload.meta, stats: payload.stats });
      })
      .catch(() => {});

    return () => controller.abort();
  }, [activeClub?.slug, loading]);

  return (
    <div className="space-y-10 pb-4">
      <CommandCenter meta={dashboard.meta} stats={dashboard.stats} />
      <AdminOverview stats={dashboard.stats} />
      <AcademyUpdates />
    </div>
  );
}
