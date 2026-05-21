# OSS OS — Frontend Architecture & Codex Specification

## Project Goal

Build a premium frontend-first SaaS prototype for Brazilian Jiu-Jitsu academies.

The project should feel like:
- modern startup software
- premium dark SaaS
- combat sports platform
- community-driven system

Backend integration will happen later.

---

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Recharts

---

## Development Strategy

Frontend-first approach.

Use:
- mock data
- local state
- reusable components
- modular structure

Do NOT build:
- backend
- APIs
- Stripe
- production auth
- databases

---

## Main Pages

### Dashboard
- editable grid layout
- attendance graph
- leaderboard
- schedule widget
- recent activity
- draggable cards

### Students
- searchable table
- active/inactive status
- belt indicators
- attendance tracking

### Student Profile
- belt progression
- stripes
- attendance history
- streaks
- wins/losses

### Schedule
- weekly class schedule
- editable classes
- coach assignment
- belt color accents

### Rankings
- leaderboard
- ranking points
- wins/losses
- belt filters

### Training Feed
- post-style training history
- training summaries
- sparring highlights
- attendance recaps

### TV Screen
- fullscreen display
- active students
- belt colors
- rankings
- recent promotions

### Settings
- academy settings
- logo upload
- branding colors
- coach management

### Authentication
- login page
- register page
- dark premium UI

---

## UI Style

Theme:
- dark mode only
- black / graphite backgrounds
- premium contrast
- smooth animations

Design inspiration:
- Linear
- WHOOP
- Raycast
- Vercel

---

## Important Features

### Editable Dashboard
Use draggable and resizable widgets.

Suggested library:
- react-grid-layout

### Charts
Use Recharts for:
- attendance graphs
- activity graphs
- ranking statistics

### Motion
Use Framer Motion:
- smooth transitions
- hover animations
- glow effects
- subtle movement

---

## Suggested Folder Structure

/app
/components
/features
/data
/hooks
/lib
/styles
/types

---

## Codex Instructions

Build incrementally:

1. App shell
2. Sidebar
3. Dashboard
4. Students
5. Student profiles
6. Schedule
7. TV screen
8. Training feed
9. Rankings
10. Settings
11. Motion polish

Use mock data everywhere.

Focus on:
- frontend quality
- premium UI
- reusable architecture
- demo-ready experience

---

## Final Goal

Create a high-fidelity SaaS frontend prototype for BJJ academies that looks like a funded modern startup product.
