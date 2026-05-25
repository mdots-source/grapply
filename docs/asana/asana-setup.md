# Grapply Asana Setup

This folder contains a ready-to-import Asana project plan for the Grapply frontend prototype.

## Project

Create one Asana project:

- Name: `Grapply - BJJ Academy OS`
- View: Board
- Default sections:
  - `00 Intake`
  - `01 Prototype Polish`
  - `02 Backend & Auth`
  - `03 Club Operations`
  - `04 Member Experience`
  - `05 Training & Content`
  - `06 Integrations`
  - `07 QA & Release`

## Custom Fields

Add these fields before or after import:

- `Owner Role`: Product, Design, Frontend, Backend, QA, DevOps
- `Priority`: P0, P1, P2, P3
- `Effort`: S, M, L
- `Milestone`: Prototype, Alpha, Beta, Launch

## Import

1. In Asana, create a new project.
2. Choose `Import spreadsheet` or `Add tasks via CSV`.
3. Import `grapply-asana-import.csv`.
4. Map `Section/Column` to Asana sections.
5. Keep `Owner Role`, `Priority`, `Effort`, and `Milestone` as custom fields.
6. Leave `Assignee` empty until real team emails are known.

## Operating Rules

- Keep implementation tasks tied to existing repo boundaries: `app/`, `components/`, `data/`, `lib/`, `supabase/`.
- Do not add capacity or occupancy work to schedule/dashboard unless product direction changes.
- Treat `/members` as the primary member surface; `/students` remains redirect-only.
- Backend tasks should respect the Supabase service-role boundary and never expose service keys to client code.
- UI tasks should use semantic theme tokens and existing button variants.
- Mark a task done only after typecheck/build or a focused manual verification has passed.

