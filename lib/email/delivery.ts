import type { TableRow } from "@/lib/supabase/types";

type EmailOutboxRow = TableRow<"email_outbox">;

type EmailDeliveryResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; error: string };

export function isEmailDeliveryConfigured() {
  return Boolean(getResendConfig() || getSmtpConfig());
}

export async function deliverEmail(row: EmailOutboxRow): Promise<EmailDeliveryResult> {
  const resendConfig = getResendConfig();
  if (resendConfig) return deliverResendEmail(row, resendConfig);

  const smtpConfig = getSmtpConfig();
  if (smtpConfig) return deliverSmtpEmail(row, smtpConfig);

  return {
    ok: false,
    error: "Email delivery is not configured. Add RESEND_API_KEY + RESEND_FROM_EMAIL or SMTP/GMAIL credentials.",
  };
}

async function deliverResendEmail(row: EmailOutboxRow, config: { apiKey: string; from: string }): Promise<EmailDeliveryResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: row.to_email,
      subject: row.subject,
      text: row.body,
      html: buildEmailHtml(row),
    }),
    cache: "no-store",
  });

  const payload = await readResendPayload(response);
  if (!response.ok) {
    return { ok: false, error: payload.error ?? `Email provider rejected the message with status ${response.status}.` };
  }

  return { ok: true, providerMessageId: payload.id ?? `resend:${row.id}` };
}

async function deliverSmtpEmail(row: EmailOutboxRow, config: SmtpConfig): Promise<EmailDeliveryResult> {
  try {
    const tls = await import("node:tls");
    const net = await import("node:net");
    const socket = config.secure
      ? tls.connect(config.port, config.host, { servername: config.host })
      : net.connect(config.port, config.host);

    const smtp = new SmtpSession(socket);
    await smtp.expect(220);
    await smtp.command(`EHLO ${config.heloDomain}`, 250);
    if (!config.secure && config.startTls) {
      await smtp.command("STARTTLS", 220);
      const secureSocket = tls.connect({ socket, servername: config.host });
      smtp.replaceSocket(secureSocket);
      await smtp.command(`EHLO ${config.heloDomain}`, 250);
    }
    await smtp.command("AUTH LOGIN", 334);
    await smtp.command(Buffer.from(config.user).toString("base64"), 334);
    await smtp.command(Buffer.from(config.pass).toString("base64"), 235);
    await smtp.command(`MAIL FROM:<${config.envelopeFrom}>`, 250);
    await smtp.command(`RCPT TO:<${row.to_email}>`, 250);
    await smtp.command("DATA", 354);
    await smtp.writeData(buildSmtpMessage(row, config));
    const finalResponse = await smtp.expect(250);
    await smtp.command("QUIT", 221).catch(() => undefined);
    smtp.close();
    return { ok: true, providerMessageId: `smtp:${extractSmtpMessageId(finalResponse) ?? row.id}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function readResendPayload(response: Response): Promise<{ id?: string; error?: string }> {
  try {
    const payload = (await response.json()) as { id?: unknown; message?: unknown; name?: unknown };
    const message = typeof payload.message === "string" ? payload.message : typeof payload.name === "string" ? payload.name : undefined;
    return {
      id: typeof payload.id === "string" ? payload.id : undefined,
      error: message,
    };
  } catch {
    return {};
  }
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  startTls: boolean;
  user: string;
  pass: string;
  from: string;
  envelopeFrom: string;
  heloDomain: string;
};

function getSmtpConfig(): SmtpConfig | null {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const smtpUser = process.env.SMTP_USER ?? gmailUser;
  const smtpPass = process.env.SMTP_PASS ?? gmailPass;
  if (!smtpUser || !smtpPass) return null;

  const host = process.env.SMTP_HOST ?? (gmailUser ? "smtp.gmail.com" : "");
  if (!host) return null;

  const port = Number(process.env.SMTP_PORT ?? (gmailUser ? 465 : 587));
  const secure = parseBoolean(process.env.SMTP_SECURE, port === 465);
  const from = process.env.SMTP_FROM_EMAIL ?? process.env.GMAIL_FROM_EMAIL ?? smtpUser;

  return {
    host,
    port,
    secure,
    startTls: parseBoolean(process.env.SMTP_STARTTLS, !secure),
    user: smtpUser,
    pass: smtpPass,
    from,
    envelopeFrom: extractEmailAddress(from) ?? smtpUser,
    heloDomain: process.env.SMTP_HELO_DOMAIN ?? "grapply.me",
  };
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "yes";
}

function extractEmailAddress(value: string) {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim();
}

function buildSmtpMessage(row: EmailOutboxRow, config: SmtpConfig) {
  const boundary = `grapply-${row.id}`;
  const headers = [
    `From: ${config.from}`,
    `To: ${row.to_email}`,
    `Subject: ${encodeMimeHeader(row.subject)}`,
    `Message-ID: <${row.id}@grapply.me>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const textPart = [
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    row.body,
  ].join("\r\n");
  const htmlPart = [
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    buildEmailHtml(row),
  ].join("\r\n");
  const closingBoundary = `--${boundary}--`;
  return `${headers.join("\r\n")}\r\n\r\n${dotStuff([textPart, htmlPart, closingBoundary].join("\r\n"))}\r\n.`;
}

function encodeMimeHeader(value: string) {
  if (/^[\x00-\x7F]*$/.test(value)) return value.replace(/\r?\n/g, " ");
  return `=?UTF-8?B?${Buffer.from(value.replace(/\r?\n/g, " "), "utf8").toString("base64")}?=`;
}

function dotStuff(value: string) {
  return value
    .replace(/\r?\n/g, "\r\n")
    .split("\r\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");
}

function extractSmtpMessageId(response: string) {
  return response.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+)\b/)?.[1];
}

