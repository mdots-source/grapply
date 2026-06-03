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
    added?: string[];
    modified?: string[];
    removed?: string[];
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

type GitHubPullRequest = {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  user: {
    login: string;
  };
  changed_files: number;
  additions: number;
  deletions: number;
};

type GitHubPullRequestFile = {
  filename: string;
  status: string;
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

  await sendTelegramMessage(await formatProductionUpdateMessage(payload));

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

async function formatProductionUpdateMessage(payload: GitHubPushPayload) {
  const pullRequestNumber = findPullRequestNumber(payload);
  const repoFullName = payload.repository?.full_name;

  if (pullRequestNumber && repoFullName) {
    const pullRequest = await fetchPullRequest(repoFullName, pullRequestNumber);
    const files = await fetchPullRequestFiles(repoFullName, pullRequestNumber);

    if (pullRequest) {
      return formatPullRequestProductionMessage(payload, pullRequest, files);
    }
  }

  return formatDirectPushMessage(payload);
}

function formatPullRequestProductionMessage(
  payload: GitHubPushPayload,
  pullRequest: GitHubPullRequest,
  files: GitHubPullRequestFile[],
) {
  const summary = pullRequest.body?.trim() || "No PR description provided.";
  const fileLines = formatFileLines(files);
  const stats = [
    `${pullRequest.changed_files} files changed`,
    `+${pullRequest.additions}`,
    `-${pullRequest.deletions}`,
  ].join(" | ");

  return [
    "<b>Grapply production update</b>",
    "",
    `<b>#${pullRequest.number}: ${escapeHtml(pullRequest.title)}</b>`,
    `Author: ${escapeHtml(pullRequest.user.login)}`,
    `Repo: ${escapeHtml(payload.repository?.full_name ?? "unknown")}`,
    `Stats: ${escapeHtml(stats)}`,
    "",
    "<b>What changed</b>",
    escapeHtml(truncate(summary, 1200)),
    "",
    "<b>Touched areas</b>",
    escapeHtml(fileLines.length ? fileLines.join("\n") : "- No file details provided"),
    "",
    `<a href="${escapeHtml(pullRequest.html_url)}">Open PR</a>`,
  ].join("\n").slice(0, 3900);
}

function formatDirectPushMessage(payload: GitHubPushPayload) {
  const commits = payload.commits ?? [];
  const commitLines = commits.slice(-8).map((commit) => {
    const title = commit.message.split("\n")[0] || commit.id.slice(0, 7);
    const author = commit.author?.username ?? commit.author?.name;
    return `- ${truncate(title, 110)}${author ? ` (${author})` : ""}`;
  });
  const moreCommits = commits.length > commitLines.length
    ? `\n...and ${commits.length - commitLines.length} more commits`
    : "";
  const fileLines = formatPushFileLines(commits);

  return [
    "<b>Grapply production update</b>",
    "",
    `Repo: ${escapeHtml(payload.repository?.full_name ?? "unknown")}`,
    `Branch: main`,
    `Pushed by: ${escapeHtml(payload.pusher?.name ?? "unknown")}`,
    `Commits: ${commits.length}`,
    "",
    `<b>Commits</b>`,
    escapeHtml(commitLines.length ? `${commitLines.join("\n")}${moreCommits}` : "- No commit details provided"),
    "",
    `<b>Touched areas</b>`,
    escapeHtml(fileLines.length ? fileLines.join("\n") : "- No file details provided"),
    "",
    payload.compare ? `<a href="${escapeHtml(payload.compare)}">View changes</a>` : "",
  ].join("\n").slice(0, 3900);
}

function findPullRequestNumber(payload: GitHubPushPayload) {
  const candidates = [
    payload.head_commit?.message,
    ...(payload.commits ?? []).map((commit) => commit.message),
  ].filter(Boolean);

  for (const message of candidates) {
    const match = message?.match(/\(#(\d+)\)|pull request #(\d+)/i);
    const pullRequestNumber = match?.[1] ?? match?.[2];

    if (pullRequestNumber) {
      return Number(pullRequestNumber);
    }
  }

  return null;
}

async function fetchPullRequest(repoFullName: string, pullRequestNumber: number) {
  try {
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/pulls/${pullRequestNumber}`, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json() as GitHubPullRequest;
  } catch {
    return null;
  }
}

async function fetchPullRequestFiles(repoFullName: string, pullRequestNumber: number) {
  try {
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/pulls/${pullRequestNumber}/files?per_page=30`, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json() as GitHubPullRequestFile[];
  } catch {
    return [];
  }
}

function formatFileLines(files: GitHubPullRequestFile[]) {
  return files.slice(0, 12).map((file) => `${fileStatusPrefix(file.status)} ${file.filename}`);
}

function formatPushFileLines(commits: NonNullable<GitHubPushPayload["commits"]>) {
  const files = new Map<string, string>();

  for (const commit of commits) {
    for (const file of commit.added ?? []) files.set(file, "+");
    for (const file of commit.modified ?? []) files.set(file, "~");
    for (const file of commit.removed ?? []) files.set(file, "-");
  }

  return Array.from(files.entries()).slice(0, 12).map(([file, prefix]) => `${prefix} ${file}`);
}

function fileStatusPrefix(status: string) {
  if (status === "added") return "+";
  if (status === "removed") return "-";
  if (status === "renamed") return ">";
  return "~";
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
