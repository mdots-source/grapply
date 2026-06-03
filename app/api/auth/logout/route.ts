import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth-cookies";
import { getRequestUrl } from "@/lib/request-origin";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(getRequestUrl("/login", request));
  clearAuthCookies(response);
  return response;
}
