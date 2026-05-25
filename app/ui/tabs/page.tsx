"use client";

import { Specimen } from "@/components/ui-lab/specimen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UiTabsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tabs</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Primitives shown one route at a time.</p>
      </div>

      <Specimen title="TabsList + TabsTrigger" importPath="@/components/ui/tabs">
        <TabsList>
          <TabsTrigger active>All</TabsTrigger>
          <TabsTrigger>Active</TabsTrigger>
          <TabsTrigger>Coaches</TabsTrigger>
        </TabsList>
      </Specimen>

      <Specimen title="TabsTrigger (inactive)" importPath='TabsTrigger · active={false}'>
        <TabsTrigger>Inactive tab</TabsTrigger>
      </Specimen>

      <Specimen title="TabsTrigger (active)" importPath="TabsTrigger · active">
        <TabsTrigger active>Active tab</TabsTrigger>
      </Specimen>

      <Specimen title="TabsContent" importPath="@/components/ui/tabs · TabsContent">
        <Tabs>
          <TabsContent className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
            Panel body content
          </TabsContent>
        </Tabs>
      </Specimen>
    </div>
  );
}
