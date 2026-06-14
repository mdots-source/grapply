"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { readApiJson } from "@/lib/api-client";

export function EmailOutboxActions({ clubSlug, deliveryConfigured }: { clubSlug: string; deliveryConfigured: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sendPending() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/email-outbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubSlug, limit: 10 }),
      });
      const payload = await readApiJson<{ ok?: boolean; sent?: number; failed?: number; error?: string; requestId?: string }>(response, "Email delivery failed.");
      if (!payload.ok) throw new Error(payload.error ?? "Email delivery failed.");
      setMessage(`${payload.sent ?? 0} sent, ${payload.failed ?? 0} failed.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Email delivery failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="surface" size="sm" disabled={loading || !deliveryConfigured} onClick={sendPending}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        Send pending
      </Button>
      {!deliveryConfigured && <p className="max-w-56 text-right text-[11px] text-[var(--muted)]">Waiting for email provider env vars.</p>}
      {message && <p className="max-w-56 text-right text-[11px] text-[var(--muted)]">{message}</p>}
    </div>
  );
}
