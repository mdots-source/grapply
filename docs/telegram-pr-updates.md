# Telegram PR updates

Grapply sends Telegram summaries when production (`main`) changes through the Vercel-hosted endpoint:

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
Events: Pushes
Active: yes
```

The endpoint only sends messages for pushes to `main`. This covers both direct commits to `main` and PR merges that update production. Pull request open/review events are ignored.

For PR merges, the message uses the merged PR title/body and touched files. For direct commits to `main`, it falls back to commit titles and file paths from the push payload.
