# Telegram PR updates

Grapply sends pull request summaries to Telegram through the Vercel-hosted endpoint:

```text
POST /api/github/pr-summary
```

After deployment, `GET /api/github/pr-summary` returns a small healthcheck response.

## Vercel environment variables

Set these variables for Production in the Vercel project:

```text
GITHUB_WEBHOOK_SECRET=<the shared secret configured on GitHub webhook 635803207>
TELEGRAM_BOT_TOKEN=<Telegram bot token>
TELEGRAM_CHAT_ID=-5273888010
```

The same `GITHUB_WEBHOOK_SECRET` value must be used in the GitHub webhook settings.

## GitHub webhook

Webhook `635803207` is already active in `mdots-source/grapply`:

```text
Payload URL: https://grapply.vercel.app/api/github/pr-summary
Content type: application/json
Secret: same value as GITHUB_WEBHOOK_SECRET
Events: Pull requests
Active: yes
```

The endpoint only sends messages for pull requests targeting `main`. Draft PRs and PRs closed without merge are ignored.
