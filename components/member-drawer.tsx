"use client";

import { useEffect, useState, type Dispatch, type FormEventHandler, type SetStateAction } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, Medal, NotebookPen, Pencil, Trash2, UserPlus } from "lucide-react";
import { BeltPill, formatBeltRank } from "@/components/belt-pill";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveClub } from "@/components/use-active-club";
import { beltStyles, type Belt, type MemberRole, type Student } from "@/data/academy";
import type { PlatformRole } from "@/data/platform";
import { formatApiError, readApiJson } from "@/lib/api-client";
import { getWorkspaceHref } from "@/lib/workspace-url";

type DrawerMode = "view" | "add";

type MemberDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DrawerMode;
  member?: Student | null;
  onAddMember?: (member: Student) => void;
  onUpdateMember?: (member: Student) => void;
  onLocalMemberChange?: (member: Student) => void;
  onDeleteMember?: (member: Student) => Promise<void> | void;
  canManageMembers?: boolean;
  canUseStaffActions?: boolean;
  canAwardPromotions?: boolean;
  canAwardBeltPromotions?: boolean;
  canDeleteMembers?: boolean;
  currentRole?: PlatformRole | null;
  currentUserId?: string | null;
  currentUserName?: string | null;
  clubSlug?: string;
};

const beltOptions: Belt[] = ["white", "blue", "purple", "brown", "black"];

function getNextBelt(belt: Belt) {
  const currentIndex = beltOptions.indexOf(belt);
  return currentIndex >= 0 ? beltOptions[currentIndex + 1] ?? null : null;
}

const emptyForm = {
  name: "",
  belt: "white" as Belt,
  stripes: 0,
  role: "member" as MemberRole,
  status: "active" as Student["status"],
};

type ClassOption = {
  id: string;
  userId?: string | null;
  name: string;
  coach: string;
  day: string;
  time: string;
  mat: string;
};

