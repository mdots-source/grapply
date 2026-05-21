"use client";

import { Button } from "@/components/ui/button";
import { Specimen } from "@/components/ui-lab/specimen";

const variants = ["primary", "surface", "ghost", "outline"] as const;
const sizes = ["sm", "default", "lg", "icon"] as const;

export default function UiButtonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Button</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Each variant and size on its own specimen.</p>
      </div>

      {variants.map((variant) => (
        <Specimen
          key={variant}
          title={`variant="${variant}"`}
          subtitle="size=default"
          importPath={`@/components/ui/button · variant="${variant}"`}
        >
          <Button variant={variant}>Label</Button>
        </Specimen>
      ))}

      {sizes.map((size) => (
        <Specimen
          key={size}
          title={`size="${size}"`}
          subtitle='variant="surface"'
          importPath={`@/components/ui/button · size="${size}"`}
        >
          {size === "icon" ? (
            <Button variant="surface" size="icon" aria-label="Icon">
              +
            </Button>
          ) : (
            <Button variant="surface" size={size}>
              Label
            </Button>
          )}
        </Specimen>
      ))}
    </div>
  );
}
