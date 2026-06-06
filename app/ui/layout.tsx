import { notFound } from "next/navigation";
import { UiLabShell } from "@/components/ui-lab/ui-lab-shell";
import { isProductionRuntime } from "@/lib/auth-mode";

export const metadata = {
  title: "UI Lab · Grapply",
  robots: { index: false, follow: false },
};

export default function UiLabLayout({ children }: { children: React.ReactNode }) {
  if (isProductionRuntime()) notFound();

  return <UiLabShell>{children}</UiLabShell>;
}
