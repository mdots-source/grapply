import { NextResponse, type NextRequest } from "next/server";
import { authCookieNames } from "@/lib/auth-cookies";
import { isAutomaticDemoLoginEnabled } from "@/lib/auth-mode";
import { getRequestUrl } from "@/lib/request-origin";
import { normalizeWorkspaceReturnTo, splitOrganizationWorkspacePath } from "@/lib/workspace-intent";

const publicPrefixes = [
  "/login",
  "/register",
  "/auth/callback",
  "/clubs/select",
  "/api",
  "/ui",
  "/_next",
  "/favicon.ico",
  "/avatars",
];

const publicPaths = ["/"];
const demoAccessToken = "mock:usr-sofia";
const demoActiveClub = "grapply-bjj";
const unscopedWorkspacePrefixes = [
  "/admin",
  "/competitions",
  "/dashboard",
  "/members",
  "/rankings",
  "/schedule",
  "/settings",
  "/training-camps",
  "/training-feed",
  "/tv",
];
const reservedTopLevelPaths = new Set([
  "auth",
  "clubs",
  "login",
  "register",
  "ui",
  ...unscopedWorkspacePrefixes.map((prefix) => prefix.slice(1)),
]);

function appendRequestCookie(cookieHeader: string, name: string, value: string) {
  return cookieHeader ? `${cookieHeader}; ${name}=${value}` : `${name}=${value}`;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (publicPaths.includes(pathname)) return NextResponse.next();
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();

  const accessToken = request.cookies.get(authCookieNames.accessToken)?.value;
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 1 && !reservedTopLevelPaths.has(segments[0])) {
    const organizationId = segments[0];
    const dashboardPath = `/${organizationId}/dashboard`;

    if (!accessToken && !isAutomaticDemoLoginEnabled()) {
      const loginUrl = getRequestUrl("/login", request);
      loginUrl.searchParams.set("returnTo", dashboardPath);
      return NextResponse.redirect(loginUrl);
    }

    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = dashboardPath;
    const response = NextResponse.redirect(dashboardUrl);

    if (!accessToken && isAutomaticDemoLoginEnabled()) {
      response.cookies.set(authCookieNames.accessToken, demoAccessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  }

  const organizationRoute = splitOrganizationWorkspacePath(pathname);

  if (organizationRoute) {
    if (!accessToken && !isAutomaticDemoLoginEnabled()) {
      const loginUrl = getRequestUrl("/login", request);
      loginUrl.searchParams.set("returnTo", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    const requestHeaders = new Headers(request.headers);
    let cookieHeader = requestHeaders.get("cookie") ?? "";
    cookieHeader = appendRequestCookie(cookieHeader, authCookieNames.activeClub, organizationRoute.organizationId);
    requestHeaders.set("cookie", cookieHeader);
    requestHeaders.set("x-grapply-organization-id", organizationRoute.organizationId);

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = organizationRoute.workspacePath;
    const response = NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
    response.cookies.set(authCookieNames.activeClub, organizationRoute.organizationId, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });

    if (!accessToken && isAutomaticDemoLoginEnabled()) {
      response.cookies.set(authCookieNames.accessToken, demoAccessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  }

  const isUnscopedWorkspacePath = unscopedWorkspacePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (isUnscopedWorkspacePath) {
    if (request.headers.get("x-grapply-organization-id")) return NextResponse.next();

    const activeClub = request.cookies.get(authCookieNames.activeClub)?.value;
    const organizationId = activeClub ?? (isAutomaticDemoLoginEnabled() ? demoActiveClub : null);
    if (!organizationId) {
      const clubsUrl = getRequestUrl("/clubs", request);
      clubsUrl.searchParams.set("returnTo", `${pathname}${search}`);
      return NextResponse.redirect(clubsUrl);
    }

    const scopedUrl = request.nextUrl.clone();
    scopedUrl.pathname = `/${organizationId}${pathname}`;
    return NextResponse.redirect(scopedUrl);
  }

  if (!accessToken) {
    if (isAutomaticDemoLoginEnabled()) {
      const requestHeaders = new Headers(request.headers);
      let cookieHeader = requestHeaders.get("cookie") ?? "";
      cookieHeader = appendRequestCookie(cookieHeader, authCookieNames.accessToken, demoAccessToken);
      if (!request.cookies.get(authCookieNames.activeClub)?.value) {
        cookieHeader = appendRequestCookie(cookieHeader, authCookieNames.activeClub, demoActiveClub);
      }
      requestHeaders.set("cookie", cookieHeader);

      const response = NextResponse.next({ request: { headers: requestHeaders } });
      response.cookies.set(authCookieNames.accessToken, demoAccessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      response.cookies.set(authCookieNames.activeClub, request.cookies.get(authCookieNames.activeClub)?.value ?? demoActiveClub, {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: 60 * 60 * 24 * 90,
      });
      return response;
    }

    const loginUrl = getRequestUrl("/login", request);
    const requestedDestination = pathname === "/clubs/select"
      ? normalizeWorkspaceReturnTo(request.nextUrl.searchParams.get("returnTo"))
      : `${pathname}${search}`;
    loginUrl.searchParams.set("returnTo", requestedDestination);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
