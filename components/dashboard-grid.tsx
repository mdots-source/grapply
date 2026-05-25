"use client";

import { AdminOverview } from "@/components/dashboard/admin-overview";
import { AcademyUpdates } from "@/components/dashboard/academy-updates";
import { CommandCenter } from "@/components/dashboard/command-center";

export function DashboardGrid() {
  return (
    <div className="space-y-10 pb-4">
      <CommandCenter />
      <AdminOverview />
      <AcademyUpdates />
    </div>
  );
}
