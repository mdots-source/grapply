# Telegram Production Updates

Production updates are sent from GitHub Actions when `main` changes.

Workflow:

```text
.github/workflows/telegram-production-summary.yml
```

Required GitHub secrets:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

Current chat:

```text
TELEGRAM_CHAT_ID=-5273888010
```

The old Vercel webhook is disabled. Keep one notification path active to avoid duplicate Telegram messages.
