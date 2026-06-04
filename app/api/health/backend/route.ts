import { NextResponse } from "next/server";
import { isProductionRuntime } from "@/lib/auth-mode";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    runtime: isProductionRuntime() ? "production" : "development",
    supabaseConfigured: isSupabaseConfigured(),
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
}
