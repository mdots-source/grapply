import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth-cookies";
import { noStoreJson } from "@/lib/api-json";
import { getRequestUrl } from "@/lib/request-origin";

export async function POST() {
  const response = noStoreJson({ ok: true });
  clearAuthCookies(response);
  return response;
}

export async function GET(request: Request) {
  const response = noStoreRedirect(getRequestUrl("/login", request));
  clearAuthCookies(response);
  return response;
}

function noStoreRedirect(url: URL, status?: number) {
  const response = NextResponse.redirect(url, status);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
