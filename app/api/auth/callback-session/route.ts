import { setAuthCookies } from "@/lib/auth-cookies";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getAuthUser } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const accessToken = typeof payload.accessToken === "string" ? payload.accessToken : "";
  const refreshToken = typeof payload.refreshToken === "string" ? payload.refreshToken : "";
  const expiresIn = typeof payload.expiresIn === "number" && Number.isFinite(payload.expiresIn)
    ? Math.max(60, Math.floor(payload.expiresIn))
    : 60 * 60;

  if (!accessToken || !refreshToken) {
    return validationErrorJson("Auth tokens are missing.");
  }

  const authUser = await getAuthUser(accessToken).catch(() => null);
  if (!authUser) {
    return noStoreJson({ ok: false, error: "Auth link is invalid or expired." }, { status: 401 });
  }

  const response = noStoreJson({ ok: true, user: { id: authUser.id, email: authUser.email } });
  setAuthCookies(response, {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
  });
  return response;
}
