# AGENTS.md — OSS OS (BJJ Academy Prototype)

Instructions for AI coding agents working in this repository.

## Project summary

**OSS OS** is a premium frontend prototype for a Brazilian Jiu-Jitsu academy operating system (“Forge Jiu-Jitsu Academy”). It is **mock-data only** — no real backend, auth, or API layer yet.

- **Workspace:** `/Users/mishadots/Desktop/bjj`
- **Package name:** `oss-os-frontend-prototype`
- **Default dev URL:** http://localhost:3000

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 + CSS variables in `app/globals.css` |
| UI primitives | shadcn-style components in `components/ui/` |
| Tables | AG Grid (`ag-grid-react`) for Members, Rankings, Schedule |
| Charts | Recharts |
| Motion | Framer Motion (`components/motion/`, `PageTransition`) |
| Icons | `lucide-react` |

Path alias: `@/*` → project root (`tsconfig.json`).

## Commands

```bash
pnpm dev          # next dev --webpack → :3000
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # next lint
```

If `pnpm` is unavailable, run TypeScript via:

```bash
node node_modules/typescript/bin/tsc --noEmit
```

Do **not** commit unless the user explicitly asks. Do **not** push unless asked.

## Repository layout

```
app/                    # Next.js routes (pages)
  globals.css           # Theme tokens, AG Grid themes, glass utilities
  layout.tsx            # ThemeProvider + theme anti-flash script
  members/              # Members list + [id] detail
  students/             # Redirects only → /members
  schedule/, rankings/, tv/, settings/, ui/, ...
components/
  app-shell.tsx         # Sidebar nav + header (Profile top-right)
  ui/                   # Design system primitives (Button, Card, …)
  ui-lab/               # Dev-only UI Lab shell + Specimen (app/ui/*)
  members-grid.tsx      # AG Grid — members
  rankings-grid.tsx     # AG Grid — rankings
  schedule-grid.tsx     # AG Grid + week calendar
  motion/motion.tsx     # FadeIn, Stagger, StaggerItem, HoverLift
  providers/theme-provider.tsx
  settings/appearance-settings.tsx
data/                   # Mock seeds (single source of truth)
  academy.ts            # Student type, students, schedule, TV session
  competitions.ts, dashboard.ts, training-camps.ts
lib/
  theme.ts              # ThemeMode, localStorage key, applyTheme
  utils.ts              # cn()
```

## Routes

| Path | Purpose |
|------|---------|
| `/` | Dashboard (admin command center) |
| `/members`, `/members/[id]` | Members table + profile |
| `/students`, `/students/[id]` | **Redirects** to `/members` — keep for backwards compatibility |
| `/schedule` | Weekly class grid + calendar picker |
| `/rankings` | Points leaderboard (AG Grid) |
| `/competitions`, `/training-camps`, `/training-feed` | Feature pages with mock data |
| `/tv` | Fullscreen TV display (no AppShell) |
| `/settings` | Brand, appearance, coaches, TV toggles |
| `/ui`, `/ui/[slug]` | **UI Lab (dev only)** — not in product nav; one primitive per route |
| `/login`, `/register` | Auth shells (mock) |

Navigation is defined in `components/app-shell.tsx`. Profile link is **top-right**, not in the sidebar.

## Design system (required)

### Theme

- Modes: `dark` (default) and `light` via `data-theme` on `<html>`.
- Storage key: `oss-os-theme` (`lib/theme.ts`).
- Use semantic tokens — **never** hardcode `zinc-*` / `white/10` in new product UI:

  `--background`, `--foreground`, `--muted`, `--surface`, `--surface-hover`, `--border`, `--accent`, `--accent-foreground`, `--panel`, `--glass-top`, `--glass-bottom`

- Glass panels: class `glass` + optional `oss-hover-lift`.
- Theme toggle: **Settings → Appearance** only (`ThemeToggle`, `useTheme()` from `components/providers/theme-provider.tsx`). Never use `zinc-*` / `white/10` / `black/30` in product UI — use semantic tokens.

### Buttons

Canonical variants only (see `/ui`):

- `primary` — main CTA (accent fill)
- `surface` — default secondary actions
- `ghost` — low emphasis
- `outline` — bordered transparent

