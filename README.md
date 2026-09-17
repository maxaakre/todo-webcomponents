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
| Automated tests | none — out of scope |

Verified by hand in a browser: triage (move / tomorrow / drop), moved Tasks landing at the bottom, the collapse to single-column, persistence across reload, dark mode, the version and corrupt-payload refusals, and the cross-tab write guard.

There are **no automated tests** — deliberately out of scope — so treat that verification as a snapshot, not a safety net.

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
| `pnpm build` | Typecheck (`tsc`) then bundle (`vite build`) |
| `pnpm preview` | Serve the production build locally |

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

### Deliberately out of scope

**Multi-user and accounts**, and **automated tests**.

Parked for later: multi-device sync, History and Backlog views, routing, keyboard and accessibility, deployment.
