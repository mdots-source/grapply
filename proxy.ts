import { NextResponse, type NextRequest } from "next/server";
import { authCookieNames } from "@/lib/auth-cookies";
import { normalizeWorkspaceReturnTo } from "@/lib/workspace-intent";

const publicPrefixes = [
  "/login",
  "/register",
  "/api",
  "/tv",
  "/ui",
  "/_next",
  "/favicon.ico",
  "/avatars",
];

const publicPaths = ["/"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (publicPaths.includes(pathname)) return NextResponse.next();
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();

  const accessToken = request.cookies.get(authCookieNames.accessToken)?.value;
  if (!accessToken) {
    const loginUrl = new URL("/login", request.url);
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
