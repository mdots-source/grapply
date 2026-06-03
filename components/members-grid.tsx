"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  type ColDef,
  type ICellRendererParams,
  type RowClickedEvent,
} from "ag-grid-community";
import { AlertTriangle, Loader2, Plus, Search, UserPlus } from "lucide-react";
import { MemberDrawer } from "@/components/member-drawer";
import { BeltPill } from "@/components/belt-pill";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgGridHost } from "@/components/ag-grid-host";
import { useActiveClub } from "@/components/use-active-club";
import { compareMemberHierarchy, students as seedMembers, type Student } from "@/data/academy";
import { getMemberProfileExtra } from "@/data/member-profiles";
import { countCompetitionTeam } from "@/lib/members";

export type RosterFilter = "all" | "active" | "promotion" | "inactive" | "trial" | "follow-up";
type DrawerMode = "view" | "add";

function matchesFilter(member: Student, filter: RosterFilter) {
  if (filter === "all") return true;
  if (filter === "active") return member.status === "active";
  if (filter === "inactive") return member.status === "inactive";
  if (filter === "trial") return getMemberProfileExtra(member.id).trial === true;
  if (filter === "follow-up") {
    const extra = getMemberProfileExtra(member.id);
    return extra.attendanceRisk === "high" || extra.attendanceRisk === "medium" || member.classes30 < 6;
  }
  return member.totalHours >= 300 || member.classes30 >= 16;
}

