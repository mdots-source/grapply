import { NextResponse } from "next/server";
import { authCookieNames, clearStravaStateCookie, getCookieValue, setActiveClubCookie, setAuthCookies } from "@/lib/auth-cookies";
import { getCurrentSessionWithRefresh } from "@/lib/auth-session";
import { getBackendClubId } from "@/lib/backend";
import { exchangeStravaCode, isStravaConfigured, STRAVA_SCOPES } from "@/lib/strava";
import { isSupabaseConfigured, upsertRow } from "@/lib/supabase/server";
import { normalizeWorkspaceReturnTo, scopeWorkspaceReturnTo } from "@/lib/workspace-intent";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");
  const redirectState = getSafeRedirectState(request, state);

  if (error) {
    redirectState.redirectUrl.searchParams.set("strava", "denied");
    return redirectAndClearStravaState(redirectState.redirectUrl);
  }

  if (!code) {
    redirectState.redirectUrl.searchParams.set("strava", "missing-code");
    return redirectAndClearStravaState(redirectState.redirectUrl);
  }

  if (!isValidStateNonce(request, redirectState.nonce)) {
    redirectState.redirectUrl.searchParams.set("strava", "invalid-state");
    return redirectAndClearStravaState(redirectState.redirectUrl);
  }

  try {
    if (!isSupabaseConfigured()) {
      redirectState.redirectUrl.searchParams.set("strava", "missing-config");
      return redirectAndClearStravaState(redirectState.redirectUrl);
    }

    if (!isStravaConfigured()) {
      redirectState.redirectUrl.searchParams.set("strava", "missing-config");
      return redirectAndClearStravaState(redirectState.redirectUrl);
    }

    const { session, refreshedSession } = await getCurrentSessionWithRefresh();
    const redirectWithAuthAndClearStrava = (redirectUrl: URL, status?: number) => {
      const response = redirectAndClearStravaState(redirectUrl, status);
      if (refreshedSession) setAuthCookies(response, refreshedSession);
      return response;
    };
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", redirectState.workspaceReturnTo);
      loginUrl.searchParams.set("strava", "login-required");
      return redirectWithAuthAndClearStrava(loginUrl, 303);
    }

    if (!isUuid(session.user.id)) {
      redirectState.redirectUrl.searchParams.set("strava", "real-login-required");
      return redirectWithAuthAndClearStrava(redirectState.redirectUrl);
    }

    const membership = redirectState.clubSlug
      ? session.memberships.find((item) => item.club.slug === redirectState.clubSlug)
      : session.activeClub
        ? session.memberships.find((item) => item.club.slug === session.activeClub?.slug)
        : null;

    if (!membership) {
      redirectState.redirectUrl.searchParams.set("strava", "club-required");
      return redirectWithAuthAndClearStrava(redirectState.redirectUrl);
    }

    const clubId = await getBackendClubId(membership.club.slug);
    if (!clubId) {
      redirectState.redirectUrl.searchParams.set("strava", "club-not-found");
      return redirectWithAuthAndClearStrava(redirectState.redirectUrl);
    }

    const grantedScopes = parseScopes(url.searchParams.get("scope"));
    if (!hasRequiredScopes(grantedScopes)) {
      redirectState.redirectUrl.searchParams.set("strava", "missing-scope");
      return redirectWithAuthAndClearStrava(redirectState.redirectUrl);
    }

    const token = await exchangeStravaCode(code);

    await upsertRow(
      "strava_connections",
      {
        user_id: session.user.id,
        club_id: clubId,
        athlete_id: String(token.athlete.id),
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: token.expires_at,
        scopes: grantedScopes,
      },
      "user_id,club_id",
    );

    const redirectUrl = getScopedRedirectUrl(request, redirectState.workspaceReturnTo, membership.club.slug);
    redirectUrl.searchParams.set("strava", "connected");
    const response = redirectWithAuthAndClearStrava(redirectUrl);
    setActiveClubCookie(response, membership.club.slug);
    return response;
  } catch {
    redirectState.redirectUrl.searchParams.set("strava", "error");
  }

  return redirectAndClearStravaState(redirectState.redirectUrl);
}

function getSafeRedirectState(request: Request, state: string | null) {
  if (state?.startsWith("/clubs")) {
    const url = new URL(state, request.url);
    const workspaceReturnTo = normalizeWorkspaceReturnTo(url.searchParams.get("returnTo"));
    const clubSlug = normalizeClubSlug(url.searchParams.get("club"));
    const nonce = normalizeNonce(url.searchParams.get("nonce"));
    url.searchParams.set("returnTo", workspaceReturnTo);
    if (clubSlug) url.searchParams.set("club", clubSlug);
    else url.searchParams.delete("club");
    if (nonce) url.searchParams.set("nonce", nonce);
    else url.searchParams.delete("nonce");
    return { redirectUrl: url, workspaceReturnTo, clubSlug, nonce };
  }

  const url = new URL("/clubs", request.url);
  const workspaceReturnTo = normalizeWorkspaceReturnTo(state);
  url.searchParams.set("returnTo", workspaceReturnTo);
  return { redirectUrl: url, workspaceReturnTo, clubSlug: null, nonce: null };
}

function getScopedRedirectUrl(request: Request, workspaceReturnTo: string, clubSlug: string) {
  return new URL(scopeWorkspaceReturnTo(workspaceReturnTo, clubSlug), request.url);
}

function normalizeClubSlug(value: string | null) {
  if (!value) return null;
  return /^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$/i.test(value) ? value : null;
}

function normalizeNonce(value: string | null) {
  if (!value) return null;
  return /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

function parseScopes(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function hasRequiredScopes(scopes: string[]) {
  return STRAVA_SCOPES.every((scope) => scopes.includes(scope));
}

function isValidStateNonce(request: Request, stateNonce: string | null) {
  const cookieNonce = getCookieValue(request, authCookieNames.stravaState);
  return Boolean(stateNonce && cookieNonce && stateNonce === cookieNonce);
}

function redirectAndClearStravaState(url: URL, status?: number) {
  const response = noStoreRedirect(url, status);
  clearStravaStateCookie(response);
  return response;
}

function noStoreRedirect(url: URL, status?: number) {
  const response = NextResponse.redirect(url, status);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
