# Daily Todo

A local-first daily planner built with **Lit** and **TypeScript**.

Not a bucket that grows forever. Every Task belongs to a **Day**, and anything you did not finish has to be dealt with deliberately the next morning — moved, dropped, or pushed to tomorrow.

The app is also a **learning vehicle for Lit and web components**, so idiomatic Lit is valued over feature count.

---

## Status

**Built and working.**

| | |
|---|---|
| Design decisions | **9 of 9 resolved** |
| The app | ✅ built, matches the design |
| Tests | ✅ **227 passing**: 68 app, 149 library, 10 React demo |

Also verified by hand in a browser: dark mode, and the full triage flow end to end.

---

## Getting started

**Requirements:** Node 24+, pnpm 10+.

```bash
pnpm install
pnpm dev
```

Then open **http://localhost:5173/**.

### Commands

| Command | Does |
|---|---|
| `pnpm dev` | Dev server with hot reload |
| `pnpm storybook` | The component library's Storybook |
| `pnpm build` | Typecheck (`tsc`) then bundle (`vite build`), for every workspace package |
| `pnpm preview` | Serve the production build locally |
| `pnpm test` | Run the test suite once |
| `pnpm test:watch` | Run tests in watch mode |

### Layout

A pnpm workspace. Run every command from the repo root.

- **`apps/daily-todo/`** — the app
- **`packages/ui/`** — `@maxaakre/ui` 0.1.0, the component library pulled out of this app: 6 components, Storybook, tokens. See [its README](./packages/ui/README.md) and [the spec](./docs/superpowers/specs/2026-09-25-ui-library-design.md)
- **`apps/react-demo/`** — every component used from React 19, with tests

### Versions

`lit` 3.3.3 · `typescript` 6.0.3 · `vite` 8.3.0

---

## How it works

### The vocabulary

Defined properly in [`CONTEXT.md`](./CONTEXT.md). In short:

- **Task** — one thing to do. Title, done, a Day, a position.
- **Day** — a dated bucket of Tasks. The unit you plan in.
- **Today** — whatever `currentDay()` resolves to. Not simply the calendar date.
- **Triage** — deciding the fate of Tasks left unfinished on an earlier Day.

### The daily flow

1. You open the app. Anything **unfinished from any earlier Day** is pulled in front of you — not just yesterday, so a skipped weekend cannot orphan Friday's work.
2. **Triage** shows two panes: unfinished work on the left, today's plan filling up on the right. Each leftover gets one of three verdicts — **Today**, **Tomorrow**, or **Drop**.
3. Once nothing is older than today, the view **collapses to a single-column Today** list. Triage is the transient state, not the resting one.
4. Triage never blocks you. Today stays visible and usable throughout.

Tasks moved into today land at the **bottom** of the plan — what you chose deliberately keeps its place.

A Task can also be **erased** from the list with the ✕ button. It **asks first**, in a dialog, because there is **no undo**: the Task never shows again. (Since ticket 13 of the sync map, the row stays in storage with `status: 'erased'`, but nothing in the UI brings it back.) After an erase, focus moves to the next Task.

### Storage

Everything lives in `localStorage` under **one key**:

```ts
"daily-todo/v1" → { version: 1, tasks: Task[] }

type Task = {
  id: string;        // crypto.randomUUID()
  title: string;
  done: boolean;
  day: string;       // "YYYY-MM-DD" — a LABEL
  order: number;     // integer, renumbered within a Day
  updatedAt: string; // ISO 8601 — an absolute INSTANT
}
```

A **Day is derived, not stored** — it is just a filter on `day`, so the two can never disagree.

`day` and `updatedAt` are deliberately different kinds of time. `day` is a label a future day-start setting could shift. `updatedAt` is an absolute instant and nothing about day handling may touch it.

**Single user, single device.** Multi-device sync is deferred, not abandoned — `id` and `updatedAt` exist so it stays possible without a rewrite.

### Safety rules

- **Nothing is ever wiped automatically.** An unrecognised `version` or an unparseable payload puts the app into a **read-only state with saving disabled**. Starting fresh is a button you press. There is one copy of this data and no undo.
- **Two tabs cannot clobber each other.** A tab re-reads on focus, and a save refuses to write if the stored document changed underneath it. A reload is silent; a discarded write tells you.

