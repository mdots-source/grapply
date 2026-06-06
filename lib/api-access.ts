import { NextResponse } from "next/server";
import type { Club, PlatformRole } from "@/data/platform";
import { getCurrentSession } from "@/lib/auth-session";
import { isProductionRuntime } from "@/lib/auth-mode";
import { recordErrorEvent } from "@/lib/observability";

type ApiSession = NonNullable<Awaited<ReturnType<typeof getCurrentSession>>> & {
  activeClub: Club;
  activeRole: PlatformRole;
};

export async function requireApiRole(allowedRoles: PlatformRole[], clubSlug?: string | null) {
  const session = await getCurrentSession();

  if (!session) {
    return { error: apiAccessError("Login required.", 401) };
  }

  const membership = clubSlug
    ? session.memberships.find((item) => item.club.slug === clubSlug)
    : session.activeClub && session.activeRole
      ? session.memberships.find((item) => item.club.slug === session.activeClub?.slug)
      : null;

  if (!membership) {
    return { error: apiAccessError("Club access required.", 403) };
  }

  if (!allowedRoles.includes(membership.role)) {
    return { error: apiAccessError("You do not have permission for this action.", 403) };
  }

  return {
    session: {
      ...session,
      activeClub: membership.club,
      activeRole: membership.role,
    } as ApiSession,
  };
}

export async function requireApiAccess(clubSlug?: string | null) {
  return requireApiRole(["owner", "admin", "coach", "member"], clubSlug);
}

export function apiSupabaseError(
  error: unknown,
  context?: { clubId?: string | null; source?: string; metadata?: Record<string, unknown> },
) {
  const requestId = crypto.randomUUID();
  const message = error instanceof Error ? error.message : String(error);
  const source = context?.source ?? "supabase";
  console.error(`[grapply:${source}:${requestId}]`, message);
  recordErrorEvent({
    requestId,
    clubId: context?.clubId ?? null,
    source,
    message,
    metadata: {
      runtime: isProductionRuntime() ? "production" : "development",
      ...(context?.metadata ?? {}),
    },
  });

  const response = noStoreJson(
    {
      ok: false,
      source,
      error: isProductionRuntime() ? "Backend data service is temporarily unavailable." : message,
      requestId,
    },
    { status: 502 },
  );
  response.headers.set("X-Request-Id", requestId);
  response.headers.set("X-Grapply-Error-Source", source);
  return response;
}

function apiAccessError(error: string, status: 401 | 403) {
  const requestId = crypto.randomUUID();
  console.warn(`[grapply:access:${requestId}]`, error);
  const response = noStoreJson({ ok: false, error, requestId }, { status });
  response.headers.set("X-Request-Id", requestId);
  response.headers.set("X-Grapply-Error-Source", "access");
  return response;
}

function noStoreJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
