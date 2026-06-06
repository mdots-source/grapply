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

type AuthActionLinkType = "magiclink" | "recovery";

type AuthActionLink = {
  action_link?: string;
  email_otp?: string;
  hashed_token?: string;
  redirect_to?: string;
  verification_type?: string;
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
  }).catch((error) => {
    throw new Error(`Cannot reach Supabase Auth at ${config.url}. Check NEXT_PUBLIC_SUPABASE_URL, DNS, and project status. ${formatFetchError(error)}`);
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
  }).catch((error) => {
    throw new Error(`Cannot reach Supabase Auth at ${config.url}. Check NEXT_PUBLIC_SUPABASE_URL, DNS, and project status. ${formatFetchError(error)}`);
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase login failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<PasswordSession>;
}

export async function sendPasswordRecoveryEmail(email: string, redirectTo: string) {
  return authRequest<Record<string, unknown>>(`recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function sendMagicLinkEmail(email: string, redirectTo: string) {
  return authRequest<Record<string, unknown>>(`otp?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST",
    body: JSON.stringify({ email, create_user: false }),
  });
}

export async function generateAuthActionLink({
  email,
  redirectTo,
  type,
}: {
  email: string;
  redirectTo: string;
  type: AuthActionLinkType;
}) {
  const link = await authRequest<AuthActionLink>("admin/generate_link", {
    method: "POST",
    body: JSON.stringify({
      email,
      type,
      redirect_to: redirectTo,
    }),
  });

  if (!link.action_link) {
    throw new Error(`Supabase did not return an auth action link for ${type}.`);
  }

  return link.action_link;
}

export async function refreshPasswordSession(refreshToken: string) {
  const config = getSupabaseServerConfig();
  if (!config) throw new Error("Supabase is not configured.");

  const response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  }).catch((error) => {
    throw new Error(`Cannot reach Supabase Auth at ${config.url}. Check NEXT_PUBLIC_SUPABASE_URL, DNS, and project status. ${formatFetchError(error)}`);
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase refresh failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<PasswordSession>;
}

export async function updatePassword(accessToken: string, password: string) {
  const config = getSupabaseServerConfig();
  if (!config) throw new Error("Supabase is not configured.");

  const response = await fetch(`${config.url}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
    cache: "no-store",
  }).catch((error) => {
    throw new Error(`Cannot reach Supabase Auth at ${config.url}. Check NEXT_PUBLIC_SUPABASE_URL, DNS, and project status. ${formatFetchError(error)}`);
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase password update failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<SupabaseAuthUser>;
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
  }).catch(() => null);

  if (!response) return null;

  if (!response.ok) return null;
  return response.json() as Promise<SupabaseAuthUser>;
}

function formatFetchError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
