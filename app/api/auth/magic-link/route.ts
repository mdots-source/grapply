import { isProductionRuntime } from "@/lib/auth-mode";
import { recordAuthFailure } from "@/lib/auth-observability";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getAuthEmailError, normalizeAuthEmail } from "@/lib/auth-validation";
import { isEmailDeliveryConfigured } from "@/lib/email/delivery";
import { magicLinkEmailBody, queueEmail } from "@/lib/email/outbox";
import { getRequestUrl } from "@/lib/request-origin";
import { generateAuthActionLink, sendMagicLinkEmail } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { normalizeWorkspaceReturnTo } from "@/lib/workspace-intent";

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const email = normalizeAuthEmail(payload.email);
  const returnTo = normalizeWorkspaceReturnTo(typeof payload.returnTo === "string" ? payload.returnTo : "");
  const inviteToken = typeof payload.inviteToken === "string" ? payload.inviteToken.trim() : "";
  const emailError = getAuthEmailError(email);

  if (emailError) {
    return validationErrorJson(emailError);
  }

  if (!isSupabaseConfigured()) {
    return authFailureJson("Supabase Auth is not configured.", "Supabase Auth is not configured.", 500);
  }

  const callbackUrl = getRequestUrl("/auth/callback", request);
  callbackUrl.searchParams.set("returnTo", returnTo);
  if (inviteToken) callbackUrl.searchParams.set("invite", inviteToken);

  try {
    if (isEmailDeliveryConfigured()) {
      const actionLink = await generateAuthActionLink({
        email,
        redirectTo: callbackUrl.toString(),
        type: "magiclink",
      });
      const queued = await queueEmail({
        toEmail: email,
        template: "magic_link",
        subject: "Sign in to Grapply",
        body: magicLinkEmailBody({ destinationUrl: actionLink }),
        metadata: { returnTo, inviteToken: inviteToken || undefined, delivery: "resend" },
      });
      if (!queued) throw new Error("Magic link email could not be queued.");
    } else {
      await sendMagicLinkEmail(email, callbackUrl.toString());
    }
    return noStoreJson({ ok: true });
  } catch (error) {
    if (isAccountEnumerationSafeNoop(error)) return noStoreJson({ ok: true });
    return authFailureJson(error, getAuthEmailSendError(error, "Magic link failed."), 400);
  }
}

function authFailureJson(error: unknown, fallback: string, status = 400) {
  const requestId = crypto.randomUUID();
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[grapply:auth:${requestId}]`, message);
  recordAuthFailure({ requestId, message, status, action: "magic-link" });
  const response = noStoreJson(
    {
      ok: false,
      error: isProductionRuntime() ? fallback : getAuthEmailSendError(error, fallback),
      requestId,
    },
    { status },
  );
  response.headers.set("X-Request-Id", requestId);
  response.headers.set("X-Grapply-Error-Source", "auth");
  return response;
}

function isAccountEnumerationSafeNoop(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("not found") || message.includes("signup") || message.includes("registered");
}

function getAuthEmailSendError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("rate") || message.includes("429")) return "Too many requests. Wait a minute and try again.";
  if (message.includes("Cannot reach Supabase")) return "Grapply cannot reach Supabase Auth right now.";
  return fallback;
}
