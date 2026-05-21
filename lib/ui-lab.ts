export type UiLabEntry = {
  slug: string;
  title: string;
  description: string;
  importPath: string;
};

/** Dev-only UI lab routes — not linked from product navigation. */
export const uiLabEntries: UiLabEntry[] = [
  { slug: "tokens", title: "Tokens", description: "CSS semantic variables", importPath: "app/globals.css" },
  { slug: "button", title: "Button", description: "primary · surface · ghost · outline", importPath: "@/components/ui/button" },
  { slug: "badge", title: "Badge", description: "default · accent · success · muted", importPath: "@/components/ui/badge" },
  { slug: "belt-pill", title: "BeltPill", description: "BJJ belt + stripes", importPath: "@/components/belt-pill" },
  { slug: "input", title: "Input", description: "Text field", importPath: "@/components/ui/input" },
  { slug: "label", title: "Label", description: "Form label", importPath: "@/components/ui/label" },
  { slug: "switch", title: "Switch", description: "Toggle", importPath: "@/components/ui/switch" },
  { slug: "tabs", title: "Tabs", description: "TabsList · TabsTrigger · TabsContent", importPath: "@/components/ui/tabs" },
  { slug: "card", title: "Card", description: "Glass panel + header slots", importPath: "@/components/ui/card" },
  { slug: "motion", title: "Motion", description: "FadeIn · Stagger · HoverLift", importPath: "@/components/motion/motion" },
];

export function getUiLabEntry(slug: string) {
  return uiLabEntries.find((e) => e.slug === slug);
}
