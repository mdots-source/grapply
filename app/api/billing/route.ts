import { apiSupabaseError, requireApiRole, requireSupabasePersistence } from "@/lib/api-access";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getBackendClubId } from "@/lib/backend";
import { isSupabaseConfigured, selectRows, upsertRow } from "@/lib/supabase/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const providerManagedFields = new Set([
  "plan",
  "status",
  "seats_included",
  "seatsIncluded",
  "member_limit",
  "memberLimit",
  "trial_ends_at",
  "trialEndsAt",
  "current_period_ends_at",
  "currentPeriodEndsAt",
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiRole(["owner"], searchParams.get("club"));
  if (access.error) return access.error;

  if (!isSupabaseConfigured()) {
    return noStoreJson({ source: "mock", subscription: getMockSubscription(access.session.activeClub.id) });
  }

  let clubId: string | null = null;
  try {
    clubId = await getBackendClubId(access.session.activeClub.slug);
    if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

    const rows = await selectRows("club_billing_subscriptions", `select=*&club_id=eq.${clubId}&limit=1`);
    return noStoreJson({
      source: "supabase",
      subscription: rows[0] ?? getDefaultSubscription(clubId, access.session.user.email),
    });
  } catch (error) {
    return apiSupabaseError(error, { clubId });
  }
}

export async function PATCH(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateBillingPayload(payload);
  if (validation.error) return validation.error;

  if (!isSupabaseConfigured()) {
    const persistenceError = requireSupabasePersistence("Billing settings");
    if (persistenceError) return persistenceError;

    return noStoreJson({ ok: true, source: "mock", subscription: { ...getMockSubscription(access.session.activeClub.id), ...validation.data } });
  }

  let clubId: string | null = null;
  try {
    clubId = await getBackendClubId(access.session.activeClub.slug);
    if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

    const row = await upsertRow(
      "club_billing_subscriptions",
      {
        club_id: clubId,
        ...validation.data,
      },
      "club_id",
    );

    return noStoreJson({ ok: true, source: "supabase", subscription: row });
  } catch (error) {
    const billingError = getBillingSupabaseValidationError(error);
    if (billingError) return billingError;
    return apiSupabaseError(error, { clubId });
  }
}

function getDefaultSubscription(clubId: string, email?: string | null) {
  return {
    id: "",
    club_id: clubId,
    plan: "starter",
    status: "trialing",
    billing_email: email ?? null,
    trial_ends_at: null,
    current_period_ends_at: null,
    seats_included: 6,
    member_limit: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function getMockSubscription(clubId: string) {
  return {
    ...getDefaultSubscription(clubId, "billing@grapply.app"),
    plan: "growth",
    status: "trialing",
    trial_ends_at: "2026-07-05T00:00:00Z",
    seats_included: 12,
    member_limit: 250,
  };
}

type BillingPayload = {
  billing_email?: string | null;
};

function validateBillingPayload(payload: Record<string, unknown>): { data: BillingPayload; error?: never } | { data?: never; error: Response } {
  const data: BillingPayload = {};

  const providerManagedField = Object.keys(payload).find((key) => providerManagedFields.has(key));
  if (providerManagedField) {
    return { error: validationError("Billing plan, status, and limits are managed manually by the Grapply team.") };
  }

  if (payload.billing_email !== undefined || payload.billingEmail !== undefined) {
    const value = payload.billing_email ?? payload.billingEmail;
    if (value === null || value === "") {
      data.billing_email = null;
    } else if (typeof value === "string" && emailPattern.test(value.trim().toLowerCase())) {
      data.billing_email = value.trim().toLowerCase();
    } else {
      return { error: validationError("Billing email is not valid.") };
    }
  }

  if (Object.keys(data).length === 0) return { error: validationError("No billing fields were provided.") };

  return { data };
}

function validationError(error: string) {
  return validationErrorJson(error);
}

function getBillingSupabaseValidationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("club_billing_subscriptions_billing_email_valid")) {
    return noStoreJson({ ok: false, error: "Billing email is not valid." }, { status: 400 });
  }
  if (message.includes("club_billing_subscriptions_limits_valid")) {
    return noStoreJson({ ok: false, error: "Billing member limit cannot be lower than included seats." }, { status: 400 });
  }

  return null;
}
