import { Card, CardContent, CardDescription, CardHeader, CardKicker, CardTitle } from "@/components/ui/card";
import { Specimen } from "@/components/ui-lab/specimen";

export default function UiCardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Card</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Each slot / composition isolated.</p>
      </div>

      <Specimen title="Card (empty shell)" importPath="@/components/ui/card">
        <Card className="w-full max-w-sm p-6 text-sm text-[var(--muted)]">Empty card body</Card>
      </Specimen>

      <Specimen title="CardHeader + CardTitle + CardKicker" importPath="CardHeader · CardTitle · CardKicker">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div>
              <CardTitle>Title</CardTitle>
              <CardKicker>Kicker / description line</CardKicker>
            </div>
          </CardHeader>
        </Card>
      </Specimen>

      <Specimen title="CardContent" importPath="CardContent">
        <Card className="w-full max-w-sm">
          <CardContent>Supporting text inside CardContent.</CardContent>
        </Card>
      </Specimen>

      <Specimen title="Full composition" importPath="Card + all slots">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </div>
          </CardHeader>
          <p className="text-3xl font-semibold text-[var(--accent)]">128</p>
        </Card>
      </Specimen>
    </div>
  );
}
