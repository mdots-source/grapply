import { Switch } from "@/components/ui/switch";
import { Specimen } from "@/components/ui-lab/specimen";

export default function UiSwitchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Switch</h1>
      </div>

      <Specimen title="Checked (default)" importPath="@/components/ui/switch">
        <Switch defaultChecked />
      </Specimen>

      <Specimen title="Unchecked" importPath="@/components/ui/switch · defaultChecked={false}">
        <Switch defaultChecked={false} />
      </Specimen>

      <Specimen title="Disabled" importPath="@/components/ui/switch · disabled">
        <Switch disabled />
      </Specimen>
    </div>
  );
}