function buildEmailHtml(row: EmailOutboxRow) {
  const textLines = row.body.split(/\r?\n/).map((line) => line.trim());
  const ctaUrl = textLines.find((line) => /^https?:\/\//.test(line));
  const title = getEmailTitle(row);
  const eyebrow = getEmailEyebrow(row.template);
  const preview = getEmailPreview(row, textLines);
  const bodyParagraphs = textLines
    .filter((line) => line && line !== ctaUrl)
    .map((line) => `<p style="margin:0 0 14px;color:#d8d5e6;font-size:15px;line-height:1.65;">${escapeHtml(line)}</p>`)
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(row.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#07070a;font-family:Inter,Arial,sans-serif;color:#f7f4ff;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07070a;padding:32px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;background:#111118;border:1px solid #2c2938;border-radius:22px;overflow:hidden;box-shadow:0 22px 70px rgba(124,92,255,0.22);">
            <tr>
              <td style="padding:28px 28px 10px;background:linear-gradient(135deg,#1c1630 0%,#111118 52%,#11201d 100%);">
                <div style="display:inline-block;padding:7px 10px;border-radius:999px;background:rgba(167,139,250,0.14);border:1px solid rgba(167,139,250,0.28);color:#bba7ff;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(eyebrow)}</div>
                <h1 style="margin:18px 0 10px;color:#ffffff;font-size:28px;line-height:1.15;font-weight:800;letter-spacing:-0.02em;">${escapeHtml(title)}</h1>
                <p style="margin:0;color:#aaa4bd;font-size:14px;line-height:1.6;">Grapply keeps academy access, classes, members, and training activity in one clean workspace.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 8px;">
                ${bodyParagraphs}
                ${ctaUrl ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 18px;"><tr><td style="border-radius:14px;background:#a78bfa;"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:14px 20px;color:#10091f;text-decoration:none;font-size:15px;font-weight:800;">${escapeHtml(getEmailCtaLabel(row.template))}</a></td></tr></table>` : ""}
                ${ctaUrl ? `<p style="margin:0 0 16px;color:#817a92;font-size:12px;line-height:1.6;">If the button does not work, open this link:<br><a href="${escapeHtml(ctaUrl)}" style="color:#bba7ff;word-break:break-all;">${escapeHtml(ctaUrl)}</a></p>` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px;border-top:1px solid #272431;">
                <p style="margin:0;color:#817a92;font-size:12px;line-height:1.6;">You received this email because someone used Grapply for an academy workspace action. If this was not you, you can ignore it.</p>
                <p style="margin:14px 0 0;color:#f7f4ff;font-size:13px;font-weight:800;">Grapply</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function getEmailTitle(row: EmailOutboxRow) {
  if (row.template === "club_invite") return "You are invited to Grapply";
  if (row.template === "invite_welcome" || row.template === "owner_welcome") return "Welcome to your academy workspace";
  if (row.template === "invite_accepted_notification") return "Invite accepted";
  if (row.template === "magic_link") return "Your secure sign-in link";
  if (row.template === "password_reset") return "Reset your Grapply password";
  return row.subject;
}

function getEmailEyebrow(template: string) {
  if (template.includes("invite")) return "Academy access";
  if (template.includes("password") || template.includes("magic")) return "Secure login";
  if (template.includes("notification")) return "Team update";
  return "Grapply";
}

function getEmailCtaLabel(template: string) {
  if (template === "club_invite") return "Accept invite";
  if (template === "password_reset") return "Reset password";
  if (template === "magic_link") return "Sign in";
  return "Open Grapply";
}

function getEmailPreview(row: EmailOutboxRow, textLines: string[]) {
  return textLines.find((line) => line && !/^https?:\/\//.test(line)) ?? row.subject;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

class SmtpSession {
  private buffer = "";
  private waiters: Array<{
    code: number;
    resolve: (value: string) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(private socket: import("node:net").Socket) {
    this.bindSocket(socket);
  }

  replaceSocket(socket: import("node:net").Socket) {
    this.socket.removeAllListeners();
    this.socket = socket;
    this.buffer = "";
    this.bindSocket(socket);
  }

  command(command: string, expectedCode: number) {
    this.socket.write(`${command}\r\n`);
    return this.expect(expectedCode);
  }

  async writeData(message: string) {
    this.socket.write(`${message}\r\n`);
  }

  expect(code: number) {
    return new Promise<string>((resolve, reject) => {
      this.waiters.push({ code, resolve, reject });
      this.flush();
    });
  }

  close() {
    this.socket.end();
  }

  private bindSocket(socket: import("node:net").Socket) {
    socket.setTimeout(15000);
    socket.on("data", (chunk) => {
      this.buffer += chunk.toString("utf8");
      this.flush();
    });
    socket.on("timeout", () => this.fail(new Error("SMTP connection timed out.")));
    socket.on("error", (error) => this.fail(error));
  }

  private flush() {
    while (this.waiters.length > 0) {
      const response = this.readResponse();
      if (!response) return;
      const waiter = this.waiters.shift();
      if (!waiter) return;
      if (response.code === waiter.code) {
        waiter.resolve(response.text);
      } else {
        waiter.reject(new Error(`SMTP expected ${waiter.code}, received ${response.text.trim()}`));
      }
    }
  }

  private readResponse() {
    const lines = this.buffer.split("\r\n");
    if (lines.length < 2) return null;

    let consumed = 0;
    let lastLine = "";
    for (const line of lines) {
      if (!line) break;
      consumed += line.length + 2;
      lastLine = line;
      if (/^\d{3} /.test(line)) break;
      if (!/^\d{3}-/.test(line)) break;
    }

    if (!/^\d{3} /.test(lastLine)) return null;
    const text = this.buffer.slice(0, consumed);
    this.buffer = this.buffer.slice(consumed);
    return { code: Number(lastLine.slice(0, 3)), text };
  }

  private fail(error: Error) {
    const waiters = this.waiters.splice(0);
    for (const waiter of waiters) waiter.reject(error);
  }
}
