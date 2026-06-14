# Grapply Production Environment

Required for the live demo backend:

```text
NEXT_PUBLIC_APP_URL=https://grapply.me
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Optional for outbound transactional emails. Registration and club invites do not require email delivery; club admins can create an invite by email and copy/open the invite link manually. Use either Resend or Gmail SMTP when automatic email delivery is enabled again.

```text
RESEND_API_KEY=
RESEND_FROM_EMAIL=Grapply <reg@grapply.app>
```

Or:

```text
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-google-app-password
GMAIL_FROM_EMAIL=Grapply <reg@grapply.app>
```

For Gmail, create a Google app password and use it as `GMAIL_APP_PASSWORD`; do not use the normal Gmail login password. Advanced SMTP settings are also supported through `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`, `SMTP_SECURE`, and `SMTP_STARTTLS`.

With Resend, verify `grapply.app` in Resend first, then add the DNS records Resend provides for SPF, DKIM, and DMARC. `RESEND_FROM_EMAIL` must use a verified sender on that domain, for example `Grapply <reg@grapply.app>`. When no email provider env vars are present, welcome, magic link, and password reset emails stay queued in `email_outbox` and the admin email panel disables manual sending.

Transactional emails are sent as multipart messages: a plain text fallback plus a branded Grapply HTML layout with a clear call-to-action button.

Supabase Auth should allow the production app URL and callbacks:

```text
SITE_URL=https://grapply.me
REDIRECT_URLS=https://grapply.me/auth/callback,https://grapply.me/login,https://grapply.me/register
```

Required for Strava integration:

```text
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=https://grapply.me/api/strava/callback
```

Required for GitHub production summary notifications:

```text
GITHUB_WEBHOOK_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Manual billing is the current product model. Stripe checkout and webhooks are intentionally out of scope for this phase.

Backend health and error traceability:

```text
GET /api/health/backend
```

The health check reports Supabase table access, email delivery, Strava OAuth configuration, the public HTTPS app URL, and the `app_error_events` observability table. Backend/Supabase failures return `X-Request-Id` and are recorded in `app_error_events` when Supabase is reachable. If email provider env vars, Strava credentials, or `NEXT_PUBLIC_APP_URL` are missing, the backend status is degraded until the production env is complete.

RLS and role expectations are documented in `docs/security-rls.md`.
