import { setAuthCookies } from "@/lib/auth-cookies";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { recordAuthFailure } from "@/lib/auth-observability";
import { isProductionRuntime } from "@/lib/auth-mode";
import { getPasswordError } from "@/lib/auth-validation";
import { getAuthUser, updatePassword } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const accessToken = typeof payload.accessToken === "string" ? payload.accessToken : "";
  const refreshToken = typeof payload.refreshToken === "string" ? payload.refreshToken : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const expiresIn = typeof payload.expiresIn === "number" && Number.isFinite(payload.expiresIn)
    ? Math.max(60, Math.floor(payload.expiresIn))
    : 60 * 60;

  if (!accessToken || !refreshToken) {
    return validationErrorJson("Auth tokens are missing.");
  }

  const passwordError = getPasswordError(password);
  if (passwordError) {
    return validationErrorJson(passwordError);
  }

  const authUser = await getAuthUser(accessToken);
  if (!authUser) {
    return noStoreJson({ ok: false, error: "Password reset link is invalid or expired." }, { status: 401 });
  }

  try {
    await updatePassword(accessToken, password);
  } catch (error) {
    return authFailureJson(error, getPasswordUpdateError(error), 400);
  }

  const response = noStoreJson({ ok: true, user: { id: authUser.id, email: authUser.email } });
  setAuthCookies(response, {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
  });
  return response;
}

function authFailureJson(error: unknown, fallback: string, status = 400) {
  const requestId = crypto.randomUUID();
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[grapply:auth:${requestId}]`, message);
  recordAuthFailure({ requestId, message, status, action: "update-password" });
  const response = noStoreJson(
    {
      ok: false,
      error: isProductionRuntime() ? fallback : getPasswordUpdateError(error),
      requestId,
    },
    { status },
  );
  response.headers.set("X-Request-Id", requestId);
  response.headers.set("X-Grapply-Error-Source", "auth");
  return response;
}

function getPasswordUpdateError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Cannot reach Supabase") ? "Grapply cannot reach Supabase Auth right now." : "Password update failed.";
}
