import { NextResponse } from "next/server";
import { recordErrorEvent } from "@/lib/observability";

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const payload = await request.json().catch(() => ({}));
  return payload && typeof payload === "object" && !Array.isArray(payload) ? (payload as Record<string, unknown>) : {};
}

export function noStoreJson(body: unknown, init?: ResponseInit) {
  const status = init?.status;
  const shouldTagError = body && typeof body === "object" && !Array.isArray(body) && "ok" in body && (body as { ok?: unknown }).ok === false && "error" in body;
  const requestId = shouldTagError && !("requestId" in body) ? crypto.randomUUID() : null;
  const responseBody = requestId ? { ...(body as Record<string, unknown>), requestId } : body;
  const response = NextResponse.json(responseBody, init);
  response.headers.set("Cache-Control", "no-store");
  if (requestId) {
    const source = getErrorSource(status);
    console.warn(`[grapply:${source}:${requestId}]`, (body as { error?: unknown }).error);
    response.headers.set("X-Request-Id", requestId);
    response.headers.set("X-Grapply-Error-Source", source);
  }
  return response;
}

export function apiErrorJson(error: string, status: number, source: "validation" | "conflict" | "not-found" | "access" | "backend" = "validation", extra?: Record<string, unknown>) {
  const requestId = crypto.randomUUID();
  if (status >= 500) {
    console.error(`[grapply:${source}:${requestId}]`, error);
    recordErrorEvent({
      requestId,
      source,
      message: error,
      metadata: extra,
    });
  } else {
    console.warn(`[grapply:${source}:${requestId}]`, error);
  }

  const response = noStoreJson({ ok: false, error, requestId, ...extra }, { status });
  response.headers.set("X-Request-Id", requestId);
  response.headers.set("X-Grapply-Error-Source", source);
  return response;
}

export function validationErrorJson(error: string) {
  return apiErrorJson(error, 400, "validation");
}

function getErrorSource(status?: number) {
  if (status === 401 || status === 403) return "access";
  if (status === 404) return "not-found";
  if (status === 409) return "conflict";
  if (status && status >= 500) return "backend";
  return "validation";
}
