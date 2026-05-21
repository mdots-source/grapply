import { BeltPill } from "@/components/belt-pill";
import { Specimen } from "@/components/ui-lab/specimen";
import type { Belt } from "@/data/academy";

const belts: { belt: Belt; stripes: number }[] = [
  { belt: "white", stripes: 0 },
  { belt: "white", stripes: 3 },
  { belt: "blue", stripes: 2 },
  { belt: "purple", stripes: 1 },
  { belt: "brown", stripes: 0 },
  { belt: "black", stripes: 4 },
];

export default function UiBeltPillPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">BeltPill</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">One belt + stripe combo per specimen.</p>
      </div>

      {belts.map(({ belt, stripes }) => (
        <Specimen
          key={`${belt}-${stripes}`}
          title={`belt="${belt}" stripes={${stripes}}`}
          importPath="@/components/belt-pill"
        >
          <BeltPill belt={belt} stripes={stripes} />
        </Specimen>
      ))}
    </div>
  );
}
