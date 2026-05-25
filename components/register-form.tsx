"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Lock, Mail, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [academyName, setAcademyName] = useState("Grapply Jiu-Jitsu Academy");
  const [ownerName, setOwnerName] = useState("Academy Owner");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("San Diego, CA");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ academyName, ownerName, ownerEmail, password, location }),
          });
          const payload = (await response.json()) as { ok?: boolean; user?: { id: string }; error?: string };
          if (!response.ok || !payload.ok || !payload.user?.id) {
            throw new Error(payload.error ?? "Registration failed.");
          }
          router.push(`/clubs?user=${encodeURIComponent(payload.user.id)}`);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Registration failed.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="academy">Academy name</Label>
        <div className="relative">
          <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input id="academy" className="pl-9" value={academyName} onChange={(event) => setAcademyName(event.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="owner-name">Owner name</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input id="owner-name" className="pl-9" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="owner">Owner email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input id="owner" className="pl-9" placeholder="owner@academy.com" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} type="email" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input id="register-password" className="pl-9" value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={6} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input id="city" className="pl-9" value={location} onChange={(event) => setLocation(event.target.value)} required />
        </div>
      </div>
      {error && <p className="rounded-lg border border-[var(--accent-coral)]/25 bg-[var(--accent-coral)]/10 p-3 text-xs text-[var(--foreground)]">{error}</p>}
      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading && <Loader2 size={16} className="animate-spin" />}
        Create workspace
      </Button>
    </form>
  );
}
