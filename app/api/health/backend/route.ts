import { NextResponse } from "next/server";
import { isProductionRuntime } from "@/lib/auth-mode";
import { isEmailDeliveryConfigured } from "@/lib/email/delivery";
import { getStravaConfig, isStravaConfigured } from "@/lib/strava";
import { isSupabaseConfigured, selectRows } from "@/lib/supabase/server";
import type { TableName } from "@/lib/supabase/types";

const criticalTables = [
  { table: "academy_members", column: "id" },
  { table: "app_error_events", column: "id" },
  { table: "app_users", column: "id" },
  { table: "class_checkins", column: "id" },
  { table: "club_billing_subscriptions", column: "id" },
  { table: "club_classes", column: "id" },
  { table: "club_invites", column: "id" },
  { table: "club_memberships", column: "id" },
  { table: "club_settings", column: "club_id" },
  { table: "clubs", column: "id" },
  { table: "coach_notes", column: "id" },
  { table: "competitions", column: "id" },
  { table: "dashboard_events", column: "id" },
  { table: "email_outbox", column: "id" },
  { table: "member_goals", column: "id" },
  { table: "member_promotions", column: "id" },
  { table: "role_definitions", column: "role" },
  { table: "strava_activities", column: "id" },
  { table: "strava_connections", column: "id" },
  { table: "training_camps", column: "id" },
  { table: "training_posts", column: "id" },
] as const satisfies ReadonlyArray<{ table: TableName; column: string }>;

export async function GET() {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const production = isProductionRuntime();
  const supabaseConfigured = isSupabaseConfigured();
  const emailDeliveryConfigured = isEmailDeliveryConfigured();
  const stravaConfigured = isStravaConfigured();
  const appUrlConfigured = isAppUrlConfigured();
  const stravaConfig = getStravaConfig();
  const tableChecks = supabaseConfigured ? await Promise.all(criticalTables.map((check) => checkTable(check, requestId))) : [];
  const failedTables = tableChecks.filter((check) => check.status !== "ok");
  const criticalOk = supabaseConfigured && failedTables.length === 0 && appUrlConfigured;
  const warnings = [
    ...(!emailDeliveryConfigured ? ["emailDelivery:missing-config"] : []),
    ...(!stravaConfigured ? ["stravaOAuth:missing-config"] : []),
  ];
  const ok = criticalOk;
  const status = criticalOk ? (warnings.length ? "ok-with-warnings" : "ok") : supabaseConfigured ? "degraded" : "unconfigured";
  const latencyMs = Date.now() - startedAt;

  if (production) {
    return noStoreJson(
      {
        ok,
        status,
        requestId,
        runtime: "production",
        latencyMs,
        warnings,
        checks: {
          supabaseRest: supabaseConfigured ? (failedTables.length ? "degraded" : "ok") : "missing-config",
          emailDelivery: emailDeliveryConfigured ? "ok" : "missing-config",
          stravaOAuth: stravaConfigured ? "ok" : "missing-config",
          appUrl: appUrlConfigured ? "ok" : "missing-config",
        },
      },
      { status: criticalOk ? 200 : 503 },
      { requestId, source: "health" },
    );
  }

  return noStoreJson(
    {
      ok,
      status,
      requestId,
      runtime: "development",
      supabaseConfigured,
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasResendApiKey: emailDeliveryConfigured,
      hasResendFromEmail: Boolean(process.env.RESEND_FROM_EMAIL),
      hasStravaClientId: Boolean(stravaConfig.clientId),
      hasStravaClientSecret: Boolean(stravaConfig.clientSecret),
      hasStravaRedirectUri: Boolean(stravaConfig.redirectUri),
      hasPublicAppUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
      publicAppUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
      latencyMs,
      warnings,
      checks: {
        supabaseRest: supabaseConfigured ? (failedTables.length ? "degraded" : "ok") : "missing-config",
        emailDelivery: emailDeliveryConfigured ? "ok" : "missing-config",
        stravaOAuth: stravaConfigured ? "ok" : "missing-config",
        appUrl: appUrlConfigured ? "ok" : "missing-config",
        tables: tableChecks,
      },
    },
    { status: criticalOk ? 200 : 503 },
    { requestId, source: "health" },
  );
}

function isAppUrlConfigured() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return false;

  try {
    const parsed = new URL(appUrl);
    return parsed.protocol === "https:" && Boolean(parsed.host);
  } catch {
    return false;
  }
}

function noStoreJson(body: unknown, init?: ResponseInit, meta?: { requestId?: string; source?: string }) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  if (meta?.requestId) response.headers.set("X-Request-Id", meta.requestId);
  if (meta?.source) response.headers.set("X-Grapply-Error-Source", meta.source);
  return response;
}

async function checkTable(check: (typeof criticalTables)[number], requestId: string) {
  const startedAt = Date.now();

  try {
    await selectRows(check.table, `select=${check.column}&limit=1`);
    return {
      table: check.table,
      status: "ok" as const,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[grapply:health:${requestId}:${check.table}]`, message);
    return {
      table: check.table,
      status: "error" as const,
      latencyMs: Date.now() - startedAt,
      error: isProductionRuntime() ? "Unavailable" : message,
    };
  }
}
