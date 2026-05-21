import { Specimen } from "@/components/ui-lab/specimen";

const tokens: [string, string][] = [
  ["--background", "Page background"],
  ["--foreground", "Primary text"],
  ["--muted", "Secondary text"],
  ["--surface", "Raised surface"],
  ["--surface-hover", "Hover surface"],
  ["--border", "Borders"],
  ["--panel", "Sidebar / panels"],
  ["--accent", "Brand accent"],
  ["--accent-foreground", "Text on accent"],
  ["--accent-blue", "Info"],
  ["--accent-coral", "Alert"],
];

export default function UiTokensPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tokens</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">One token per specimen — toggle theme in the header.</p>
      </div>
      <div className="space-y-4">
        {tokens.map(([token, label]) => (
          <Specimen key={token} title={token} subtitle={label} importPath="var(...) in app/globals.css">
            <div className="flex w-full max-w-md items-center gap-4">
              <div
                className="size-16 shrink-0 rounded-lg border border-[var(--border)] shadow-sm"
                style={{ background: `var(${token})` }}
              />
              <code className="text-sm text-[var(--foreground)]">{token}</code>
            </div>
          </Specimen>
        ))}
      </div>
    </div>
  );
}