export function MemberDrawer({
  open,
  onOpenChange,
  mode,
  member,
  onAddMember,
  onUpdateMember,
  onLocalMemberChange,
  onDeleteMember,
  canManageMembers = false,
  canUseStaffActions = false,
  canAwardPromotions = false,
  canAwardBeltPromotions = false,
  canDeleteMembers = false,
  currentRole = null,
  currentUserId = null,
  currentUserName = null,
  clubSlug,
}: MemberDrawerProps) {
  const activeClub = useActiveClub();
  const resolvedClubSlug = activeClub?.slug ?? clubSlug;
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "add" && open) setForm(emptyForm);
  }, [mode, open]);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setDeleteConfirm(false);
      setDeleteError(null);
      setDeletePending(false);
    }
  }, [open]);

  const close = () => {
    setEditing(false);
    onOpenChange(false);
  };

  const startEditing = () => {
    if (!member) return;
    setForm({
      name: member.name,
      belt: member.belt,
      stripes: member.stripes,
      role: member.role,
      status: member.status,
    });
    setEditing(true);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {mode === "view" && member && !editing ? (
        <>
          <DrawerHeader onClose={close}>
            <DrawerTitle>Member profile</DrawerTitle>
            <DrawerDescription>Quick view from the academy roster.</DrawerDescription>
          </DrawerHeader>

          <div className="mt-6 flex items-center gap-4">
            <StudentAvatar student={member} size="lg" />
            <div>
              <h3 className="text-2xl font-semibold text-[var(--foreground)]">{member.name}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <BeltPill belt={member.belt} stripes={member.stripes} />
                <span className="text-xs font-medium text-[var(--muted)]">{formatBeltRank(member.belt, member.stripes)}</span>
                <Badge variant={member.role === "coach" ? "accent" : "default"} className="capitalize">
                  {member.role === "coach" ? "coach" : member.role}
                </Badge>
                <Badge variant={member.status === "active" ? "success" : "muted"}>{member.status}</Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              [member.totalHours.toLocaleString("en-US"), "Total mat hours"],
              [member.points, "Points"],
              [`${member.wins}-${member.losses}`, "Record"],
              [member.lastSeen, "Last seen"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-xl font-semibold text-[var(--accent)]">{value}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{label}</p>
              </div>
            ))}
          </div>

          {canUseStaffActions && (
            <MemberActions
              member={member}
              canAwardPromotions={canAwardPromotions}
              canAwardBeltPromotions={canAwardBeltPromotions}
              onLocalMemberChange={onLocalMemberChange}
              currentRole={currentRole}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              clubSlug={resolvedClubSlug}
            />
          )}

          <div className="mt-auto flex flex-col gap-2 pt-8">
            {deleteError && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle size={15} />
                <span>{deleteError}</span>
              </div>
            )}
            {canManageMembers && (
              <Button variant="surface" className="w-full" onClick={startEditing}>
                <Pencil size={16} />
                Edit member
              </Button>
            )}
            {canDeleteMembers && onDeleteMember && (
              <Button
                type="button"
                variant={deleteConfirm ? "primary" : "outline"}
                className="w-full"
                disabled={deletePending}
                onClick={async () => {
                  if (!deleteConfirm) {
                    setDeleteConfirm(true);
                    setDeleteError(null);
                    return;
                  }
                  setDeletePending(true);
                  setDeleteError(null);
                  try {
                    await onDeleteMember(member);
                    close();
                  } catch (error) {
                    setDeleteError(error instanceof Error ? error.message : "Could not delete member.");
                  } finally {
                    setDeletePending(false);
                  }
                }}
              >
                {deletePending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleteConfirm ? "Confirm delete" : "Delete member"}
              </Button>
            )}
            <Button variant="primary" className="w-full" asChild>
              <a href={getWorkspaceHref(`/members/${member.id}`, resolvedClubSlug)}>
                Open full profile <ExternalLink size={16} />
              </a>
            </Button>
            <Button variant="ghost" className="w-full" onClick={close}>
              Close
            </Button>
          </div>
        </>
      ) : mode === "view" && member && editing && canManageMembers ? (
        <>
          <DrawerHeader onClose={close}>
            <div className="grid size-10 place-items-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]">
              <Pencil size={18} />
            </div>
            <DrawerTitle>Edit member</DrawerTitle>
            <DrawerDescription>Update belt, stripes, role, and roster status.</DrawerDescription>
          </DrawerHeader>

          <MemberProfileForm
            form={form}
            submitLabel="Save changes"
            onChange={setForm}
            onCancel={() => setEditing(false)}
            onSubmit={(event) => {
              event.preventDefault();
              if (!form.name.trim()) return;
              onUpdateMember?.({
                ...member,
                name: form.name.trim(),
                belt: form.belt,
                stripes: form.stripes,
                role: form.role,
                status: form.status,
              });
              setEditing(false);
            }}
          />
        </>
      ) : canManageMembers ? (
        <>
          <DrawerHeader onClose={close}>
            <div className="grid size-10 place-items-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]">
              <UserPlus size={18} />
            </div>
            <DrawerTitle>Add member</DrawerTitle>
            <DrawerDescription>Add a new person to the academy roster.</DrawerDescription>
          </DrawerHeader>

          <MemberProfileForm
            form={form}
            submitLabel="Save member"
            onChange={setForm}
            onCancel={close}
            onSubmit={(event) => {
              event.preventDefault();
              if (!form.name.trim() || !onAddMember) return;
              const id = `st-${crypto.randomUUID().slice(0, 8)}`;
              onAddMember({
                id,
                name: form.name.trim(),
                belt: form.belt,
                stripes: form.stripes,
                role: form.role,
                status: form.status,
                totalHours: 0,
                classes30: 0,
                streak: 0,
                points: 0,
                wins: 0,
                losses: 0,
                lastSeen: "Just added",
                focus: "Onboarding",
              });
              close();
            }}
          />
        </>
      ) : null}
    </Drawer>
  );
}

