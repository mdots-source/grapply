"use client";

import { AdminOverview } from "@/components/dashboard/admin-overview";
import { AcademyUpdates } from "@/components/dashboard/academy-updates";

export function DashboardGrid() {
  return (
    <div className="space-y-10 pb-4">
      <AdminOverview />
      <AcademyUpdates />
    </div>
  );
}