`default` and `secondary` exist as **deprecated aliases** for `surface` — prefer `surface` in new code.

Import: `@/components/ui/button`.

### Badges

Variants: `default`, `accent`, `success`, `muted`.

### Motion

- Page enter: wrap page content in `<PageTransition>` inside `AppShell`.
- Lists/cards: `FadeIn`, `Stagger` / `StaggerItem`, `HoverLift` from `@/components/motion/motion`.

Before inventing new button styles or colors, check **UI Lab** at `/ui` (e.g. `/ui/button`) — dev-only, not linked from `AppShell`.

## Data conventions

### Members (`Student` in `data/academy.ts`)

- UI label: **Members** (not Students).
- Type still named `Student` for historical reasons; export `students` is pre-sorted.
- Fields: `role` (`member` | `coach`), `belt`, `stripes`, `totalHours`, `points`, etc.
- **Members table sort:** `compareMemberHierarchy()` — coaches first, belt black→white, more stripes higher within belt.
- **Rankings sort:** by `points` descending — **not** hierarchy sort.
- Members grid columns: no status column; show **role** (after belt) and **total hours**.

### Schedule / dashboard

- Do **not** add fill/occupancy/capacity UI to schedule classes or dashboard “today’s classes” (product decision).

### TV screen (`/tv`)

- No rankings sidebar.
- Live clock, rotating athlete cards (6), rich session header.
- No fill/capacity indicators.

### Adding mock data

- Extend existing files under `data/` rather than inline arrays in pages.
- Keep types exported next to seeds in the same file.

## AG Grid

Shared theme classes in `app/globals.css`:

- `.oss-members-grid` — members
- `.oss-rankings-grid` — rankings  
- `.oss-schedule-grid` — schedule (taller rows)

Grids use `ag-theme-quartz` + CSS variables (`--ag-bg`, `--ag-row-hover`, etc.) so light/dark themes work.

Client components must use `"use client"` where hooks/grid APIs are used.

## Component patterns

1. **Pages** — thin: `AppShell` + title/subtitle + feature component.
2. **Feature logic** — `components/*-grid.tsx`, `components/dashboard/*`, etc.
3. **Drawers** — `MemberDrawer` + `components/ui/drawer.tsx` (sheet-based).
4. **Client boundaries** — add `"use client"` only when needed (state, motion, grid, theme).

## Code style

- Match existing file style (functional components, named exports).
- Minimal diffs; no drive-by refactors.
- Comments only for non-obvious business rules (e.g. belt hierarchy).
- No new test files unless requested.
- Prefer extending `data/*.ts` and `components/ui/*` over one-off duplicates.

## Common pitfalls

| Mistake | Correct approach |
|---------|------------------|
| New route `/students` as primary | Use `/members`; keep `/students` as redirect only |
| Sort rankings by belt | Sort by `points` |
| Hardcode `text-zinc-400` in shells | Use `text-[var(--muted)]` |
| New button color variants | Use existing four variants; update `/ui` if catalog changes |
| `pnpm` not in PATH | Use `node node_modules/typescript/bin/tsc` or full path to pnpm |
| Show capacity/fill on schedule | Removed by design — don’t reintroduce |
| Sidebar Profile link | Profile is in **header** top-right (`app-shell.tsx`) |

## Feature checklist (current state)

- [x] Members AG Grid + drawer + add member flow
- [x] Schedule AG Grid + shadcn calendar (week navigation)
- [x] Rankings AG Grid + belt filter tabs
- [x] Dashboard admin overview + academy updates
- [x] TV screen (rotating cards, live clock)
- [x] Light/dark theme + Settings appearance
- [x] UI Lab at `/ui` (dev-only, per-element routes)
- [ ] Real backend / auth / persistence
- [ ] i18n

## When unsure

1. Read `app/ui/*` lab pages and `app/globals.css` for visual rules.
2. Read `data/academy.ts` for domain types and sort helpers.
3. Grep for an existing pattern before adding a parallel implementation.
4. Run `pnpm typecheck` (or `node node_modules/typescript/bin/tsc --noEmit`) before finishing.
