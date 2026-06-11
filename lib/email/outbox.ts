import { deliverEmail, isEmailDeliveryConfigured } from "@/lib/email/delivery";
import { insertRow, isSupabaseConfigured, updateRows } from "@/lib/supabase/server";
import type { Json, TableRow } from "@/lib/supabase/types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedTemplates = new Set([
  "club_invite",
  "invite_welcome",
  "invite_accepted_notification",
  "owner_welcome",
  "magic_link",
  "password_reset",
  "coach_notification",
  "admin_notification",
  "demo_request",
]);

type QueueEmailInput = {
  clubId?: string | null;
  toEmail: string;
  template: string;
  subject: string;
  body: string;
  metadata?: Json;
};

export async function queueEmail(input: QueueEmailInput) {
  const toEmail = input.toEmail.trim().toLowerCase();
  if (!emailPattern.test(toEmail)) {
    console.error("[grapply:email:queue]", "Invalid email recipient.");
    return null;
  }

  if (!allowedTemplates.has(input.template)) {
    console.error("[grapply:email:queue]", `Unsupported email template: ${input.template}`);
    return null;
  }

  if (!isSupabaseConfigured()) {
    console.info("[grapply:email:mock]", {
      toEmail,
      template: input.template,
      subject: input.subject,
    });
    return null;
  }

  try {
    const queued = await insertRow("email_outbox", {
      club_id: input.clubId ?? null,
      to_email: toEmail,
      template: input.template,
      subject: input.subject,
      body: input.body,
      attempts: 0,
      metadata: input.metadata ?? {},
    });
    return await deliverQueuedEmailIfConfigured(queued);
  } catch (error) {
    console.error("[grapply:email:queue]", error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function deliverQueuedEmailIfConfigured(row: TableRow<"email_outbox">) {
  if (!isEmailDeliveryConfigured()) return row;

  const result = await deliverEmail(row);
  if (result.ok) {
    const [updated] = await updateRows(
      "email_outbox",
      {
        status: "sent",
        attempts: row.attempts + 1,
        provider_message_id: result.providerMessageId,
        sent_at: new Date().toISOString(),
      },
      `id=eq.${encodeURIComponent(row.id)}`,
    );
    return updated ?? row;
  }

  const [updated] = await updateRows(
    "email_outbox",
    {
      status: "failed",
      attempts: row.attempts + 1,
      metadata: appendDeliveryError(row, result.error),
      sent_at: null,
    },
    `id=eq.${encodeURIComponent(row.id)}`,
  );
  return updated ?? row;
}

function appendDeliveryError(row: TableRow<"email_outbox">, error: string) {
  const metadata = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? row.metadata
    : {};
  return {
    ...metadata,
    lastDeliveryError: error,
    lastDeliveryAttemptAt: new Date().toISOString(),
  };
}

export function inviteEmailBody(input: {
  clubName: string;
  role: string;
  inviteUrl: string;
}) {
  return [
    `You have been invited to join ${input.clubName} on Grapply as ${input.role}.`,
    "",
    "Open this link to create your account and join the academy workspace:",
    input.inviteUrl,
    "",
    "This invite expires in 14 days.",
  ].join("\n");
}

export function welcomeEmailBody(input: {
  clubName: string;
  destinationUrl: string;
}) {
  return [
    `Welcome to ${input.clubName} on Grapply.`,
    "",
    "Your academy workspace is ready here:",
    input.destinationUrl,
  ].join("\n");
}

export function inviteAcceptedEmailBody(input: {
  clubName: string;
  invitedName: string;
  invitedEmail: string;
  role: string;
  destinationUrl: string;
}) {
  return [
    `${input.invitedName} (${input.invitedEmail}) accepted the invitation to ${input.clubName}.`,
    "",
    `Assigned role: ${input.role}.`,
    "",
    "Open the team page here:",
    input.destinationUrl,
  ].join("\n");
}

export function magicLinkEmailBody(input: {
  destinationUrl: string;
}) {
  return [
    "Sign in to Grapply with this secure link:",
    input.destinationUrl,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
}

export function passwordResetEmailBody(input: {
  destinationUrl: string;
}) {
  return [
    "Reset your Grapply password with this secure link:",
    input.destinationUrl,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
}

export function staffNotificationEmailBody(input: {
  title: string;
  message: string;
  destinationUrl?: string;
}) {
  return [
    input.title,
    "",
    input.message,
    ...(input.destinationUrl ? ["", "Open in Grapply:", input.destinationUrl] : []),
  ].join("\n");
}
