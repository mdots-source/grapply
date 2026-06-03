import { NextResponse, type NextRequest } from "next/server";
import { authCookieNames } from "@/lib/auth-cookies";
import { getRequestUrl } from "@/lib/request-origin";
import { normalizeWorkspaceReturnTo, splitOrganizationWorkspacePath } from "@/lib/workspace-intent";

const publicPrefixes = [
  "/login",
  "/register",
  "/clubs/select",
  "/api",
  "/tv",
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

function isDemoAutoLoginEnabled() {
  return process.env.GRAPPLY_DEMO_AUTO_LOGIN !== "false";
}

function appendRequestCookie(cookieHeader: string, name: string, value: string) {
  return cookieHeader ? `${cookieHeader}; ${name}=${value}` : `${name}=${value}`;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (publicPaths.includes(pathname)) return NextResponse.next();
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();

  const organizationRoute = splitOrganizationWorkspacePath(pathname);
  const accessToken = request.cookies.get(authCookieNames.accessToken)?.value;

  if (organizationRoute) {
    if (!accessToken && !isDemoAutoLoginEnabled()) {
      const loginUrl = getRequestUrl("/login", request);
      loginUrl.searchParams.set("returnTo", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    const requestHeaders = new Headers(request.headers);
    let cookieHeader = requestHeaders.get("cookie") ?? "";
    cookieHeader = appendRequestCookie(cookieHeader, authCookieNames.activeClub, organizationRoute.organizationId);
    requestHeaders.set("cookie", cookieHeader);

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

    if (!accessToken && isDemoAutoLoginEnabled()) {
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
    const organizationId = request.cookies.get(authCookieNames.activeClub)?.value ?? demoActiveClub;
    const scopedUrl = request.nextUrl.clone();
    scopedUrl.pathname = `/${organizationId}${pathname}`;
    return NextResponse.redirect(scopedUrl);
  }

  if (!accessToken) {
    if (isDemoAutoLoginEnabled()) {
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
