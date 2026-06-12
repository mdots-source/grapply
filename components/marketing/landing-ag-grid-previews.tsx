"use client";

import { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { type ColDef, type ICellRendererParams } from "ag-grid-community";
import { ArrowDown, ArrowUp, Filter, Minus, Search, Trophy } from "lucide-react";
import { AgGridHost } from "@/components/ag-grid-host";
import { BeltPill } from "@/components/belt-pill";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { compareMemberHierarchy, students, type Belt, type Student } from "@/data/academy";
import { rankMovement } from "@/data/rankings-meta";

const activeMembers = students.filter((student) => student.status === "active");
const rankedMembers = [...students].sort((a, b) => b.points - a.points);

type RankedLandingMember = Student & {
  rank: number;
  movement: number;
};

type ScheduleBlock = {
  name: string;
  coach: string;
  room: string;
  level: string;
};

type ScheduleRow = {
  time: string;
  mon: ScheduleBlock[];
  tue: ScheduleBlock[];
  wed: ScheduleBlock[];
  thu: ScheduleBlock[];
  fri: ScheduleBlock[];
  sat: ScheduleBlock[];
  sun: ScheduleBlock[];
};

const scheduleRows: ScheduleRow[] = [
  {
    time: "06:30",
    mon: [session("Dawn Patrol Gi", "Sofia Almeida", "Mat A", "Experienced")],
    tue: [session("No-Gi Conditioning", "Noah Keller", "Mat B", "Basics")],
    wed: [session("Dawn Patrol Gi", "Sofia Almeida", "Mat A", "Experienced")],
    thu: [session("Wrestling Entries", "Lina Okafor", "Mat B", "Advanced")],
    fri: [session("Open Mat", "Sofia Almeida", "Main Mat", "All levels")],
    sat: [],
    sun: [],
  },
  {
    time: "08:00",
    mon: [session("Fundamentals", "Eli Morgan", "Mat B", "Beginners")],
    tue: [],
    wed: [session("Fundamentals", "Eli Morgan", "Mat B", "Beginners")],
    thu: [],
    fri: [session("Mobility + Drilling", "Noah Keller", "Mat A", "Basics")],
    sat: [session("Weekend Beginners", "Eli Morgan", "Mat B", "Beginners")],
    sun: [],
  },
  {
    time: "12:00",
    mon: [session("Lunch No-Gi", "Lina Okafor", "Mat B", "Basics")],
    tue: [session("Gi Passing Lab", "Sofia Almeida", "Mat A", "Experienced")],
    wed: [session("Lunch No-Gi", "Lina Okafor", "Mat B", "Basics")],
    thu: [session("Leg Lock Systems", "Noah Keller", "Mat A", "Experienced")],
    fri: [session("Competition Drills", "Sofia Almeida", "Main Mat", "Team")],
    sat: [session("Open Mat", "Lina Okafor", "Main Mat", "All levels")],
    sun: [session("Recovery Flow", "Eli Morgan", "Mat B", "Basics")],
  },
  {
    time: "19:00",
    mon: [session("Advanced Sparring", "Sofia Almeida", "Main Mat", "Experienced")],
    tue: [session("Fundamentals Gi", "Eli Morgan", "Mat A", "Beginners")],
    wed: [session("Advanced Sparring", "Sofia Almeida", "Main Mat", "Experienced")],
    thu: [session("No-Gi Advanced", "Lina Okafor", "Main Mat", "Experienced")],
    fri: [session("Fight Night Rounds", "Sofia Almeida", "Main Mat", "Competition")],
    sat: [],
    sun: [],
  },
  {
    time: "20:30",
    mon: [session("Open Mat", "Lina Okafor", "Mat B", "All levels")],
    tue: [session("Women Only", "Camille Duran", "Mat B", "Basics")],
    wed: [session("Guard Retention", "Maya Ribeiro", "Mat A", "Advanced")],
    thu: [session("Open Mat", "Noah Keller", "Mat B", "All levels")],
    fri: [session("Coaches Lab", "Sofia Almeida", "Mat A", "Experienced")],
    sat: [],
    sun: [],
  },
];

export function LandingMembersAgGridPreview() {
  const rowData = useMemo(() => [...activeMembers].sort(compareMemberHierarchy), []);
  const [selectedMember, setSelectedMember] = useState<Student>(rowData[3] ?? rowData[0]);

  const columnDefs = useMemo<ColDef<Student>[]>(
    () => [
      {
        field: "name",
        headerName: "Member",
        flex: 1.35,
        minWidth: 240,
        cellRenderer: MemberCell,
      },
      {
        field: "belt",
        headerName: "Belt",
        width: 150,
        cellRenderer: BeltCell,
        comparator: (a, b) => beltRank(a) - beltRank(b),
      },
      {
        field: "role",
        headerName: "Role",
        width: 120,
        cellRenderer: RoleCell,
      },
      {
        field: "totalHours",
        headerName: "Total hours",
        width: 128,
        valueFormatter: (params) => `${(params.value ?? 0).toLocaleString("en-US")}h`,
        cellClass: "font-mono text-[var(--accent)]",
      },
      {
        field: "classes30",
        headerName: "30d",
        width: 92,
        cellClass: "font-mono text-[var(--muted)]",
      },
      {
        field: "lastSeen",
        headerName: "Last seen",
        minWidth: 160,
        flex: 0.75,
        cellClass: "text-[var(--muted)]",
      },
    ],
    [],
  );

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)]">
      <GridToolbar kicker="Members" title="Academy roster" right={<Badge variant="success">{rowData.length} active</Badge>} />
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <AgGridHost className="oss-members-grid ag-theme-quartz h-[500px] w-full">
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
              rowSelection="single"
              onRowClicked={(event) => {
                if (event.data) setSelectedMember(event.data);
              }}
              rowClass="cursor-pointer"
            />
          </AgGridHost>
        </div>
        <div className="border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--accent)_7%,var(--panel))] p-4 lg:border-l lg:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Drawer preview</p>
          <div className="mt-4 flex items-center gap-3">
            <StudentAvatar student={selectedMember} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{selectedMember.name}</p>
              <p className="text-sm capitalize text-[var(--muted)]">{selectedMember.belt} belt · {selectedMember.stripes} stripes</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniMetric value={selectedMember.streak} label="streak" />
            <MiniMetric value={selectedMember.points} label="points" />
            <MiniMetric value={`${selectedMember.totalHours}h`} label="mat time" />
            <MiniMetric value={selectedMember.classes30} label="30 days" />
          </div>
          <p className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm leading-6 text-[var(--muted)]">
            Coach context: {selectedMember.focus}. Last seen at {selectedMember.lastSeen}.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LandingRankingsAgGridPreview() {
  const rowData = useMemo<RankedLandingMember[]>(
    () =>
      rankedMembers.map((member, index) => ({
        ...member,
        rank: index + 1,
        movement: rankMovement[member.id] ?? 0,
      })),
    [],
  );

  const columnDefs = useMemo<ColDef<RankedLandingMember>[]>(
    () => [
      {
        field: "rank",
        headerName: "#",
        width: 82,
        sortable: false,
        cellRenderer: RankCell,
      },
      {
        field: "movement",
        headerName: "Δ",
        width: 72,
        sortable: false,
        cellRenderer: MovementCell,
      },
      {
        field: "name",
        headerName: "Athlete",
        flex: 1.35,
        minWidth: 240,
        cellRenderer: RankingAthleteCell,
      },
      {
        field: "belt",
        headerName: "Belt",
        width: 145,
        cellRenderer: BeltCell,
        comparator: (a, b) => beltRank(a) - beltRank(b),
      },
      {
        field: "points",
        headerName: "Points",
        width: 118,
        cellClass: "font-mono text-[var(--accent)] font-semibold",
      },
      {
        field: "wins",
        headerName: "Record",
        width: 118,
        valueGetter: (params) => `${params.data?.wins ?? 0}-${params.data?.losses ?? 0}`,
        cellRenderer: RecordCell,
      },
      {
        field: "totalHours",
        headerName: "Mat hours",
        width: 122,
        valueFormatter: (params) => `${(params.value ?? 0).toLocaleString("en-US")}h`,
        cellClass: "font-mono text-[var(--muted)]",
      },
    ],
    [],
  );

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)]">
      <GridToolbar
        kicker="Rankings"
        title="Academy leaderboard"
        right={
          <div className="flex flex-wrap gap-2">
            {(["all", "blue", "purple", "black"] as const).map((belt) => (
              <span key={belt} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold capitalize text-[var(--muted)]">
                {belt}
              </span>
            ))}
          </div>
        }
      />
      <AgGridHost className="oss-rankings-grid ag-theme-quartz h-[510px] w-full">
        <AgGridReact<RankedLandingMember>
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
          rowClass="cursor-pointer"
        />
      </AgGridHost>
    </div>
  );
}

