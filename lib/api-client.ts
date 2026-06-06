type ApiErrorPayload = {
  error?: string;
  requestId?: string;
};

export async function readApiJson<T>(response: Response, fallbackError: string): Promise<T> {
  const payload = await readJsonPayload<ApiErrorPayload>(response);
  if (!response.ok) {
    throw new Error(formatApiError(payload?.error ?? fallbackError, payload?.requestId ?? response.headers.get("X-Request-Id")));
  }
  return payload as T;
}

export function formatApiError(message: string, requestId?: string | null) {
  return requestId ? `${message} Reference: ${requestId}` : message;
}

async function readJsonPayload<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
