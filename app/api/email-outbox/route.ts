import { apiSupabaseError, requireApiRole } from "@/lib/api-access";
import { noStoreJson, readJsonObject } from "@/lib/api-json";
import { getBackendClubId } from "@/lib/backend";
import { deliverEmail, isEmailDeliveryConfigured } from "@/lib/email/delivery";
import { isSupabaseConfigured, selectRows, updateRows } from "@/lib/supabase/server";
import type { TableRow } from "@/lib/supabase/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiRole(["owner", "admin"], searchParams.get("club"));
  if (access.error) return access.error;

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
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  if (!isSupabaseConfigured()) {
    return noStoreJson({ ok: false, error: "Email outbox requires Supabase." }, { status: 500 });
  }

  if (!isEmailDeliveryConfigured()) {
    return noStoreJson({ ok: false, error: "Email delivery is not configured. Add RESEND_API_KEY before sending queued emails." }, { status: 503 });
  }

  let clubId: string | null = null;
  try {
    clubId = await getBackendClubId(access.session.activeClub.slug);
    if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });

    const emailId = typeof payload.id === "string" && payload.id.trim() ? payload.id.trim() : null;
    const limit = getSendLimit(payload.limit);
    const query = emailId
      ? `select=*&club_id=eq.${clubId}&id=eq.${encodeURIComponent(emailId)}&status=in.(pending,failed)&limit=1`
      : `select=*&club_id=eq.${clubId}&status=in.(pending,failed)&order=created_at.asc&limit=${limit}`;
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

function getSendLimit(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) return 10;
  return Math.max(1, Math.min(25, value));
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
