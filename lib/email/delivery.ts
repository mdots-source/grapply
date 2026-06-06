import type { TableRow } from "@/lib/supabase/types";

type EmailOutboxRow = TableRow<"email_outbox">;

type EmailDeliveryResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; error: string };

export function isEmailDeliveryConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export async function deliverEmail(row: EmailOutboxRow): Promise<EmailDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Email delivery is not configured. Add RESEND_API_KEY to enable outbound email." };
  }

  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    return { ok: false, error: "Email delivery is not configured. Add RESEND_FROM_EMAIL with a verified sender." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: row.to_email,
      subject: row.subject,
      text: row.body,
    }),
    cache: "no-store",
  });

  const payload = await readResendPayload(response);
  if (!response.ok) {
    return { ok: false, error: payload.error ?? `Email provider rejected the message with status ${response.status}.` };
  }

  return { ok: true, providerMessageId: payload.id ?? `resend:${row.id}` };
}

async function readResendPayload(response: Response): Promise<{ id?: string; error?: string }> {
  try {
    const payload = (await response.json()) as { id?: unknown; message?: unknown; name?: unknown };
    const message = typeof payload.message === "string" ? payload.message : typeof payload.name === "string" ? payload.name : undefined;
    return {
      id: typeof payload.id === "string" ? payload.id : undefined,
      error: message,
    };
  } catch {
    return {};
  }
}
