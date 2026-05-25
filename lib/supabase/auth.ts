import { getSupabaseServerConfig } from "@/lib/supabase/server";

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type PasswordSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: SupabaseAuthUser;
};

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getSupabaseServerConfig();
  if (!config) throw new Error("Supabase is not configured.");

  const response = await fetch(`${config.url}/auth/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase auth failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function createAuthUser({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) {
  return authRequest<SupabaseAuthUser>("admin/users", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    }),
  });
}

export async function signInWithPassword(email: string, password: string) {
  const config = getSupabaseServerConfig();
  if (!config) throw new Error("Supabase is not configured.");

  const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase login failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<PasswordSession>;
}

export async function getAuthUser(accessToken: string) {
  const config = getSupabaseServerConfig();
  if (!config) throw new Error("Supabase is not configured.");

  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return response.json() as Promise<SupabaseAuthUser>;
}
