import { Label } from "@/components/ui/label";
import { Specimen } from "@/components/ui-lab/specimen";

export default function UiLabelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Label</h1>
      </div>

      <Specimen title="Standalone" importPath="@/components/ui/label">
        <Label>Academy name</Label>
      </Specimen>

      <Specimen title="With control (pattern)" subtitle="Label wraps or htmlFor pairs with Input">
        <Label className="flex w-full max-w-sm flex-col gap-2">
          <span>Member name</span>
          <span className="rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)]">
            ← Input sits here in product
          </span>
        </Label>
      </Specimen>
    </div>
  );
}
