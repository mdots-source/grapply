import { Input } from "@/components/ui/input";
import { Specimen } from "@/components/ui-lab/specimen";

export default function UiInputPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Input</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">States shown separately.</p>
      </div>

      <Specimen title="Default" importPath="@/components/ui/input">
        <Input className="max-w-sm" placeholder="Member name" />
      </Specimen>

      <Specimen title="With value" importPath="@/components/ui/input">
        <Input className="max-w-sm" defaultValue="Maya Ribeiro" />
      </Specimen>

      <Specimen title="Disabled" importPath="@/components/ui/input · disabled">
        <Input className="max-w-sm" placeholder="Unavailable" disabled />
      </Specimen>
    </div>
  );
}