function MemberProfileForm({
  form,
  submitLabel,
  onChange,
  onCancel,
  onSubmit,
}: {
  form: typeof emptyForm;
  submitLabel: string;
  onChange: Dispatch<SetStateAction<typeof emptyForm>>;
  onCancel: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form className="mt-6 space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="member-name">Full name</Label>
        <Input
          id="member-name"
          value={form.name}
          onChange={(event) => onChange((value) => ({ ...value, name: event.target.value }))}
          placeholder="Alex Rivera"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="member-belt">Belt</Label>
        <select
          id="member-belt"
          value={form.belt}
          onChange={(event) => onChange((value) => ({ ...value, belt: event.target.value as Belt }))}
          className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
        >
          {beltOptions.map((belt) => (
            <option key={belt} value={belt} className="bg-[var(--panel-strong)] text-[var(--foreground)]">
              {beltStyles[belt].label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="member-stripes">Stripes</Label>
        <select
          id="member-stripes"
          value={form.stripes}
          onChange={(event) => onChange((value) => ({ ...value, stripes: Number(event.target.value) }))}
          className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
        >
          {[0, 1, 2, 3, 4].map((stripe) => (
            <option key={stripe} value={stripe} className="bg-[var(--panel-strong)] text-[var(--foreground)]">
              {stripe} {stripe === 1 ? "stripe" : "stripes"}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
          <BeltPill belt={form.belt} stripes={form.stripes} />
          <span className="text-xs text-[var(--muted)]">{formatBeltRank(form.belt, form.stripes)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="member-role">Role</Label>
        <select
          id="member-role"
          value={form.role}
          onChange={(event) => onChange((value) => ({ ...value, role: event.target.value as MemberRole }))}
          className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
        >
          <option value="member" className="bg-[var(--panel-strong)] text-[var(--foreground)]">
            Member
          </option>
          <option value="coach" className="bg-[var(--panel-strong)] text-[var(--foreground)]">
            Coach
          </option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="member-status">Status</Label>
        <select
          id="member-status"
          value={form.status}
          onChange={(event) => onChange((value) => ({ ...value, status: event.target.value as Student["status"] }))}
          className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
        >
          <option value="active" className="bg-[var(--panel-strong)] text-[var(--foreground)]">
            Active
          </option>
          <option value="inactive" className="bg-[var(--panel-strong)] text-[var(--foreground)]">
            Inactive
          </option>
        </select>
      </div>

      <div className="flex flex-col gap-2 pt-4">
        <Button type="submit" variant="primary" className="w-full">
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function MemberActions({
  member,
  canAwardPromotions,
  canAwardBeltPromotions,
  onLocalMemberChange,
  currentRole,
  currentUserId,
  currentUserName,
  clubSlug,
}: {
  member: Student;
  canAwardPromotions: boolean;
  canAwardBeltPromotions: boolean;
  onLocalMemberChange?: (member: Student) => void;
  currentRole?: PlatformRole | null;
  currentUserId?: string | null;
  currentUserName?: string | null;
  clubSlug?: string;
}) {
  const activeClub = useActiveClub();
  const resolvedClubSlug = activeClub?.slug ?? clubSlug;
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState("");
  const [note, setNote] = useState("Looked sharp in positional rounds.");
  const [promotionType, setPromotionType] = useState<"stripe" | "belt" | "achievement">("stripe");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const nextBelt = getNextBelt(member.belt);
  const nextStripe = Math.min(member.stripes + 1, 4);
  const promotionBlocked =
    (promotionType === "stripe" && member.stripes >= 4) ||
    (promotionType === "belt" && (!canAwardBeltPromotions || !nextBelt));

  useEffect(() => {
    if (!canAwardBeltPromotions && promotionType === "belt") setPromotionType("stripe");
  }, [canAwardBeltPromotions, promotionType]);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams();
    if (resolvedClubSlug) params.set("club", resolvedClubSlug);
    fetch(`/api/classes${params.size ? `?${params}` : ""}`)
      .then((response) => readApiJson<{ classes?: ClassOption[]; error?: string; requestId?: string }>(response, "Could not load classes."))
      .then((payload: { classes?: ClassOption[] }) => {
        if (!alive) return;
        const nextClasses = (payload.classes ?? []).filter((item) =>
          canCheckInClass(item, currentRole, currentUserId, currentUserName),
        );
        setClasses(nextClasses);
        setClassId((value) => (nextClasses.some((item) => item.id === value) ? value : nextClasses[0]?.id || ""));
      })
      .catch(() => {
        if (alive) setMessage({ tone: "error", text: "Could not load classes." });
      });
    return () => {
      alive = false;
    };
  }, [currentRole, currentUserId, currentUserName, resolvedClubSlug]);

  async function submitAction(action: "check-in" | "note" | "promotion") {
    setLoading(action);
    setMessage(null);
    try {
      const response = await fetch(action === "check-in" ? "/api/check-ins" : action === "note" ? "/api/coach-notes" : "/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload(action)),
      });
      const payload = await readApiJson<{ ok?: boolean; member?: Student; error?: string; requestId?: string }>(response, "Action failed.");
      if (!payload.ok) throw new Error(formatApiError(payload.error ?? "Action failed.", payload.requestId));
      if (action === "promotion") syncPromotionLocally(payload.member);
      setMessage({
        tone: "success",
        text: action === "check-in" ? "Check-in saved." : action === "note" ? "Coach note saved." : "Award saved.",
      });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Action failed." });
    } finally {
      setLoading(null);
    }
  }

  function syncPromotionLocally(updatedMember?: Student) {
    if (!onLocalMemberChange) return;
    if (updatedMember) {
      onLocalMemberChange(updatedMember);
      return;
    }
    if (promotionType === "stripe" && member.stripes < 4) {
      onLocalMemberChange({ ...member, stripes: nextStripe });
    }
    if (promotionType === "belt" && nextBelt) {
      onLocalMemberChange({ ...member, belt: nextBelt, stripes: 0 });
    }
  }

  function getPayload(action: "check-in" | "note" | "promotion") {
    if (action === "check-in") {
      return {
        ...(resolvedClubSlug ? { clubSlug: resolvedClubSlug } : {}),
        classId,
        memberId: member.id,
        source: "manual",
        notes: "Checked in from member drawer.",
      };
    }

    if (action === "note") {
      return {
        ...(resolvedClubSlug ? { clubSlug: resolvedClubSlug } : {}),
        memberId: member.id,
        body: note,
        visibility: "staff",
      };
    }

    return {
      ...(resolvedClubSlug ? { clubSlug: resolvedClubSlug } : {}),
      memberId: member.id,
      type: promotionType,
      belt: promotionType === "belt" ? nextBelt : null,
      stripes: promotionType === "stripe" ? nextStripe : promotionType === "belt" ? 0 : null,
      detail:
        promotionType === "stripe"
          ? `${member.name} earned stripe ${nextStripe} on ${beltStyles[member.belt].label} belt.`
          : promotionType === "belt"
            ? `${member.name} was promoted from ${beltStyles[member.belt].label} to ${nextBelt ? beltStyles[nextBelt].label : "next"} belt.`
          : `${member.name} hit a training achievement.`,
    };
  }

  return (
    <div className="mt-6 space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
      <div>
        <p className="text-sm font-semibold text-[var(--foreground)]">Staff actions</p>
        <p className="mt-1 text-xs text-[var(--muted)]">Check in, leave a coach note, or record a promotion.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="member-class">Class check-in</Label>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <select
            id="member-class"
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
          >
            {classes.map((item) => (
              <option key={item.id} value={item.id} className="bg-[var(--panel-strong)] text-[var(--foreground)]">
                {item.day} {item.time} · {item.name}
              </option>
            ))}
          </select>
          <Button type="button" variant="surface" disabled={!classId || loading === "check-in"} onClick={() => submitAction("check-in")}>
            {loading === "check-in" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Check in
          </Button>
        </div>
        {classes.length === 0 && <p className="text-xs text-[var(--muted)]">Create a class in Schedule before checking members in.</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="coach-note">Coach note</Label>
        <textarea
          id="coach-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
        />
        <Button type="button" variant="surface" className="w-full" disabled={!note.trim() || loading === "note"} onClick={() => submitAction("note")}>
          {loading === "note" ? <Loader2 size={16} className="animate-spin" /> : <NotebookPen size={16} />}
          Save note
        </Button>
      </div>

      {canAwardPromotions && (
        <div className="space-y-2">
          <Label htmlFor="promotion-type">Award</Label>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <select
              id="promotion-type"
              value={promotionType}
              onChange={(event) => setPromotionType(event.target.value as "stripe" | "belt" | "achievement")}
              className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
            >
              <option value="stripe" className="bg-[var(--panel-strong)] text-[var(--foreground)]">
                Stripe{member.stripes < 4 ? ` (${nextStripe}/4)` : " (maxed)"}
              </option>
              {canAwardBeltPromotions && (
                <option value="belt" className="bg-[var(--panel-strong)] text-[var(--foreground)]">
                  Belt{nextBelt ? ` (${beltStyles[nextBelt].label})` : " (black belt)"}
                </option>
              )}
              <option value="achievement" className="bg-[var(--panel-strong)] text-[var(--foreground)]">
                Achievement
              </option>
            </select>
            <Button type="button" variant="surface" disabled={promotionBlocked || loading === "promotion"} onClick={() => submitAction("promotion")}>
              {loading === "promotion" ? <Loader2 size={16} className="animate-spin" /> : <Medal size={16} />}
              Record
            </Button>
          </div>
          {promotionBlocked && (
            <p className="text-xs text-[var(--muted)]">
              {promotionType === "stripe" ? "This member already has 4 stripes. Use a belt promotion instead." : "Black belt is the highest belt in this workflow."}
            </p>
          )}
        </div>
      )}

      {message && (
        <div
          className={
            message.tone === "success"
              ? "flex items-start gap-2 rounded-xl border border-[var(--status-success)]/25 bg-[var(--status-success)]/10 px-3 py-2 text-xs text-[var(--foreground)]"
              : "flex items-start gap-2 rounded-xl border border-[var(--status-danger)]/25 bg-[var(--status-danger)]/10 px-3 py-2 text-xs text-[var(--foreground)]"
          }
        >
          {message.tone === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}

function canCheckInClass(
  classItem: ClassOption,
  currentRole?: PlatformRole | null,
  currentUserId?: string | null,
  currentUserName?: string | null,
) {
  if (currentRole === "owner" || currentRole === "admin") return true;
  if (currentRole !== "coach") return false;
  if (classItem.userId) return Boolean(currentUserId && classItem.userId === currentUserId);
  return Boolean(currentUserName && normalizeDrawerValue(classItem.coach) === normalizeDrawerValue(currentUserName));
}

function normalizeDrawerValue(value: string) {
  return value.trim().toLowerCase();
}
