import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GitHubPullRequestPayload = {
  action?: string;
  pull_request?: {
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    draft: boolean;
    merged: boolean;
    user: {
      login: string;
    };
    base: {
      ref: string;
    };
    head: {
      ref: string;
    };
    changed_files: number;
    additions: number;
    deletions: number;
    commits: number;
  };
  repository?: {
    full_name: string;
  };
};

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "github-pr-summary",
    telegramChatConfigured: Boolean(process.env.TELEGRAM_CHAT_ID),
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");

  if (!isValidGitHubSignature(body, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  if (event !== "pull_request") {
    return NextResponse.json({ ok: true, skipped: "Unsupported event" });
  }

  const payload = parsePayload(body);
  const pullRequest = payload.pull_request;

  if (!pullRequest || payload.action !== "closed") {
    return NextResponse.json({ ok: true, skipped: "Not a merged pull request event" });
  }

  if (pullRequest.base.ref !== "main") {
    return NextResponse.json({ ok: true, skipped: "Pull request target is not main" });
  }

  if (!pullRequest.merged) {
    return NextResponse.json({ ok: true, skipped: "Pull request closed without merge" });
  }

  await sendTelegramMessage(formatPullRequestMessage(payload));

  return NextResponse.json({ ok: true });
}

function parsePayload(body: string) {
  try {
    return JSON.parse(body) as GitHubPullRequestPayload;
  } catch {
    throw new Error("Invalid GitHub webhook payload");
  }
}

function isValidGitHubSignature(body: string, signature: string | null) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret || !signature?.startsWith("sha256=")) {
    return false;
  }

  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);
}

function formatPullRequestMessage(payload: GitHubPullRequestPayload) {
  const pullRequest = payload.pull_request;

  if (!pullRequest) {
    throw new Error("Pull request payload is missing");
  }

  const summary = pullRequest.body?.trim() || "No PR description provided.";
  const stats = [
    `${pullRequest.changed_files} files changed`,
    `+${pullRequest.additions}`,
    `-${pullRequest.deletions}`,
    `${pullRequest.commits} commits`,
  ].join(" | ");

  return [
    "<b>Grapply production update</b>",
    "",
    `<b>#${pullRequest.number}: ${escapeHtml(pullRequest.title)}</b>`,
    `Author: ${escapeHtml(pullRequest.user.login)}`,
    `Repo: ${escapeHtml(payload.repository?.full_name ?? "unknown")}`,
    `Branch: ${escapeHtml(pullRequest.head.ref)} -> ${escapeHtml(pullRequest.base.ref)}`,
    `Stats: ${escapeHtml(stats)}`,
    "",
    `<b>Summary</b>`,
    escapeHtml(truncate(summary, 1200)),
    "",
    `<a href="${escapeHtml(pullRequest.html_url)}">Open PR</a>`,
  ].join("\n").slice(0, 3900);
}

async function sendTelegramMessage(text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required");
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed: ${response.status} ${await response.text()}`);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}
