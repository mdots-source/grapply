"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Medal, NotebookPen, UserPlus } from "lucide-react";
import { BeltPill } from "@/components/belt-pill";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { beltStyles, type Belt, type MemberRole, type Student } from "@/data/academy";

type DrawerMode = "view" | "add";

type MemberDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DrawerMode;
  member?: Student | null;
  onAddMember?: (member: Student) => void;
};

const beltOptions: Belt[] = ["white", "blue", "purple", "brown", "black"];

const emptyForm = {
  name: "",
  belt: "white" as Belt,
  role: "member" as MemberRole,
  status: "active" as Student["status"],
};

type ClassOption = {
  id: string;
  name: string;
  coach: string;
  day: string;
  time: string;
  mat: string;
};

export function MemberDrawer({ open, onOpenChange, mode, member, onAddMember }: MemberDrawerProps) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (mode === "add" && open) setForm(emptyForm);
  }, [mode, open]);

  const close = () => onOpenChange(false);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {mode === "view" && member ? (
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
                <Badge variant={member.role === "coach" ? "accent" : "default"} className="capitalize">
                  {member.role}
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

          <MemberActions member={member} />

          <div className="mt-auto flex flex-col gap-2 pt-8">
            <Button variant="primary" className="w-full" asChild>
              <Link href={`/members/${member.id}`}>
                Open full profile <ExternalLink size={16} />
              </Link>
            </Button>
            <Button variant="ghost" className="w-full" onClick={close}>
              Close
            </Button>
          </div>
        </>
      ) : (
        <>
          <DrawerHeader onClose={close}>
            <div className="grid size-10 place-items-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]">
              <UserPlus size={18} />
            </div>
            <DrawerTitle>Add member</DrawerTitle>
            <DrawerDescription>Add a new person to the academy roster.</DrawerDescription>
          </DrawerHeader>

          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!form.name.trim() || !onAddMember) return;
              const id = `st-${crypto.randomUUID().slice(0, 8)}`;
              onAddMember({
                id,
                name: form.name.trim(),
                belt: form.belt,
                stripes: 0,
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
          >
            <div className="space-y-2">
              <Label htmlFor="member-name">Full name</Label>
              <Input
                id="member-name"
                value={form.name}
                onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
                placeholder="Alex Rivera"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-belt">Belt</Label>
              <select
                id="member-belt"
                value={form.belt}
                onChange={(event) => setForm((value) => ({ ...value, belt: event.target.value as Belt }))}
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
              <Label htmlFor="member-role">Role</Label>
              <select
                id="member-role"
                value={form.role}
                onChange={(event) => setForm((value) => ({ ...value, role: event.target.value as MemberRole }))}
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
                onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as Student["status"] }))}
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
                Save member
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={close}>
                Cancel
              </Button>
            </div>
          </form>
        </>
      )}
    </Drawer>
  );
}

function MemberActions({ member }: { member: Student }) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState("");
  const [note, setNote] = useState("Looked sharp in positional rounds.");
  const [promotionType, setPromotionType] = useState<"stripe" | "belt" | "milestone">("stripe");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/classes")
      .then((response) => response.json())
      .then((payload: { classes?: ClassOption[] }) => {
        if (!alive) return;
        const nextClasses = payload.classes ?? [];
        setClasses(nextClasses);
        setClassId((value) => value || nextClasses[0]?.id || "");
      })
      .catch(() => {
        if (alive) setMessage("Could not load classes.");
      });
    return () => {
      alive = false;
    };
  }, []);

  async function submitAction(action: "check-in" | "note" | "promotion") {
    setLoading(action);
    setMessage(null);
    try {
      const response = await fetch(action === "check-in" ? "/api/check-ins" : action === "note" ? "/api/coach-notes" : "/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload(action)),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Action failed.");
      setMessage(action === "check-in" ? "Check-in saved." : action === "note" ? "Coach note saved." : "Award saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setLoading(null);
    }
  }

  function getPayload(action: "check-in" | "note" | "promotion") {
    if (action === "check-in") {
      return {
        classId,
        memberId: member.id,
        source: "manual",
        notes: "Checked in from member drawer.",
      };
    }

    if (action === "note") {
      return {
        memberId: member.id,
        coachName: "Current coach",
        body: note,
        visibility: "staff",
      };
    }

    return {
      memberId: member.id,
      type: promotionType,
      awardedByName: "Current coach",
      belt: promotionType === "belt" ? member.belt : null,
      stripes: promotionType === "stripe" ? Math.min(member.stripes + 1, 4) : null,
      detail:
        promotionType === "stripe"
          ? `${member.name} earned the next stripe.`
          : promotionType === "belt"
            ? `${member.name} was awarded a belt promotion.`
            : `${member.name} hit a training milestone.`,
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

      <div className="space-y-2">
        <Label htmlFor="promotion-type">Award</Label>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <select
            id="promotion-type"
            value={promotionType}
            onChange={(event) => setPromotionType(event.target.value as "stripe" | "belt" | "milestone")}
            className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/20"
          >
            <option value="stripe" className="bg-[var(--panel-strong)] text-[var(--foreground)]">
              Stripe
            </option>
            <option value="belt" className="bg-[var(--panel-strong)] text-[var(--foreground)]">
              Belt
            </option>
            <option value="milestone" className="bg-[var(--panel-strong)] text-[var(--foreground)]">
              Milestone
            </option>
          </select>
          <Button type="button" variant="surface" disabled={loading === "promotion"} onClick={() => submitAction("promotion")}>
            {loading === "promotion" ? <Loader2 size={16} className="animate-spin" /> : <Medal size={16} />}
            Record
          </Button>
        </div>
      </div>

      {message && <p className="text-xs text-[var(--muted)]">{message}</p>}
    </div>
  );
}
