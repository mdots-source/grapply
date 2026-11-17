# Grapply

Grapply is a Brazilian Jiu-Jitsu academy management prototype. It brings member profiles, class scheduling, rankings, training activity, and academy operations into one workspace. The repository also includes a member-facing mobile experience.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS, AG Grid, and Recharts. The interface uses reusable components documented in the local UI Lab at `/ui`.

## Explore locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). In local development, the demo login is `sofia@grapply.app` with password `demo123`.

The app can run with mock data for exploration. Supabase-backed features require your own project and the environment variables described in `.env.example`. Never commit `.env.local` or service-role keys.

## What is included

- Academy dashboard, member directory, schedules, rankings, and competitions
- Training feed, TV display, role-aware club workspace, and member mobile view
- UI Lab with the project's buttons, cards, inputs, and other primitives
- Supabase schema and seed data for backend development

This is a portfolio prototype, not a production-ready academy service. Some flows use mock data and integrations require configuration.
