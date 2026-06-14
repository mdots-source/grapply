import { apiSupabaseError, requireApiRole, requireSupabaseBackendData } from "@/lib/api-access";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getBackendClubId } from "@/lib/backend";
import { deliverEmail, isEmailDeliveryConfigured } from "@/lib/email/delivery";
import { isSupabaseConfigured, selectRows, updateRows } from "@/lib/supabase/server";
import type { TableRow } from "@/lib/supabase/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiRole(["owner", "admin"], searchParams.get("club"));
  if (access.error) return access.error;
  const backendError = requireSupabaseBackendData("Email outbox");
  if (backendError) return backendError;

  if (!isSupabaseConfigured()) {
    return noStoreJson({ source: "mock", emails: [] });
  }

  let clubId: string | null = null;
  try {
    clubId = await getBackendClubId(access.session.activeClub.slug);
    if (!clubId) return noStoreJson({ source: "supabase", emails: [] });

    const rows = await selectRows(
      "email_outbox",
      `select=*&club_id=eq.${clubId}&order=created_at.desc&limit=25`,
    );

    return noStoreJson({ source: "supabase", deliveryConfigured: isEmailDeliveryConfigured(), emails: rows });
  } catch (error) {
    return apiSupabaseError(error, { clubId });
  }
}

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const forbidden = getForbiddenEmailOutboxField(payload);
  if (forbidden) return validationError(`${forbidden} cannot be changed from this action.`);

  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  if (!isSupabaseConfigured()) {
    return noStoreJson({ ok: false, error: "Email outbox requires Supabase." }, { status: 500 });
  }

  if (!isEmailDeliveryConfigured()) {
    return noStoreJson({ ok: false, error: "Email delivery is not configured. Add Resend env vars or SMTP/Gmail env vars before sending queued emails." }, { status: 503 });
  }

  let clubId: string | null = null;
  try {
    clubId = await getBackendClubId(access.session.activeClub.slug);
    if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

    const emailId = getEmailId(payload.id);
    if (emailId.error) return validationError(emailId.error);
    const limit = getSendLimit(payload.limit);
    if (limit.error) return validationError(limit.error);
    const query = emailId.value
      ? `select=*&club_id=eq.${clubId}&id=eq.${encodeURIComponent(emailId.value)}&status=in.(pending,failed)&limit=1`
      : `select=*&club_id=eq.${clubId}&status=in.(pending,failed)&order=created_at.asc&limit=${limit.value}`;
    const emails = await selectRows("email_outbox", query);

    const results = [];
    for (const email of emails) {
      const result = await deliverEmail(email);
      if (result.ok) {
        const [updated] = await updateRows(
          "email_outbox",
          {
            status: "sent",
            attempts: email.attempts + 1,
            provider_message_id: result.providerMessageId,
            sent_at: new Date().toISOString(),
          },
          `id=eq.${encodeURIComponent(email.id)}&club_id=eq.${clubId}`,
        );
        results.push({ id: email.id, ok: true, email: updated ?? email });
      } else {
        const [updated] = await updateRows(
          "email_outbox",
          {
            status: "failed",
            attempts: email.attempts + 1,
            metadata: appendDeliveryError(email, result.error),
            sent_at: null,
          },
          `id=eq.${encodeURIComponent(email.id)}&club_id=eq.${clubId}`,
        );
        results.push({ id: email.id, ok: false, error: result.error, email: updated ?? email });
      }
    }

    return noStoreJson({
      ok: true,
      source: "supabase",
      deliveryConfigured: true,
      sent: results.filter((item) => item.ok).length,
      failed: results.filter((item) => !item.ok).length,
      results,
    });
  } catch (error) {
    return apiSupabaseError(error, { clubId });
  }
}

type FieldResult<T> = { value: T; error?: never } | { value?: never; error: string };

function getEmailId(value: unknown): FieldResult<string | null> {
  if (value === undefined || value === null || value === "") return { value: null };
  if (typeof value !== "string" || !isUuid(value.trim())) return { error: "Email id must be a valid id." };
  return { value: value.trim() };
}

function getSendLimit(value: unknown): FieldResult<number> {
  if (value === undefined || value === null) return { value: 10 };
  if (typeof value !== "number" || !Number.isInteger(value)) return { error: "Email send limit must be a whole number." };
  return { value: Math.max(1, Math.min(25, value)) };
}

function validationError(error: string) {
  return validationErrorJson(error);
}

function getForbiddenEmailOutboxField(payload: Record<string, unknown>) {
  const labels: Record<string, string> = {
    attempts: "Email attempts",
    body: "Email body",
    clubId: "Email club",
    club_id: "Email club",
    createdAt: "Email creation time",
    created_at: "Email creation time",
    fromEmail: "Sender email",
    from_email: "Sender email",
    metadata: "Email metadata",
    providerMessageId: "Provider message id",
    provider_message_id: "Provider message id",
    sentAt: "Email sent time",
    sent_at: "Email sent time",
    status: "Email status",
    subject: "Email subject",
    template: "Email template",
    toEmail: "Recipient email",
    to_email: "Recipient email",
  };
  const field = Object.keys(labels).find((key) => payload[key] !== undefined);
  return field ? labels[field] : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function appendDeliveryError(email: TableRow<"email_outbox">, error: string) {
  const metadata = email.metadata && typeof email.metadata === "object" && !Array.isArray(email.metadata)
    ? email.metadata
    : {};
  return {
    ...metadata,
    lastDeliveryError: error,
    lastDeliveryAttemptAt: new Date().toISOString(),
  };
}
