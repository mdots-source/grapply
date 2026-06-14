import { Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({
  returnTo = "/schedule",
  inviteToken,
  inviteEmail,
}: {
  returnTo?: string;
  inviteToken?: string;
  inviteEmail?: string;
}) {
  const isInviteFlow = Boolean(inviteToken);

  return (
    <form
      action="/api/auth/register"
      className="space-y-3"
      method="post"
    >
      <input type="hidden" name="returnTo" value={returnTo} />
      {inviteToken && <input type="hidden" name="inviteToken" value={inviteToken} />}
      <div className="space-y-2">
        <Label htmlFor="user-name">Full name</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input id="user-name" name="fullName" className="pl-9" placeholder="Sofia Almeida" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="user-email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input
            id="user-email"
            name="email"
            className="pl-9"
            defaultValue={inviteEmail ?? ""}
            placeholder="you@academy.com"
            type="email"
            readOnly={Boolean(inviteEmail)}
            required
          />
        </div>
        {inviteEmail && <p className="text-[11px] text-[var(--muted)]">This invite is locked to {inviteEmail}.</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input id="register-password" name="password" className="pl-9" type="password" minLength={6} required />
        </div>
      </div>
      <Button type="submit" variant="primary" className="w-full">
        {isInviteFlow ? "Join academy" : "Create account"}
      </Button>
    </form>
  );
}
