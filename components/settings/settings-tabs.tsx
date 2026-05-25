"use client";

import { useState } from "react";
import { Palette, Upload, Users } from "lucide-react";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { StravaConnectButton } from "@/components/strava-connect-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardKicker, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabKeys = ["brand", "appearance", "coaches", "tv", "integrations"] as const;

export function SettingsTabs() {
  const [tab, setTab] = useState<(typeof tabKeys)[number]>("appearance");

  return (
    <>
      <Tabs className="mb-5">
        <TabsList>
          {(
            [
              ["brand", "Brand"],
              ["appearance", "Appearance"],
              ["coaches", "Coaches"],
              ["tv", "TV Mode"],
              ["integrations", "Integrations"],
            ] as const
          ).map(([key, label]) => (
            <TabsTrigger key={key} active={tab === key} onClick={() => setTab(key)}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent />
      </Tabs>

      {tab === "appearance" && (
        <div className="max-w-xl">
          <AppearanceSettings />
        </div>
      )}

      {tab === "brand" && (
        <Card className="max-w-xl oss-hover-lift">
          <CardHeader>
            <div>
              <CardTitle>Academy Brand</CardTitle>
              <CardKicker>Logo, name, and primary color</CardKicker>
            </div>
            <Palette size={18} className="text-[var(--accent)]" />
          </CardHeader>
          <div className="grid size-24 place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--muted)]">
            Logo
          </div>
          <div className="mt-5 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="academy-name">Academy name</Label>
              <Input id="academy-name" defaultValue="Grapply Jiu-Jitsu Academy" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academy-city">Location</Label>
              <Input id="academy-city" defaultValue="San Diego, CA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mats">Mats</Label>
              <Input id="mats" defaultValue="Mat A, Mat B, Main Mat" />
            </div>
            <div className="flex gap-2">
              {["#7c3aed", "#0284c7", "#16a34a", "#e11d48"].map((color) => (
                <span key={color} className="size-9 rounded-lg border border-[var(--border)]" style={{ background: color }} />
              ))}
            </div>
            <Button variant="surface">
              <Upload size={16} /> Upload logo
            </Button>
          </div>
        </Card>
      )}

      {tab === "coaches" && (
        <Card className="max-w-xl oss-hover-lift">
          <CardHeader>
            <div>
              <CardTitle>Coaches</CardTitle>
              <CardKicker>Mock coach management</CardKicker>
            </div>
            <Users size={18} className="text-[var(--accent)]" />
          </CardHeader>
          {["Sofia Almeida", "Lina Okafor", "Noah Keller"].map((coach) => (
            <div key={coach} className="mb-3 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <span className="text-sm font-semibold text-[var(--foreground)]">{coach}</span>
              <Badge variant="accent">Coach</Badge>
            </div>
          ))}
        </Card>
      )}

      {tab === "tv" && (
        <Card className="max-w-3xl oss-hover-lift">
          <CardHeader>
            <div>
              <CardTitle>TV Mode</CardTitle>
              <CardKicker>Fullscreen academy display controls</CardKicker>
            </div>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Show active athletes", "Live check-in QR", "Rotating athlete cards", "Live activity ticker"].map((setting) => (
              <Label key={setting} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <span className="text-[var(--foreground)]">{setting}</span>
                <Switch defaultChecked />
              </Label>
            ))}
          </div>
        </Card>
      )}

      {tab === "integrations" && (
        <Card className="max-w-3xl oss-hover-lift">
          <CardHeader>
            <div>
              <CardTitle>Integrations</CardTitle>
              <CardKicker>Coming soon — connect your academy stack</CardKicker>
            </div>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { name: "Stripe", desc: "Memberships & billing" },
              { name: "Google Calendar", desc: "Class sync" },
              { name: "Strava", desc: "Athlete activity" },
              { name: "Slack / Discord", desc: "Team comms" },
              { name: "Apple Wallet", desc: "QR member pass" },
              { name: "Supabase", desc: "Database & auth" },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 opacity-80"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{item.name}</p>
                  <p className="text-xs text-[var(--muted)]">{item.desc}</p>
                </div>
                {item.name === "Strava" ? (
                  <StravaConnectButton href="/api/strava/connect?returnTo=/settings" size="sm">
                    Connect
                  </StravaConnectButton>
                ) : (
                  <Badge variant="muted">Soon</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
