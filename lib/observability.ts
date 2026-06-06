import { isSupabaseConfigured, insertRow } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

type ErrorEventInput = {
  requestId: string;
  clubId?: string | null;
  source: string;
  message: string;
  severity?: "error" | "warning" | "info";
  metadata?: Record<string, unknown>;
};

export function recordErrorEvent(input: ErrorEventInput) {
  if (!isSupabaseConfigured()) return;

  void insertRow("app_error_events", {
    club_id: input.clubId ?? null,
    request_id: input.requestId,
    source: input.source,
    severity: input.severity ?? "error",
    message: input.message.slice(0, 4000),
    metadata: sanitizeMetadata(input.metadata ?? {}),
  }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[grapply:observability:${input.requestId}]`, message);
  });
}

function sanitizeMetadata(metadata: Record<string, unknown>): Json {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toJsonValue(value)]),
  );
}

function toJsonValue(value: unknown): Json {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (typeof value === "object") {
    return sanitizeMetadata(value as Record<string, unknown>);
  }
  return String(value);
}
