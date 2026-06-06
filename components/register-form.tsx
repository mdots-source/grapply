import { Building2, Lock, Mail, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({ returnTo = "/schedule", inviteToken }: { returnTo?: string; inviteToken?: string }) {
  const isInviteFlow = Boolean(inviteToken);

  return (
    <form
      action="/api/auth/register"
      className="space-y-3"
      method="post"
    >
      <input type="hidden" name="returnTo" value={returnTo} />
      {inviteToken && <input type="hidden" name="inviteToken" value={inviteToken} />}
      {!isInviteFlow && (
        <div className="space-y-2">
          <Label htmlFor="academy">Academy name</Label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
            <Input id="academy" name="academyName" className="pl-9" defaultValue="Grapply Jiu-Jitsu Academy" required />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="owner-name">{isInviteFlow ? "Your name" : "Owner name"}</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input id="owner-name" name="ownerName" className="pl-9" defaultValue="Academy Owner" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="owner">{isInviteFlow ? "Your email" : "Owner email"}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input id="owner" name="ownerEmail" className="pl-9" placeholder="owner@academy.com" type="email" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input id="register-password" name="password" className="pl-9" type="password" minLength={6} required />
        </div>
      </div>
      {!isInviteFlow && (
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
            <Input id="city" name="location" className="pl-9" defaultValue="San Diego, CA" required />
          </div>
        </div>
      )}
      <Button type="submit" variant="primary" className="w-full">
        {isInviteFlow ? "Join academy" : "Create workspace"}
      </Button>
    </form>
  );
}
