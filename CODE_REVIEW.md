# Code review — Grapply (первый релиз вёрстки)

Дата: 2026-05-21  
Ветка исправлений: `fix/code-review-v1`

## Резюме

Прототип в целом структурирован хорошо: mock-data в `data/`, тонкие страницы, общая тема через CSS-переменные. Основные риски — **гидрация AG Grid**, **доступность drawer/tabs**, **расхождение mock-данных с UI** и **жёстко зашитые цвета** в TV/части графиков.

Ниже — что исправлено в этом PR.

---

## Critical (исправлено)

| Проблема | Решение |
|----------|---------|
| AG Grid без client-only mount → риск hydration | `components/ag-grid-host.tsx` + обёртка во всех гридах |
| Тройная регистрация AG Grid modules | `lib/ag-grid-setup.ts` (один раз) |
| Нет `error.tsx` / `not-found.tsx` | `app/error.tsx`, `app/not-found.tsx` |

## High (исправлено)

| Проблема | Решение |
|----------|---------|
| Hardcoded «42» в Competition team | `countCompetitionTeam()` в `lib/members.ts` |
| Промо Noah: Blue vs Black belt | `data/dashboard.ts` |
| Дублирующие/чужие аватары в seed | `data/academy.ts` |
| Профиль: график = общая посещаемость | Подпись «Academy attendance (reference trend)» |
| Rankings: `window.location.href` | Убран `onRowClicked`, навигация через `Link` в ячейке |
| Recharts только под dark | Оси/tooltip/градиенты на `var(--*)` |
| Drawer без `role="dialog"` | `role="dialog"` + `aria-modal` на Sheet |
| QR localhost на TV | `getAppUrl()` + `.env.example` |
| Roster `student!` после filter | `resolveStudentsByIds()` с type guard |

## Medium (исправлено)

| Проблема | Решение |
|----------|---------|
| `secondary` в schedule | → `surface` |
| Нет колонки Time в schedule grid | Pinned column `time` |
| Tabs без ARIA | `role="tablist/tab/tabpanel"`, `aria-selected` |
| Nav без `aria-current` | В `app-shell` |
| Search без label | `aria-label` на members/rankings |
| Dead `react-grid-layout` | Удалён из deps и `globals.css` |
| Dead `.oss-students-grid` CSS | Убран дубликат |
| `latest` в package.json | Зафиксированы версии React, motion, recharts, … |
| Dashboard без PageTransition | Добавлен на `/` |
| TV card keys по slot | `key={athlete.id}` |
| Add member ID collision | `crypto.randomUUID()` |
| `prefers-reduced-motion` | `useReducedMotion` в PageTransition |

## Low (отложено / by design)

| Пункт | Статус |
|-------|--------|
| TV всегда тёмный (`zinc` hardcoded) | Оставлено — режим зала |
| `Student` vs `Member` в типах | Отложено (большой rename) |
| Radix Dialog вместо custom Drawer | Частично (ARIA на Sheet) |
| Dynamic import гридов | Отложено |
| Vercel ↔ GitHub auto-deploy | Нужно подключить GitHub в Vercel account |

---

## Проверки

```bash
node node_modules/next/dist/bin/next build --webpack  # OK
```

---

## Ссылки после merge

- Production: https://grapply.vercel.app
- GitHub: https://github.com/sonetta17/bjj
- UI Lab: https://grapply.vercel.app/ui
