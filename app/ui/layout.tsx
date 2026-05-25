import { UiLabShell } from "@/components/ui-lab/ui-lab-shell";

export const metadata = {
  title: "UI Lab · Grapply",
  robots: { index: false, follow: false },
};

export default function UiLabLayout({ children }: { children: React.ReactNode }) {
  return <UiLabShell>{children}</UiLabShell>;
}
