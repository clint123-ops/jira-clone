# Agent instructions

## Project

A local Jira clone: React 19 + TypeScript + Vite, no backend and no users. Data lives in `localStorage` (key
`jira-clone-data`); a fresh browser starts with sample data (`src/sample.ts`).

**Language:** everything in the repository – code, comments, docs, commit messages, PR titles and descriptions – is in
English. The only exception is the app UI (user-facing strings), which is in Polish.

| Command                          | Purpose                                                    |
| -------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                    | dev server at http://localhost:5173                        |
| `npx tsc`                        | type check                                                 |
| `npm run build`                  | type check + production build                              |
| `npm run format`                 | Prettier                                                   |
| `npm run ui-check`               | screenshots at 3 resolutions + console errors + a11y (axe) |
| `scripts/publish-screenshots.sh` | publish screenshots for a PR (see below)                   |

## Required workflow after you finish coding

A change is not done until it has passed **all** steps below, in this order. If any step reveals a problem, fix it and
go back to step 1. Never report work as done without these steps; if a step could not be performed, say so explicitly
(in your reply and in the PR description) instead of skipping it.

### 1. Static checks

`npx tsc`, `npm run build`, `npm run format` – no errors.

### 2. Click through it in the browser

Start the dev server (`npm run dev`, or the `dev` configuration in `.claude/launch.json`) and **click through the change
yourself** in the browser, using real clicks and the keyboard – not just JS calls. Check:

- **The changed feature** – the main path, edge cases (empty data, long text, Polish characters, invalid input),
  cancelling, and reloading the page (does the state survive in `localStorage`).
- **A quick regression pass over the core flows**: project list → board → drag a card between columns → open an issue
  → edit a field → comment → history → create an issue → backlog (search, filter, sort).
- **The browser console** – zero errors and zero React warnings.
- **UX/UI** – nothing breaks the layout, text is not clipped or overlapping, spacing and alignment match the rest of
  the app, hover/focus/disabled/empty/error states are handled, every action gives feedback (toast, view change), and
  irreversible actions ask for confirmation.
- **Accessibility (a11y)** – everything works with the keyboard (Tab, Enter, Space, Escape), focus is visible, every
  form control and icon button has a label, roles and `aria-*` are correct, Escape closes dialogs and menus, and text
  contrast meets at least WCAG AA.

Tips:

- Drag & drop (`@dnd-kit`) needs a series of `pointermove` events – a single tool "drag" is often not enough; if
  needed, dispatch `pointerdown`, a dozen `pointermove`s with small delays, then `pointerup`.
- Deleting and importing ask via `window.confirm` – if your tool cannot click it, test the logic another way and
  mention it in your report.
- With an emulated (scaled) viewport in the browser pane, coordinate clicks can miss – click by `ref`, and check
  resolutions with `npm run ui-check`.

### 3. Automated UI and a11y check

With the dev server running:

```bash
npm run ui-check -- --out screenshots/<branch-name> --pages <paths affected by the change>
```

Without `--pages` it checks projects, board, backlog, an open issue and settings. Add paths that show your change (e.g.
`/p/FAV/board?issue=FAV-3` opens the issue dialog). Required: exit code 0 – no console errors, no horizontal page
overflow, no `serious`/`critical` a11y violations. Also fix `moderate`/`minor` warnings in code you are changing.

**Look at every screenshot** (desktop 1440×900, tablet 768×1024, mobile 375×812) and review it like a designer:
clipped text, overlapping elements, awkward gaps, things unreadable on a phone, inconsistent spacing. Any problem = fix
it and go back to step 1.

### 4. Independent code review

Only after steps 2 and 3 confirm that everything works and looks right, request an **independent** review of the whole
diff against `main` – the reviewer must not share your reasoning from the implementation:

- use `/code-review`, or launch a separate subagent with a clean context, giving it only the goal of the change and
  `git diff main...HEAD`;
- the reviewer looks for correctness bugs, edge cases, regressions, a11y problems and inconsistencies with the rest of
  the code.

Fix every confirmed finding, then **go back to step 1** (changes made after review must be clicked through too). List
rejected findings in the PR with the reasoning.

### 5. Pull request

- Work on a branch (`feat/…`, `fix/…`), never directly on `main`.
- Generate fresh screenshots (step 3) **after the last fix** and publish them:

  ```bash
  scripts/publish-screenshots.sh screenshots/<branch-name>
  ```

  The script pushes the files to the `pr-screenshots` branch and prints a Markdown table with the images – paste it
  into the PR description. `screenshots/` is in `.gitignore`; never commit screenshots to a code branch.

- The PR description must contain:

  ```markdown
  ## What and why

  ## How it was verified

  - Clicked through in the browser: <flows and edge cases>
  - `npm run ui-check`: <result>
  - Code review: <findings, what was fixed, what was rejected and why>
  - Not verified: <what could not be checked and why – or "nothing">

  ## Screenshots

  <table from publish-screenshots.sh – desktop, tablet, mobile>
  ```

- After creating the PR, open it on GitHub and check that every image renders.
