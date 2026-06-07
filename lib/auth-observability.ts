import { recordErrorEvent } from "@/lib/observability";

export function recordAuthFailure(input: {
  requestId: string;
  message: string;
  status: number;
  action: string;
}) {
  recordErrorEvent({
    requestId: input.requestId,
    source: "auth",
    severity: input.status >= 500 ? "error" : "warning",
    message: input.message,
    metadata: {
      action: input.action,
      status: input.status,
    },
  });
}
