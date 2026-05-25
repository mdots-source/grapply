"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { type ColDef, type ICellRendererParams } from "ag-grid-community";
import { ArrowDown, ArrowUp, Flame, Minus, Trophy } from "lucide-react";
import { StatCard } from "@/components/oss/stat-card";
import { BeltPill } from "@/components/belt-pill";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgGridHost } from "@/components/ag-grid-host";
import { beltStyles, students as seedStudents, type Belt, type Student } from "@/data/academy";
import { rankingHighlights, rankMovement } from "@/data/rankings-meta";

type RankedStudent = Student & { rank: number };

type BeltFilter = "all" | Belt;

export function RankingsGrid() {
  const [students, setStudents] = useState<Student[]>(seedStudents);
  const [source, setSource] = useState<"mock" | "supabase">("mock");
  const [beltFilter, setBeltFilter] = useState<BeltFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/members", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { source?: "mock" | "supabase"; members?: Student[] }) => {
        if (payload.members?.length) {
          setStudents(payload.members);
          setSource(payload.source ?? "mock");
        }
      })
      .catch(() => setSource("mock"));
  }, []);

  const ranked = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = students.filter((student) => {
      if (beltFilter !== "all" && student.belt !== beltFilter) return false;
      if (!query) return true;
      return (
        student.name.toLowerCase().includes(query) ||
        student.belt.toLowerCase().includes(query) ||
        student.role.toLowerCase().includes(query)
      );
    });

    return [...filtered]
      .sort((a, b) => b.points - a.points)
      .map((student, index) => ({ ...student, rank: index + 1 }));
  }, [beltFilter, search]);

  const summary = useMemo(() => {
    const top = ranked[0];
    const totalPoints = ranked.reduce((sum, student) => sum + student.points, 0);
    return { top, totalPoints, count: ranked.length };
  }, [ranked]);

  const columnDefs = useMemo<ColDef<RankedStudent>[]>(
    () => [
      {
        field: "rank",
        headerName: "#",
        width: 88,
        sortable: false,
        cellRenderer: RankCell,
        cellClass: "font-mono text-[var(--accent)]",
      },
      {
        colId: "movement",
        headerName: "Δ",
        width: 72,
        sortable: false,
        cellRenderer: MovementCell,
      },
      {
        field: "name",
        headerName: "Athlete",
        flex: 1.4,
        minWidth: 260,
        cellRenderer: AthleteCell,
        sortable: true,
      },
      {
        field: "belt",
        headerName: "Belt",
        width: 150,
        cellRenderer: BeltCell,
        sortable: true,
        comparator: (a, b) => beltRank(a) - beltRank(b),
      },
      {
        field: "role",
        headerName: "Role",
        width: 110,
        cellRenderer: RoleCell,
        sortable: true,
      },
      {
        field: "points",
        headerName: "Points",
        width: 120,
        cellClass: "font-mono text-[var(--accent)] font-semibold",
        comparator: (a, b) => a - b,
      },
      {
        field: "wins",
        headerName: "Record",
        width: 120,
        valueGetter: (params) => `${params.data?.wins ?? 0}-${params.data?.losses ?? 0}`,
        cellRenderer: RecordCell,
        sortable: true,
        comparator: (_a, _b, nodeA, nodeB) => {
          const winsA = nodeA?.data?.wins ?? 0;
          const winsB = nodeB?.data?.wins ?? 0;
          return winsA - winsB;
        },
      },
      {
        field: "totalHours",
        headerName: "Mat hours",
        width: 120,
        valueFormatter: (params) => `${(params.value ?? 0).toLocaleString("en-US")}h`,
        cellClass: "font-mono text-[var(--muted)]",
      },
    ],
    [],
  );

  const beltTabs: { id: BeltFilter; label: string }[] = [
    { id: "all", label: "All belts" },
    { id: "white", label: beltStyles.white.label },
    { id: "blue", label: beltStyles.blue.label },
    { id: "purple", label: beltStyles.purple.label },
    { id: "brown", label: beltStyles.brown.label },
    { id: "black", label: beltStyles.black.label },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {rankingHighlights.map((h, i) => (
          <StatCard
            key={h.id}
            label={h.label}
            value={h.name}
            icon={Flame}
            trend={`${h.value} · ${h.detail}`}
            tone={i === 0 ? "accent" : "blue"}
            index={i}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-[var(--muted)]">Leader</p>
          <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">{summary.top?.name ?? "—"}</p>
          <p className="mt-1 font-mono text-sm text-[var(--accent)]">{summary.top?.points ?? 0} pts</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted)]">Athletes ranked</p>
          <p className="mt-2 text-2xl font-semibold">{summary.count}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted)]">Points in view</p>
          <p className="mt-2 text-2xl font-semibold">{summary.totalPoints.toLocaleString("en-US")}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted)]">Backend source</p>
          <p className="mt-2 text-2xl font-semibold capitalize">{source}</p>
        </Card>
      </div>

      <Tabs>
        <TabsList className="flex-wrap">
          {beltTabs.map((tab) => (
            <TabsTrigger key={tab.id} active={beltFilter === tab.id} onClick={() => setBeltFilter(tab.id)}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent>
          <Card className="overflow-hidden p-0">
            <div className="border-b border-[var(--border)] p-4">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search athletes by name or role"
                placeholder="Search athletes by name or role"
                className="h-10 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/30"
              />
            </div>

            <AgGridHost className="oss-rankings-grid ag-theme-quartz h-[560px] w-full">
              <AgGridReact<RankedStudent>
                rowData={ranked}
                columnDefs={columnDefs}
                defaultColDef={{
                  resizable: true,
                  filter: true,
                  suppressMovable: true,
                }}
                theme="legacy"
                animateRows
                rowHeight={72}
                headerHeight={46}
                suppressCellFocus
                rowClass="cursor-pointer"
                overlayNoRowsTemplate='<span class="text-[var(--muted)]">No athletes match this filter.</span>'
              />
            </AgGridHost>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function beltRank(belt: Belt) {
  const order: Belt[] = ["white", "blue", "purple", "brown", "black"];
  return order.indexOf(belt);
}

function RankCell(params: ICellRendererParams<RankedStudent>) {
  const rank = params.data?.rank;
  if (!rank) return null;
  return (
    <div className="flex h-full items-center">
      <span className="grid size-10 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-black text-[var(--accent)]">
        #{rank}
      </span>
    </div>
  );
}

function AthleteCell(params: ICellRendererParams<RankedStudent>) {
  const student = params.data;
  if (!student) return null;

  return (
    <Link
      href={`/members/${student.id}`}
      className="flex h-full items-center gap-3 py-2"
      onClick={(event) => event.stopPropagation()}
    >
      <StudentAvatar student={student} size="sm" />
      <span className="text-sm font-semibold text-[var(--foreground)]">{student.name}</span>
    </Link>
  );
}

function BeltCell(params: ICellRendererParams<RankedStudent>) {
  const student = params.data;
  if (!student) return null;
  return (
    <div className="flex h-full items-center">
      <BeltPill belt={student.belt} stripes={student.stripes} />
    </div>
  );
}

function RoleCell(params: ICellRendererParams<RankedStudent>) {
  const student = params.data;
  if (!student) return null;
  return (
    <div className="flex h-full items-center">
      <Badge variant={student.role === "coach" ? "accent" : "default"} className="capitalize">
        {student.role}
      </Badge>
    </div>
  );
}

function MovementCell(params: ICellRendererParams<RankedStudent>) {
  const student = params.data;
  if (!student) return null;
  const delta = rankMovement[student.id] ?? 0;
  const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  const color = delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-[var(--muted)]";

  return (
    <div className={`flex h-full items-center gap-1 font-mono text-sm ${color}`}>
      <Icon size={14} />
      {delta > 0 ? `+${delta}` : delta}
    </div>
  );
}

function RecordCell(params: ICellRendererParams<RankedStudent>) {
  const student = params.data;
  if (!student) return null;
  return (
    <div className="flex h-full items-center gap-1.5">
      <Trophy size={14} className="text-[var(--muted)]" />
      <span className="font-mono text-sm text-[var(--foreground)]">
        {student.wins}-{student.losses}
      </span>
    </div>
  );
}
