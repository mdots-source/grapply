import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GitHubPushPayload = {
  ref?: string;
  before?: string;
  after?: string;
  compare?: string;
  commits?: Array<{
    id: string;
    message: string;
    url: string;
    author?: {
      name?: string;
      username?: string;
    };
  }>;
  head_commit?: {
    id: string;
    message: string;
    url: string;
  } | null;
  pusher?: {
    name?: string;
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

  if (event !== "push") {
    return NextResponse.json({ ok: true, skipped: "Unsupported event" });
  }

  const payload = parsePayload(body);

  if (payload.ref !== "refs/heads/main") {
    return NextResponse.json({ ok: true, skipped: "Push target is not main" });
  }

  if (!payload.head_commit || payload.after === "0000000000000000000000000000000000000000") {
    return NextResponse.json({ ok: true, skipped: "No production commit to report" });
  }

  await sendTelegramMessage(formatPushMessage(payload));

  return NextResponse.json({ ok: true });
}

function parsePayload(body: string) {
  try {
    return JSON.parse(body) as GitHubPushPayload;
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

function formatPushMessage(payload: GitHubPushPayload) {
  const commits = payload.commits ?? [];
  const commitLines = commits.slice(-8).map((commit) => {
    const title = commit.message.split("\n")[0] || commit.id.slice(0, 7);
    const author = commit.author?.username ?? commit.author?.name;
    return `- ${truncate(title, 110)}${author ? ` (${author})` : ""}`;
  });
  const moreCommits = commits.length > commitLines.length
    ? `\n...and ${commits.length - commitLines.length} more commits`
    : "";

  return [
    "<b>Grapply production update</b>",
    "",
    `Repo: ${escapeHtml(payload.repository?.full_name ?? "unknown")}`,
    `Branch: main`,
    `Pushed by: ${escapeHtml(payload.pusher?.name ?? "unknown")}`,
    `Commits: ${commits.length}`,
    "",
    `<b>Summary</b>`,
    escapeHtml(commitLines.length ? `${commitLines.join("\n")}${moreCommits}` : "- No commit details provided"),
    "",
    payload.compare ? `<a href="${escapeHtml(payload.compare)}">View changes</a>` : "",
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