---

## Architecture

### Elements

```
<daily-todo-app>      root. Owns State, hosts DayController,
 │                    the ONLY caller of store.ts and storage.ts
 ├─ <task-composer>   the input        → task-added   { title }
 ├─ <triage-view>     two-pane         → task-triaged { id, verdict }
 │   └─ <task-list>   right pane
 └─ <task-list>       single column    → task-toggled { id }
                                       → task-deleted { id }
```

**Props down, events up.** No `@lit/context`, no signals. Child elements never mutate state — they dispatch a verdict and the root applies it.

### Plain TypeScript modules (no Lit imports)

| Module | Job |
|---|---|
| `store.ts` | Pure operations. `(state, …) => State`. No I/O. |
| `storage.ts` | The **only** module that touches `localStorage`. |
| `day.ts` | `currentDay()` — the single source of "today". |

`DayController` is a **Lit reactive controller**. It owns the `focus`/`visibilitychange` listeners, so the current Day re-resolves when you come back to the tab, and listener teardown is automatic.

### Styling

One global stylesheet holds the page reset and a token set on `:root`. Elements keep their own `static styles` and consume the tokens — **CSS custom properties are the one thing that crosses the shadow boundary**.

Dark mode follows the OS via `prefers-color-scheme`. No in-app toggle.

---

## Three ways this breaks silently

Each one fails with **no error**. Worth knowing before you write a line.

**1. Mutating state does not re-render.** Lit's change detection is strict `!==`.

```ts
this.tasks = [...this.tasks, task];  // re-renders
this.tasks.push(task);               // silently does nothing
```

**2. `useDefineForClassFields: false` is load-bearing.** In `tsconfig.json` it looks like cruft. Flip it to `true` and standard class-field semantics overwrite the accessors `@property` and `@state` install. Reactivity dies quietly. Do not "clean this up".

**3. Forgetting to save loses data.** Only the root's single apply-and-save funnel may call `store.ts` and `storage.ts`. Skip the save, or ignore the fact that `save()` can fail, and changes vanish with no warning.

---

## Where the decisions live

The design was worked out as a **wayfinder map** in `.scratch/daily-todo/`:

- **[`map.md`](.scratch/daily-todo/map.md)** — the destination, one line per decision, plus what is still fog and what is out of scope
- **`issues/01`–`09`** — one decision per ticket, each with the reasoning and the rejected alternatives

If you want to know *why* something is the way it is, the ticket says so.

### Branches

Two throwaway branches hold primary sources. Neither is merged, by design — `master` keeps only the decisions.

- **`prototype/triage-flow`** — the three Triage designs that were compared before picking the two-pane sorter. Run with `pnpm prototype`.
- **`research/lit-state-architecture`** — the cited report behind the props-down/events-up choice.

## Tests

`pnpm test` runs every package. The app has **68 tests**, in two Vitest projects: pure logic on happy-dom, and `elements.test.ts` in real Chromium. The split exists because happy-dom has no `ElementInternals`, and the app's form controls come from `@maxaakre/ui`, which is form-associated. The library has its own suite (`packages/ui`).

They concentrate on the places that fail **silently**:

- `day.test.ts` — that `currentDay()` is **local time, not UTC**, plus month, year and leap-day boundaries
- `store.test.ts` — the leftovers filter across multiple earlier Days, bottom-ordering on a move, Drop and Erase keeping the row as a tombstone, immutability
- `storage.test.ts` — the version and corrupt refusals leaving data **byte-identical**, and the cross-tab write guard
- `elements.test.ts` — the two-pane/single-column switch, the composer, the Erase confirmation and where focus lands after it, and the error screen, driven through the real elements in Chromium

The suite was **mutation-checked**: making a moved Task land at the top, switching `currentDay()` to UTC, wiping on a version mismatch, and removing the write guard each produced failures. It is not a suite that passes regardless.

### Deliberately out of scope

**Multi-user and accounts.**

Parked for later: multi-device sync, History and Backlog views, routing, keyboard and accessibility, deployment.
