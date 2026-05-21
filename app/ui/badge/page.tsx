import { Badge } from "@/components/ui/badge";
import { Specimen } from "@/components/ui-lab/specimen";

const variants = ["default", "accent", "success", "muted"] as const;

export default function UiBadgePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Badge</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">One variant per specimen.</p>
      </div>

      {variants.map((variant) => (
        <Specimen
          key={variant}
          title={`variant="${variant}"`}
          importPath={`@/components/ui/badge · variant="${variant}"`}
        >
          <Badge variant={variant}>{variant}</Badge>
        </Specimen>
      ))}
    </div>
  );
}