export function LandingScheduleAgGridPreview() {
  const columnDefs = useMemo<ColDef<ScheduleRow>[]>(
    () => [
      {
        field: "time",
        headerName: "Time",
        width: 92,
        pinned: "left",
        cellClass: "font-mono text-[var(--accent)] font-semibold",
      },
      ...(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map<ColDef<ScheduleRow>>((day) => ({
        field: day,
        headerName: day.toUpperCase(),
        minWidth: 168,
        flex: 1,
        sortable: false,
        filter: false,
        cellRenderer: ScheduleCell,
        headerClass: "schedule-day-header",
      })),
    ],
    [],
  );

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)]">
      <GridToolbar kicker="Schedule" title="Week grid" right={<Badge variant="accent">Main academy</Badge>} />
      <AgGridHost className="oss-schedule-grid ag-theme-quartz h-[560px] w-full">
        <AgGridReact<ScheduleRow>
          rowData={scheduleRows}
          columnDefs={columnDefs}
          defaultColDef={{
            resizable: true,
            suppressMovable: true,
          }}
          theme="legacy"
          rowHeight={104}
          headerHeight={50}
          suppressCellFocus
        />
      </AgGridHost>
    </div>
  );
}

function GridToolbar({ kicker, title, right }: { kicker: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{kicker}</p>
        <h3 className="mt-1 text-xl font-semibold">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--muted)]">
          <Search size={14} />
          Search
        </span>
        <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--muted)]">
          <Filter size={14} />
          Filter
        </span>
        {right}
      </div>
    </div>
  );
}

