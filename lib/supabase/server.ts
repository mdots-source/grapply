import type { TableInsert, TableName, TableRow, TableUpdate } from "@/lib/supabase/types";

type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
};

export function getSupabaseServerConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;
  return { url: url.replace(/\/$/, ""), serviceRoleKey };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseServerConfig());
}

async function supabaseRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getSupabaseServerConfig();
  if (!config) {
    throw new Error("Supabase is not configured.");
  }

  const requestUrl = `${config.url}/rest/v1/${path}`;
  const response = await fetch(requestUrl, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init?.headers,
    },
    cache: "no-store",
  }).catch((error) => {
    throw new Error(`Cannot reach Supabase REST API at ${config.url}. Check NEXT_PUBLIC_SUPABASE_URL, DNS, and project status. ${formatFetchError(error)}`);
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase request failed (${response.status}) for ${requestUrl}: ${body}`);
  }

  return response.json() as Promise<T>;
}

function formatFetchError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function selectRows<T extends TableName>(table: T, query = "select=*") {
  return supabaseRequest<TableRow<T>[]>(`${table}?${query}`);
}

export async function insertRow<T extends TableName>(table: T, row: TableInsert<T>) {
  const [created] = await supabaseRequest<TableRow<T>[]>(table, {
    method: "POST",
    body: JSON.stringify(row),
  });

  return created;
}

export async function upsertRow<T extends TableName>(table: T, row: TableInsert<T>, onConflict: string) {
  const [created] = await supabaseRequest<TableRow<T>[]>(`${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });

  return created;
}

export async function updateRows<T extends TableName>(table: T, row: TableUpdate<T>, query: string) {
  return supabaseRequest<TableRow<T>[]>(`${table}?${query}`, {
    method: "PATCH",
    body: JSON.stringify(row),
  });
}

export async function deleteRows<T extends TableName>(table: T, query: string) {
  return supabaseRequest<TableRow<T>[]>(`${table}?${query}`, {
    method: "DELETE",
  });
}
