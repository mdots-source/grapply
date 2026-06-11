"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { Award, CalendarCheck2, Loader2, MessageSquarePlus, Pencil, Plus, Target, Trash2, TrendingUp, Trophy } from "lucide-react";
import { BeltPill, formatBeltRank } from "@/components/belt-pill";
import { SectionHeader } from "@/components/oss/section-header";
import { StripeIndicator } from "@/components/oss/stripe-indicator";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardKicker, CardTitle } from "@/components/ui/card";
import { useActiveClub } from "@/components/use-active-club";
import { beltStyles, type Student } from "@/data/academy";
import { getMemberProfileExtra } from "@/data/member-profiles";
import type { PlatformRole } from "@/data/platform";
import { formatApiError, readApiJson } from "@/lib/api-client";
import type { MemberProfileCheckIn, MemberProfileClass, MemberProfileLiveData } from "@/lib/member-profile-data";
import { getWorkspaceHref } from "@/lib/workspace-url";

export function MemberProfile({
  member,
  viewerRole,
  viewerUserId,
  viewerUserName,
  initialLiveData,
  initialLiveDataError = null,
  initialClubSlug,
}: {
  member: Student;
  viewerRole: PlatformRole | null;
  viewerUserId?: string | null;
  viewerUserName?: string | null;
  initialLiveData?: MemberProfileLiveData | null;
  initialLiveDataError?: string | null;
  initialClubSlug?: string;
}) {
  const extra = getMemberProfileExtra(member.id);
  const activeClub = useActiveClub();
  const resolvedClubSlug = activeClub?.slug ?? initialClubSlug;
  const membersHref = (query = "") => getWorkspaceHref(`/members${query}`, resolvedClubSlug);
  const canAwardProgress = viewerRole === "owner" || viewerRole === "admin";
  const canAddStaffNote = viewerRole === "owner" || viewerRole === "admin" || viewerRole === "coach";
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-5">
            <StudentAvatar student={member} size="xl" priority />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <BeltPill belt={member.belt} stripes={member.stripes} />
                <Badge variant="muted">{formatBeltRank(member.belt, member.stripes)}</Badge>
                <Badge>{extra.roleLabel}</Badge>
                {extra.trial && <Badge variant="accent">Trial</Badge>}
                {extra.attendanceRisk === "high" && <Badge variant="muted">Coach follow-up</Badge>}
              </div>
              <h2 className="mt-4 text-3xl font-semibold md:text-4xl">{member.name}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">Primary focus: {member.focus}</p>
              <StripeIndicator stripes={member.stripes} className="mt-3" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(canAwardProgress || canAddStaffNote) && (
              <>
                {canAwardProgress && (
                  <>
                    <Button variant="primary" size="sm" className="gap-1.5" asChild>
                      <a href={membersHref(`?member=${member.id}&filter=promotion`)}>
                        <Award size={14} /> Award stripe
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <a href={membersHref(`?member=${member.id}&filter=promotion`)}>
                        <TrendingUp size={14} /> Promote belt
                      </a>
                    </Button>
                  </>
                )}
                {canAddStaffNote && (
                  <Button variant="ghost" size="sm" className="gap-1.5" asChild>
                    <a href={membersHref(`?member=${member.id}`)}>
                      <MessageSquarePlus size={14} /> Add note
                    </a>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [member.classes30, "Classes (30d)"],
            [member.streak, "Streak"],
            [`#${extra.rank}`, "Academy rank"],
            [`${member.wins}-${member.losses}`, "Comp record"],
            [extra.weeklyAttendance, "This week"],
            [member.points, "Points"],
            [member.totalHours, "Total hours"],
            [member.status, "Status"],
          ].map(([value, label]) => (
            <div
              key={String(label)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center"
            >
              <p className="text-xl font-semibold tabular-nums text-[var(--accent)]">{value}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <LiveProgressCard
          member={member}
          viewerRole={viewerRole}
          initialLiveData={initialLiveData}
          initialLiveDataError={initialLiveDataError}
          initialClubSlug={initialClubSlug}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHeader kicker="Training" title="Focus" description="Member-visible training context." />
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Current focus</p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{member.focus}</p>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
              Private coach notes are loaded live from Supabase below and are visible only to coaches and academy staff.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Achievements</CardTitle>
              <CardKicker>Milestones & badges</CardKicker>
            </div>
            <Trophy size={18} className="text-[var(--accent)]" />
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {extra.achievements.length > 0 ? (
              extra.achievements.map((a) => (
                <Badge key={a} variant="accent">
                  {a}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">No achievements yet.</p>
            )}
          </div>
        </Card>
      </div>

      <MemberLiveHistory
        member={member}
        viewerRole={viewerRole}
        viewerUserId={viewerUserId}
        viewerUserName={viewerUserName}
        mode="details"
        initialLiveData={initialLiveData}
        initialLiveDataError={initialLiveDataError}
        initialClubSlug={initialClubSlug}
      />
    </div>
  );
}

type CheckInRow = MemberProfileCheckIn;

type CoachNoteRow = {
  id: string;
  coach_user_id: string | null;
  coach_name: string;
  body: string;
  visibility: string;
  created_at: string;
};

type PromotionRow = {
  id: string;
  awarded_by_name: string;
  type: string;
  belt: Student["belt"] | null;
  stripes: number | null;
  detail: string;
  awarded_at: string;
};

type GoalRow = {
  id: string;
  title: string;
  status: string;
  target_date: string | null;
  created_at: string;
  completed_at: string | null;
};

type ClassRow = MemberProfileClass;

type CheckInsPayload = { checkIns?: CheckInRow[] };
type PromotionsPayload = { promotions?: PromotionRow[] };
type ClassesPayload = { classes?: ClassRow[] };
type CoachNotesPayload = { notes?: CoachNoteRow[] };
type GoalsPayload = { goals?: GoalRow[] };
type MutationPayload = { ok?: boolean; error?: string; requestId?: string };

function LiveProgressCard({
  member,
  viewerRole,
  initialLiveData,
  initialLiveDataError = null,
  initialClubSlug,
}: {
  member: Student;
  viewerRole: PlatformRole | null;
  initialLiveData?: MemberProfileLiveData | null;
  initialLiveDataError?: string | null;
  initialClubSlug?: string;
}) {
  const activeClub = useActiveClub();
  const resolvedClubSlug = activeClub?.slug ?? initialClubSlug;
  const hasInitialLiveData = Boolean(initialLiveData);
  const [checkIns, setCheckIns] = useState<CheckInRow[]>(() => initialLiveData?.checkIns ?? []);
  const [promotions, setPromotions] = useState<PromotionRow[]>(() => initialLiveData?.promotions ?? []);
  const [loading, setLoading] = useState(!hasInitialLiveData && !initialLiveDataError);
  const [message, setMessage] = useState<string | null>(initialLiveDataError);

  useEffect(() => {
    if (hasInitialLiveData && resolvedClubSlug === initialClubSlug) {
      setLoading(false);
      return;
    }

    let alive = true;
    const params = new URLSearchParams();
    if (resolvedClubSlug) params.set("club", resolvedClubSlug);
    params.set("memberId", member.id);

    setLoading(true);
    setMessage(null);

    Promise.all([
      fetch(`/api/check-ins?${params}`, { cache: "no-store" }).then((response) => readApiJson<CheckInsPayload>(response, "Could not load attendance.")),
      fetch(`/api/promotions?${params}`, { cache: "no-store" }).then((response) => readApiJson<PromotionsPayload>(response, "Could not load promotions.")),
    ])
      .then(([checkInPayload, promotionPayload]) => {
        if (!alive) return;
        setCheckIns(checkInPayload.checkIns ?? []);
        setPromotions(promotionPayload.promotions ?? []);
      })
      .catch((error: Error) => {
        if (alive) setMessage(error.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [hasInitialLiveData, initialClubSlug, member.id, resolvedClubSlug]);

  const weeklyAttendance = useMemo(() => buildWeeklyAttendance(checkIns), [checkIns]);
  const maxWeekCount = Math.max(1, ...weeklyAttendance.map((item) => item.count));
  const promotionTimeline = promotions.length
    ? promotions
    : [
        {
          id: "current-rank",
          awarded_by_name: "Current roster",
          type: "current",
          belt: member.belt,
          stripes: member.stripes,
          detail: `${member.name} is currently ${formatBeltRank(member.belt, member.stripes)}.`,
          awarded_at: new Date().toISOString(),
        } satisfies PromotionRow,
      ];

  return (
    <>
      <Card>
        <SectionHeader kicker="Progression" title="Live promotion timeline" description="Supabase promotion records for this member." />
        {loading ? (
          <div className="mt-6">
            <HistoryLoading />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {promotionTimeline.slice(0, 6).map((milestone, i) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative flex gap-4 pl-6 before:absolute before:left-0 before:top-2 before:h-[calc(100%+8px)] before:w-px before:bg-[var(--border)] last:before:hidden"
              >
                <span
                  className="absolute left-[-5px] top-2 size-2.5 rounded-full ring-2 ring-[var(--background)]"
                  style={{ background: beltStyles[milestone.belt ?? member.belt].hex }}
                />
                <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {milestone.belt ? <BeltPill belt={milestone.belt} stripes={milestone.stripes ?? 0} /> : <Badge variant="accent">{milestone.type}</Badge>}
                    <span className="text-xs text-[var(--muted)]">{formatShortDate(milestone.awarded_at)}</span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted)]">Recorded by {milestone.awarded_by_name}</p>
                  <p className="mt-2 text-sm text-[var(--foreground)]">{milestone.detail}</p>
                </div>
              </motion.div>
            ))}
            {!promotions.length && <p className="text-xs text-[var(--muted)]">No promotion records yet; showing the current rank from the roster.</p>}
          </div>
        )}
        {message && <p className="mt-3 text-xs text-[var(--muted)]">{message}</p>}
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Weekly attendance</CardTitle>
            <CardKicker>Check-ins saved for this member</CardKicker>
          </div>
          <Badge variant={viewerRole === "member" ? "muted" : "accent"}>{checkIns.length} total</Badge>
        </CardHeader>
        {loading ? (
          <HistoryLoading />
        ) : (
          <div className="flex h-44 items-end gap-2">
            {weeklyAttendance.map((day) => (
              <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                <motion.div
                  className="grid w-full place-items-end rounded-t-lg bg-[var(--accent)]/80 px-1 pb-1 text-[10px] font-semibold text-[var(--accent-foreground)]"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(8, Math.round((day.count / maxWeekCount) * 120))}px` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {day.count > 0 ? day.count : ""}
                </motion.div>
                <span className="text-xs text-[var(--muted)]">{day.day}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function MemberLiveHistory({
  member,
  viewerRole,
  viewerUserId,
  viewerUserName,
  mode = "details",
  initialLiveData,
  initialLiveDataError = null,
  initialClubSlug,
}: {
  member: Student;
  viewerRole: PlatformRole | null;
  viewerUserId?: string | null;
  viewerUserName?: string | null;
  mode?: "details";
  initialLiveData?: MemberProfileLiveData | null;
  initialLiveDataError?: string | null;
  initialClubSlug?: string;
}) {
  void mode;
  const activeClub = useActiveClub();
  const resolvedClubSlug = activeClub?.slug ?? initialClubSlug;
  const hasInitialLiveData = Boolean(initialLiveData);
  const [checkIns, setCheckIns] = useState<CheckInRow[]>(() => initialLiveData?.checkIns ?? []);
  const [notes, setNotes] = useState<CoachNoteRow[]>(() => initialLiveData?.notes ?? []);
  const [promotions, setPromotions] = useState<PromotionRow[]>(() => initialLiveData?.promotions ?? []);
  const [goals, setGoals] = useState<GoalRow[]>(() => initialLiveData?.goals ?? []);
  const [classes, setClasses] = useState<ClassRow[]>(() => initialLiveData?.classes ?? []);
  const [loading, setLoading] = useState(!hasInitialLiveData && !initialLiveDataError);
  const [message, setMessage] = useState<string | null>(initialLiveDataError);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");
  const [editingNoteVisibility, setEditingNoteVisibility] = useState("staff");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalTitle, setEditingGoalTitle] = useState("");
  const [editingGoalStatus, setEditingGoalStatus] = useState("active");
  const [editingGoalTargetDate, setEditingGoalTargetDate] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalStatus, setGoalStatus] = useState("active");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  const canViewStaffHistory = viewerRole === "owner" || viewerRole === "admin" || viewerRole === "coach";
  const canCreateGoals = viewerRole === "owner" || viewerRole === "admin" || viewerRole === "coach";
  const canDeleteStaffHistory = viewerRole === "owner" || viewerRole === "admin";

  const classById = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);

  useEffect(() => {
    if (hasInitialLiveData && resolvedClubSlug === initialClubSlug) {
      setLoading(false);
      return;
    }

    let alive = true;
    const params = new URLSearchParams();
    if (resolvedClubSlug) params.set("club", resolvedClubSlug);
    params.set("memberId", member.id);

    const classParams = new URLSearchParams();
    if (resolvedClubSlug) classParams.set("club", resolvedClubSlug);

    setLoading(true);
    setMessage(null);

    Promise.all([
      fetch(`/api/check-ins?${params}`, { cache: "no-store" }).then((response) => readApiJson<CheckInsPayload>(response, "Could not load attendance.")),
      fetch(`/api/classes${classParams.size ? `?${classParams}` : ""}`, { cache: "no-store" }).then((response) => readApiJson<ClassesPayload>(response, "Could not load classes.")),
      canViewStaffHistory
        ? fetch(`/api/coach-notes?${params}`, { cache: "no-store" }).then((response) => readApiJson<CoachNotesPayload>(response, "Could not load coach notes."))
        : Promise.resolve({ notes: [] }),
      fetch(`/api/promotions?${params}`, { cache: "no-store" }).then((response) => readApiJson<PromotionsPayload>(response, "Could not load promotions.")),
      fetch(`/api/goals?${params}`, { cache: "no-store" }).then((response) => readApiJson<GoalsPayload>(response, "Could not load goals.")),
    ])
      .then(([checkInPayload, classPayload, notePayload, promotionPayload, goalPayload]) => {
        if (!alive) return;
        setCheckIns(checkInPayload.checkIns ?? []);
        setClasses(classPayload.classes ?? []);
        setNotes(notePayload.notes ?? []);
        setPromotions(promotionPayload.promotions ?? []);
        setGoals(goalPayload.goals ?? []);
      })
      .catch((error: Error) => {
        if (alive) setMessage(error.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [canViewStaffHistory, hasInitialLiveData, initialClubSlug, member.id, resolvedClubSlug]);

  async function deleteHistory(type: "check-in" | "note" | "promotion" | "goal", id: string) {
    setDeleting(`${type}:${id}`);
    setMessage(null);
    try {
      const response = await fetch(type === "check-in" ? "/api/check-ins" : type === "note" ? "/api/coach-notes" : type === "promotion" ? "/api/promotions" : "/api/goals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...(resolvedClubSlug ? { clubSlug: resolvedClubSlug } : {}) }),
      });
      const payload = await readApiJson<MutationPayload>(response, "Delete failed.");
      if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Delete failed.", payload.requestId));
      if (type === "check-in") setCheckIns((current) => current.filter((item) => item.id !== id));
      if (type === "note") setNotes((current) => current.filter((item) => item.id !== id));
      if (type === "promotion") setPromotions((current) => current.filter((item) => item.id !== id));
      if (type === "goal") setGoals((current) => current.filter((item) => item.id !== id));
      setMessage(type === "check-in" ? "Check-in removed." : type === "note" ? "Coach note deleted." : type === "promotion" ? "Promotion record deleted." : "Goal deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeleting(null);
    }
  }

  async function updateNote(id: string) {
    setDeleting(`note-edit:${id}`);
    setMessage(null);
    try {
      const response = await fetch("/api/coach-notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          body: editingNoteBody,
          visibility: editingNoteVisibility,
          ...(resolvedClubSlug ? { clubSlug: resolvedClubSlug } : {}),
        }),
      });
      const payload = await readApiJson<MutationPayload & { note?: CoachNoteRow }>(response, "Note update failed.");
      if (!payload.ok || !payload.note) throw new Error(formatApiError(payload.error ?? "Note update failed.", payload.requestId));
      setNotes((current) => current.map((item) => (item.id === id ? payload.note! : item)));
      setEditingNoteId(null);
      setEditingNoteBody("");
      setEditingNoteVisibility("staff");
      setMessage("Coach note updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Note update failed.");
    } finally {
      setDeleting(null);
    }
  }

  async function createGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!goalTitle.trim()) return;
    setSavingGoal(true);
    setMessage(null);
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          title: goalTitle,
          status: goalStatus,
          ...(goalTargetDate ? { targetDate: goalTargetDate } : {}),
          ...(resolvedClubSlug ? { clubSlug: resolvedClubSlug } : {}),
        }),
      });
      const payload = await readApiJson<MutationPayload & { goal?: GoalRow }>(response, "Goal creation failed.");
      if (!payload.ok || !payload.goal) throw new Error(formatApiError(payload.error ?? "Goal creation failed.", payload.requestId));
      setGoals((current) => [payload.goal!, ...current]);
      setGoalTitle("");
      setGoalStatus("active");
      setGoalTargetDate("");
      setMessage("Training goal created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Goal creation failed.");
    } finally {
      setSavingGoal(false);
    }
  }

  async function updateGoal(id: string) {
    if (!editingGoalTitle.trim()) return;
    setDeleting(`goal-edit:${id}`);
    setMessage(null);
    try {
      const response = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          memberId: member.id,
          title: editingGoalTitle,
          status: editingGoalStatus,
          ...(editingGoalTargetDate ? { targetDate: editingGoalTargetDate } : {}),
          ...(resolvedClubSlug ? { clubSlug: resolvedClubSlug } : {}),
        }),
      });
      const payload = await readApiJson<MutationPayload & { goal?: GoalRow }>(response, "Goal update failed.");
      if (!payload.ok || !payload.goal) throw new Error(formatApiError(payload.error ?? "Goal update failed.", payload.requestId));
      setGoals((current) => current.map((item) => (item.id === id ? payload.goal! : item)));
      setEditingGoalId(null);
      setEditingGoalTitle("");
      setEditingGoalStatus("active");
      setEditingGoalTargetDate("");
      setMessage("Training goal updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Goal update failed.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Attendance history</CardTitle>
            <CardKicker>Saved check-ins from classes</CardKicker>
          </div>
          <CalendarCheck2 size={18} className="text-[var(--accent)]" />
        </CardHeader>
        {loading ? (
          <HistoryLoading />
        ) : checkIns.length > 0 ? (
          <div className="space-y-2">
            {checkIns.slice(0, 8).map((item) => {
              const classItem = item.class ?? classById.get(item.class_id);
              return (
                <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{classItem?.name ?? "Class check-in"}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {classItem ? `${classItem.day} ${classItem.time} · ${classItem.coach}${classItem.mat ? ` · ${classItem.mat}` : ""}` : "Class details unavailable"}
                      </p>
                      {item.member?.name && item.member.name !== member.name && (
                        <p className="mt-1 text-xs text-[var(--muted)]">Member: {item.member.name}</p>
                      )}
                      {item.notes && <p className="mt-1 text-xs text-[var(--muted)]">{item.notes}</p>}
                      <p className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(item.checked_in_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="muted">{item.source}</Badge>
                      {canDeleteCheckInRow(item, classItem, viewerRole, viewerUserId, viewerUserName) && (
                        <Button type="button" variant="ghost" size="icon" disabled={deleting === `check-in:${item.id}`} onClick={() => deleteHistory("check-in", item.id)} aria-label="Remove check-in">
                          {deleting === `check-in:${item.id}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyHistory text="No check-ins saved yet." />
        )}
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Promotion history</CardTitle>
            <CardKicker>Stripes, belts, and milestones</CardKicker>
          </div>
          <Award size={18} className="text-[var(--accent)]" />
        </CardHeader>
        {loading ? (
          <HistoryLoading />
        ) : promotions.length > 0 ? (
          <div className="space-y-2">
            {promotions.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="accent">{item.type}</Badge>
                      {item.belt && <BeltPill belt={item.belt} stripes={item.stripes ?? 0} />}
                    </div>
                    <p className="mt-2 text-sm leading-5 text-[var(--foreground)]">{item.detail}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatDateTime(item.awarded_at)} · {item.awarded_by_name}
                    </p>
                  </div>
                  {canDeleteStaffHistory && (
                    <Button type="button" variant="ghost" size="icon" disabled={deleting === `promotion:${item.id}`} onClick={() => deleteHistory("promotion", item.id)} aria-label="Delete promotion">
                      {deleting === `promotion:${item.id}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyHistory text="No promotion records yet." />
        )}
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Training goals</CardTitle>
            <CardKicker>Member goals from Supabase</CardKicker>
          </div>
          <Target size={18} className="text-[var(--accent)]" />
        </CardHeader>
        {canCreateGoals && (
          <form onSubmit={createGoal} className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <input
              value={goalTitle}
              onChange={(event) => setGoalTitle(event.target.value)}
              maxLength={180}
              placeholder="Add training goal"
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
            />
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <select
                value={goalStatus}
                onChange={(event) => setGoalStatus(event.target.value)}
                className="h-10 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20 sm:w-32"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <input
                value={goalTargetDate}
                onChange={(event) => setGoalTargetDate(event.target.value)}
                type="date"
                className="h-10 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20 sm:min-w-36"
              />
              <Button type="submit" variant="primary" size="sm" className="h-10 gap-1.5 sm:ml-auto" disabled={!goalTitle.trim() || savingGoal}>
                {savingGoal ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Add
              </Button>
            </div>
          </form>
        )}
        {loading ? (
          <HistoryLoading />
        ) : goals.length > 0 ? (
          <div className="space-y-2">
            {goals.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                {editingGoalId === item.id ? (
                  <div className="space-y-3">
                    <input
                      value={editingGoalTitle}
                      onChange={(event) => setEditingGoalTitle(event.target.value)}
                      maxLength={180}
                      className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <select
                          value={editingGoalStatus}
                          onChange={(event) => setEditingGoalStatus(event.target.value)}
                          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="completed">Completed</option>
                          <option value="archived">Archived</option>
                        </select>
                        <input
                          value={editingGoalTargetDate}
                          onChange={(event) => setEditingGoalTargetDate(event.target.value)}
                          type="date"
                          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingGoalId(null);
                            setEditingGoalTitle("");
                            setEditingGoalStatus("active");
                            setEditingGoalTargetDate("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="button" variant="primary" size="sm" disabled={!editingGoalTitle.trim() || deleting === `goal-edit:${item.id}`} onClick={() => updateGoal(item.id)}>
                          {deleting === `goal-edit:${item.id}` ? <Loader2 size={15} className="animate-spin" /> : <Pencil size={15} />}
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={item.status === "completed" ? "success" : item.status === "active" ? "accent" : "muted"}>{item.status}</Badge>
                        {item.target_date && <span className="text-xs text-[var(--muted)]">Target {formatShortDate(item.target_date)}</span>}
                      </div>
                      <p className="mt-2 text-sm leading-5 text-[var(--foreground)]">{item.title}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {item.completed_at ? `Completed ${formatDateTime(item.completed_at)}` : `Created ${formatDateTime(item.created_at)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {canCreateGoals && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingGoalId(item.id);
                            setEditingGoalTitle(item.title);
                            setEditingGoalStatus(item.status);
                            setEditingGoalTargetDate(item.target_date?.slice(0, 10) ?? "");
                          }}
                          aria-label="Edit goal"
                        >
                          <Pencil size={15} />
                        </Button>
                      )}
                      {canDeleteStaffHistory && (
                        <Button type="button" variant="ghost" size="icon" disabled={deleting === `goal:${item.id}`} onClick={() => deleteHistory("goal", item.id)} aria-label="Delete goal">
                          {deleting === `goal:${item.id}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyHistory text="No training goals saved yet." />
        )}
      </Card>

      {canViewStaffHistory && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Live coach notes</CardTitle>
              <CardKicker>Supabase staff notes</CardKicker>
            </div>
            <MessageSquarePlus size={18} className="text-[var(--accent)]" />
          </CardHeader>
          {loading ? (
            <HistoryLoading />
          ) : notes.length > 0 ? (
            <div className="space-y-2">
              {notes.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  {editingNoteId === item.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingNoteBody}
                        onChange={(event) => setEditingNoteBody(event.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
                      />
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <select
                          value={editingNoteVisibility}
                          onChange={(event) => setEditingNoteVisibility(event.target.value)}
                          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
                        >
                          <option value="staff">Staff</option>
                          <option value="private">Private</option>
                        </select>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingNoteId(null);
                              setEditingNoteBody("");
                              setEditingNoteVisibility("staff");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="button" variant="primary" size="sm" disabled={!editingNoteBody.trim() || deleting === `note-edit:${item.id}`} onClick={() => updateNote(item.id)}>
                            {deleting === `note-edit:${item.id}` ? <Loader2 size={15} className="animate-spin" /> : <Pencil size={15} />}
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="muted">{item.visibility}</Badge>
                          <p className="text-xs text-[var(--muted)]">{item.coach_name}</p>
                        </div>
                        <p className="mt-2 text-sm leading-5 text-[var(--foreground)]">{item.body}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(item.created_at)}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {canEditCoachNoteRow(item, viewerRole, viewerUserId) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingNoteId(item.id);
                              setEditingNoteBody(item.body);
                              setEditingNoteVisibility(item.visibility);
                            }}
                            aria-label="Edit note"
                          >
                            <Pencil size={15} />
                          </Button>
                        )}
                        {canDeleteStaffHistory && (
                          <Button type="button" variant="ghost" size="icon" disabled={deleting === `note:${item.id}`} onClick={() => deleteHistory("note", item.id)} aria-label="Delete note">
                            {deleting === `note:${item.id}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyHistory text="No coach notes saved yet." />
          )}
        </Card>
      )}

      {message && (
        <div className="xl:col-span-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
          {message}
        </div>
      )}
    </div>
  );
}

function HistoryLoading() {
  return (
    <div className="grid min-h-28 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
      <Loader2 size={18} className="animate-spin" />
    </div>
  );
}

function EmptyHistory({ text }: { text: string }) {
  return <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-8 text-center text-sm text-[var(--muted)]">{text}</div>;
}

function canDeleteCheckInRow(
  row: CheckInRow,
  classRow: ClassRow | undefined | null,
  viewerRole: PlatformRole | null,
  viewerUserId?: string | null,
  viewerUserName?: string | null,
) {
  if (viewerRole === "owner" || viewerRole === "admin") return true;
  if (viewerRole !== "coach" || !viewerUserId) return false;
  if (row.checked_in_by !== viewerUserId || row.checked_in_date !== getTodayDate()) return false;
  if (!classRow) return false;
  if (classRow.userId) return classRow.userId === viewerUserId;
  return Boolean(viewerUserName && normalizeProfileValue(classRow.coach) === normalizeProfileValue(viewerUserName));
}

function canEditCoachNoteRow(row: CoachNoteRow, viewerRole: PlatformRole | null, viewerUserId?: string | null) {
  if (viewerRole === "owner" || viewerRole === "admin") return true;
  if (viewerRole !== "coach" || !viewerUserId) return false;
  return row.coach_user_id === viewerUserId;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeProfileValue(value: string) {
  return value.trim().toLowerCase();
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function buildWeeklyAttendance(checkIns: CheckInRow[]) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = new Map(labels.map((label) => [label, 0]));
  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  for (const checkIn of checkIns) {
    const date = new Date(checkIn.checked_in_at);
    if (Number.isNaN(date.getTime())) continue;
    if (date < weekStart || date >= weekEnd) continue;
    const label = labels[(date.getDay() + 6) % 7];
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return labels.map((day) => ({ day, count: counts.get(day) ?? 0 }));
}

function startOfWeek(date: Date) {
  const value = new Date(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  value.setHours(0, 0, 0, 0);
  return value;
}