export function MembersGrid({
  initialAdd = false,
  initialFilter = "all",
  initialMemberId,
  canManageMembers = false,
}: {
  initialAdd?: boolean;
  initialFilter?: RosterFilter;
  initialMemberId?: string;
  canManageMembers?: boolean;
}) {
  const activeClub = useActiveClub();
  const [members, setMembers] = useState<Student[]>(seedMembers);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RosterFilter>(initialFilter);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(initialAdd);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(initialAdd ? "add" : "view");
  const [selectedMember, setSelectedMember] = useState<Student | null>(null);

  const openMemberDrawer = useCallback((member: Student) => {
    setSelectedMember(member);
    setDrawerMode("view");
    setDrawerOpen(true);
  }, []);

  const openAddDrawer = () => {
    if (!canManageMembers) return;
    setSelectedMember(null);
    setDrawerMode("add");
    setDrawerOpen(true);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      setLoadingMembers(true);
      setMembersError(null);

      try {
        const params = new URLSearchParams();
        if (activeClub?.slug) params.set("club", activeClub.slug);
        const response = await fetch(`/api/members${params.size ? `?${params}` : ""}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Could not refresh members.");
        const payload = (await response.json()) as { members?: Student[] };
        if (cancelled) return;
        if (Array.isArray(payload.members)) {
          setMembers(payload.members);
        }
      } catch (error) {
        if (!cancelled) setMembersError(error instanceof Error ? error.message : "Could not refresh members.");
        // Keep the seeded roster visible if the roster cannot refresh.
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }

    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [activeClub?.slug]);

  useEffect(() => {
    if (!initialMemberId || drawerOpen) return;
    const member = members.find((candidate) => candidate.id === initialMemberId);
    if (member) openMemberDrawer(member);
  }, [drawerOpen, initialMemberId, members, openMemberDrawer]);

  async function addMember(member: Student) {
    setMembers((current) => [...current, member].sort(compareMemberHierarchy));

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...member, ...(activeClub?.slug ? { clubSlug: activeClub.slug } : {}) }),
      });
      const payload = (await response.json()) as { ok?: boolean; member?: Student };
      if (payload.ok && payload.member) {
        setMembers((current) => current.map((item) => (item.id === member.id ? payload.member! : item)).sort(compareMemberHierarchy));
      }
    } catch {
      // The optimistic member stays in the roster so the coach can keep working.
    }
  }

  const rowData = useMemo(() => {
    const query = search.trim().toLowerCase();
    return members
      .filter((member) => {
        if (!matchesFilter(member, filter)) return false;
        if (!query) return true;
        return (
          member.name.toLowerCase().includes(query) ||
          member.belt.toLowerCase().includes(query) ||
          member.role.toLowerCase().includes(query) ||
          member.lastSeen.toLowerCase().includes(query)
        );
      })
      .sort(compareMemberHierarchy);
  }, [filter, search, members]);

  const summary = useMemo(() => {
    const active = members.filter((m) => m.status === "active").length;
    const promotion = members.filter((m) => matchesFilter(m, "promotion")).length;
    const avgHours = members.length ? Math.round(members.reduce((sum, m) => sum + m.totalHours, 0) / members.length) : 0;
    const matHours = members.reduce((sum, m) => sum + m.totalHours, 0);
    const competitionTeam = countCompetitionTeam(members);
    return { active, promotion, avgHours, matHours, competitionTeam };
  }, [members]);

  const columnDefs = useMemo<ColDef<Student>[]>(
    () => [
      {
        field: "name",
        headerName: "Member",
        flex: 1.4,
        minWidth: 260,
        cellRenderer: MemberCell,
        cellRendererParams: { onOpen: openMemberDrawer },
      },
      {
        field: "belt",
        headerName: "Belt",
        width: 150,
        cellRenderer: BeltCell,
        sortable: false,
      },
      {
        field: "role",
        headerName: "Role",
        width: 120,
        cellRenderer: RoleCell,
        sortable: false,
      },
      {
        field: "totalHours",
        headerName: "Total hours",
        width: 130,
        valueFormatter: (params) => formatTotalHours(params.value ?? 0),
        cellClass: "font-mono text-[var(--accent)]",
        comparator: (a, b) => a - b,
      },
    ],
    [openMemberDrawer],
  );

  const onRowClicked = (event: RowClickedEvent<Student>) => {
    if (!event.data) return;
    openMemberDrawer(event.data);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 gap-4 md:grid-cols-4">
          {[
            [members.length.toString(), "Total members"],
            [summary.active.toString(), "Active this month"],
            [summary.competitionTeam.toString(), "Competition team"],
            [summary.promotion.toString(), "Promotion watch"],
          ].map(([value, label]) => (
            <Card key={label} className="p-4">
              <p className="text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{label}</p>
            </Card>
          ))}
        </div>
        {canManageMembers && (
          <Button variant="primary" className="shrink-0" onClick={openAddDrawer}>
            <Plus size={16} /> Add member
          </Button>
        )}
      </div>

      <Tabs>
        <TabsList>
          <TabsTrigger active={filter === "all"} onClick={() => setFilter("all")}>
            All members
          </TabsTrigger>
          <TabsTrigger active={filter === "active"} onClick={() => setFilter("active")}>
            Active
          </TabsTrigger>
          <TabsTrigger active={filter === "promotion"} onClick={() => setFilter("promotion")}>
            Promotion watch
          </TabsTrigger>
          <TabsTrigger active={filter === "inactive"} onClick={() => setFilter("inactive")}>
            Inactive
          </TabsTrigger>
          <TabsTrigger active={filter === "trial"} onClick={() => setFilter("trial")}>
            Trial
          </TabsTrigger>
          <TabsTrigger active={filter === "follow-up"} onClick={() => setFilter("follow-up")}>
            Follow-up
          </TabsTrigger>
        </TabsList>
        <TabsContent>
          <Card className="overflow-hidden p-0">
            <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 md:flex-row md:items-center md:justify-between">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search members by name, belt, or role"
                placeholder="Search members by name, belt, or role"
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none ring-[var(--accent)]/40 placeholder:text-[var(--muted)] focus:border-[var(--accent)]/40 focus:ring-2 md:max-w-md"
              />
              <div className="flex items-center gap-2">
                {loadingMembers && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
                    <Loader2 size={13} className="animate-spin" />
                    Syncing
                  </span>
                )}
                {membersError && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent-coral)]">
                    <AlertTriangle size={13} />
                    Offline fallback
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-2 border-b border-[var(--border)] px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Showing" value={rowData.length.toString()} />
              <Metric label="Active roster" value={summary.active.toString()} />
              <Metric label="Mat hours (roster)" value={summary.matHours.toLocaleString("en-US")} />
              <Metric label="Promotion watch" value={summary.promotion.toString()} />
            </div>

            {rowData.length > 0 ? (
              <AgGridHost className="oss-members-grid ag-theme-quartz h-[520px] w-full">
                <AgGridReact<Student>
                  rowData={rowData}
                  columnDefs={columnDefs}
                  defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                    suppressMovable: true,
                  }}
                  theme="legacy"
                  animateRows
                  rowHeight={72}
                  headerHeight={46}
                  suppressCellFocus
                  onRowClicked={onRowClicked}
                  rowClass="cursor-pointer"
                />
              </AgGridHost>
            ) : (
              <MembersEmptyState
                hasMembers={members.length > 0}
                canClear={Boolean(search || filter !== "all")}
                canAdd={canManageMembers}
                onClear={() => {
                  setSearch("");
                  setFilter("all");
                }}
                onAdd={openAddDrawer}
              />
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <MemberDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        member={selectedMember}
        onAddMember={addMember}
        canManageMembers={canManageMembers}
      />
    </div>
  );
}

function MembersEmptyState({
  hasMembers,
  canClear,
  onClear,
  onAdd,
  canAdd,
}: {
  hasMembers: boolean;
  canClear: boolean;
  canAdd: boolean;
  onClear: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="grid min-h-[420px] place-items-center px-6 py-10">
      <div className="max-w-sm text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--accent)]">
          {hasMembers ? <Search size={26} strokeWidth={1.6} /> : <UserPlus size={26} strokeWidth={1.6} />}
        </div>
        <h3 className="mt-5 text-lg font-semibold text-[var(--foreground)]">
          {hasMembers ? "No members match this view." : "No members in this academy yet."}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {hasMembers
            ? "Clear the search or switch back to all members to keep working from the full roster."
            : "Add the first member to start building the roster for this academy."}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          {canClear && (
            <Button variant="surface" onClick={onClear}>
              Clear filters
            </Button>
          )}
          {canAdd && (
            <Button variant="primary" onClick={onAdd}>
              <Plus size={16} />
              Add member
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function formatTotalHours(hours: number) {
  return `${hours.toLocaleString("en-US")}h`;
}

function MemberCell(params: ICellRendererParams<Student> & { onOpen?: (member: Student) => void }) {
  const member = params.data;
  if (!member) return null;

  return (
    <button
      type="button"
      className="flex h-full w-full items-center gap-3 py-2 text-left"
      onClick={(event) => {
        event.stopPropagation();
        params.onOpen?.(member);
      }}
    >
      <StudentAvatar student={member} size="sm" />
      <span>
        <span className="block text-sm font-semibold text-[var(--foreground)]">{member.name}</span>
        <span className="text-xs text-[var(--muted)]">Last seen: {member.lastSeen}</span>
      </span>
    </button>
  );
}

function BeltCell(params: ICellRendererParams<Student>) {
  const member = params.data;
  if (!member) return null;
  return (
    <div className="flex h-full items-center">
      <BeltPill belt={member.belt} stripes={member.stripes} />
    </div>
  );
}

function RoleCell(params: ICellRendererParams<Student>) {
  const member = params.data;
  if (!member) return null;
  return (
    <div className="flex h-full items-center">
      <Badge variant={member.role === "coach" ? "accent" : "default"} className="capitalize">
        {member.role === "coach" ? "trainer" : member.role}
      </Badge>
    </div>
  );
}
