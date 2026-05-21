"use client";

import { FadeIn, HoverLift, Stagger, StaggerItem } from "@/components/motion/motion";
import { Specimen } from "@/components/ui-lab/specimen";

export default function UiMotionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Motion</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">One primitive per specimen — reload page to replay enter animations.</p>
      </div>

      <Specimen title="FadeIn" importPath="@/components/motion/motion · FadeIn">
        <FadeIn className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-sm">
          FadeIn content
        </FadeIn>
      </Specimen>

      <Specimen title="HoverLift" importPath="@/components/motion/motion · HoverLift">
        <HoverLift className="cursor-default rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-sm">
          Hover me
        </HoverLift>
      </Specimen>

      <Specimen title="Stagger + StaggerItem" importPath="Stagger wraps StaggerItem children" canvasClassName="block w-full max-w-sm">
        <Stagger className="flex flex-col gap-2">
          {["Item 1", "Item 2", "Item 3"].map((label) => (
            <StaggerItem key={label}>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm">{label}</div>
            </StaggerItem>
          ))}
        </Stagger>
      </Specimen>
    </div>
  );
}
