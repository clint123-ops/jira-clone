# Jira Clone

A local Jira clone – no users, no server. Data is stored in the browser (`localStorage`). The UI is in Polish.

## Getting started

```bash
npm install
npm run dev
```

The app runs at http://localhost:5173.

## Features

- Projects with a key (e.g. `FAV`) that issue keys are derived from (`FAV-1`, `FAV-2`…)
- Kanban board with drag & drop: To do → In progress → In review → Done
- Issue details: title, description, type, priority, status, labels, due date, comments, change history
- Backlog with sorting, search and filters (type, priority, label)
- "Dane" (Data) menu: JSON export/import, sample data, clear all
- "Motyw" (Theme) menu: Light, Dark, Midnight, Sepia, High contrast, or follow the OS setting (stored separately
  under `jira-clone-theme`)

## Tech stack

React 19 + TypeScript + Vite, `zustand` (state + `localStorage` persistence), `@dnd-kit` (drag & drop), `react-router`.

## Scripts

- `npm run dev` – dev server
- `npm run build` – type check + production build
- `npm run format` – format code (Prettier)
- `npm run ui-check` – screenshots at 3 resolutions + console errors + a11y check (requires a running dev server);
  `--theme <light|dark|midnight|warm|contrast>` checks a given color theme

## Contributing

See [AGENTS.md](AGENTS.md) for the required workflow (browser verification, independent code review, PR screenshots).