function MemberCell(params: ICellRendererParams<Student>) {
  const member = params.data;
  if (!member) return null;
  return (
    <div className="flex h-full min-w-0 items-center gap-3">
      <StudentAvatar student={member} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--foreground)]">{member.name}</p>
        <p className="truncate text-xs text-[var(--muted)]">{member.focus}</p>
      </div>
    </div>
  );
}

function RankingAthleteCell(params: ICellRendererParams<RankedLandingMember>) {
  const member = params.data;
  if (!member) return null;
  return (
    <div className="flex h-full min-w-0 items-center gap-3">
      <StudentAvatar student={member} size="sm" />
      <span className="truncate text-sm font-semibold text-[var(--foreground)]">{member.name}</span>
    </div>
  );
}

function BeltCell(params: ICellRendererParams<Student | RankedLandingMember>) {
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
        {member.role}
      </Badge>
    </div>
  );
}

function RankCell(params: ICellRendererParams<RankedLandingMember>) {
  const rank = params.data?.rank;
  if (!rank) return null;
  return (
    <div className="flex h-full items-center">
      <span className="grid size-9 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-black text-[var(--accent)]">#{rank}</span>
    </div>
  );
}

function MovementCell(params: ICellRendererParams<RankedLandingMember>) {
  const delta = params.data?.movement ?? 0;
  const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  const color = delta > 0 ? "text-[var(--status-success)]" : delta < 0 ? "text-[var(--status-danger)]" : "text-[var(--muted)]";
  return (
    <div className={`flex h-full items-center gap-1 font-mono text-sm ${color}`}>
      <Icon size={14} />
      {delta > 0 ? `+${delta}` : delta}
    </div>
  );
}

function RecordCell(params: ICellRendererParams<RankedLandingMember>) {
  const member = params.data;
  if (!member) return null;
  return (
    <div className="flex h-full items-center gap-1.5">
      <Trophy size={14} className="text-[var(--muted)]" />
      <span className="font-mono text-sm text-[var(--foreground)]">
        {member.wins}-{member.losses}
      </span>
    </div>
  );
}

function ScheduleCell(params: ICellRendererParams<ScheduleRow, ScheduleBlock[]>) {
  const blocks = params.value ?? [];
  if (!blocks.length) {
    return <div className="h-full w-full rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)]" />;
  }

  return (
    <div className="grid h-full w-full gap-1 py-1">
      {blocks.map((block) => (
        <div key={`${block.name}-${block.room}`} className="flex min-h-[82px] flex-col justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
          <div>
            <p className="line-clamp-2 text-xs font-semibold text-[var(--foreground)]">{block.name}</p>
            <p className="mt-1 truncate text-[11px] text-[var(--muted)]">{block.coach}</p>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="truncate text-[10px] text-[var(--muted)]">{block.room}</span>
            <span className="rounded-md bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-1.5 py-1 text-[9px] font-semibold text-[var(--accent)]">{block.level}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniMetric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
    </div>
  );
}

function session(name: string, coach: string, room: string, level: string): ScheduleBlock {
  return { name, coach, room, level };
}

function beltRank(belt: Belt) {
  const order: Belt[] = ["white", "blue", "purple", "brown", "black"];
  return order.indexOf(belt);
}
