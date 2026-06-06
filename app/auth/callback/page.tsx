import { AuthShell } from "@/components/auth-shell";
import { AuthCallbackCard } from "@/components/auth-callback-card";
import { normalizeWorkspaceReturnTo } from "@/lib/workspace-intent";

export default async function AuthCallbackPage({ searchParams }: { searchParams?: Promise<{ returnTo?: string; mode?: string; invite?: string }> }) {
  const params = await searchParams;
  const returnTo = normalizeWorkspaceReturnTo(params?.returnTo);
  const mode = params?.mode === "recovery" ? "recovery" : "magic";
  const inviteToken = params?.invite ? String(params.invite).trim() : undefined;

  return (
    <AuthShell mode="login">
      <AuthCallbackCard mode={mode} returnTo={returnTo} inviteToken={inviteToken} />
    </AuthShell>
  );
}
