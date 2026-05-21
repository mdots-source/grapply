"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, UserPlus } from "lucide-react";
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
              [member.totalHours.toLocaleString(), "Total mat hours"],
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
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <UserPlus size={18} />
            </div>
            <DrawerTitle>Add member</DrawerTitle>
            <DrawerDescription>Create a new academy member for the roster prototype.</DrawerDescription>
          </DrawerHeader>

          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!form.name.trim() || !onAddMember) return;
              const id = `st-${Date.now()}`;
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
                className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/30"
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
                className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/30"
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
                className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/30"
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
