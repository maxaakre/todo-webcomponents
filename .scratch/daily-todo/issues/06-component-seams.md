# 06 — Which custom elements exist, and where are the seams?

Type: grilling
Status: resolved
Blocked by: 01, 03
Map: ../map.md

## Question

What is the component decomposition, and what does each element own?

- Which custom elements exist, and what is each one's **public interface** — properties in, events out?
- Where does the **persistence boundary** sit? Which element (or non-element module) talks to `localStorage`, and how do the rest reach it?
- Which elements are **dumb and reusable**, and which are app-specific and stateful?
- What stays a plain TypeScript module rather than becoming an element?

Depends on 01 (how state flows) and 03 (what the data is). Consult `mattpocock-skills:codebase-design` for the deep-module vocabulary.

## Added after ticket 01

Ticket 01 is **resolved** and already fixes part of this: props down / events up, with a plain TypeScript store module owning `localStorage` and returning immutable values. What remains for this ticket is the element decomposition and the store's exact public interface.

One question 01 surfaced explicitly: **does the store expose a `subscribe()`, or is the root component its only reader?** A single reader is simpler and enough for v1, but a subscription is what a sync client — or another tab (ticket 07) — would later push into. It is the difference between adding a method and rewiring.

## Added after ticket 04

Ticket 04 made **the current Day runtime state**: it re-resolves on `focus`/`visibilitychange` and can change mid-session. This ticket must say **who owns it** — the root element, the store module, or a reactive controller — and how a change propagates to the view and triggers Triage.

A Lit **reactive controller** is the idiomatic answer to "a bit of state driven by browser events" and is worth evaluating here, since it is a core Lit concept the project has not otherwise touched.

## Added after ticket 05

Triage's shape is now decided (variant C, two-pane sorter, non-blocking). Two things fall to this ticket:

- The layout has **two states** — two-pane while anything is older than today, single-column Today once cleared. Is that one element that re-renders, two elements swapped by the root, or a route? It is the first real branching-view decision in the app.
- The prototype demoed the intended architecture and it held up: **variants never mutated**, they dispatched a `triage-action` verdict and the host applied it. Worth keeping as the pattern for the real elements.

The prototype's own decomposition is on branch `prototype/triage-flow` and is throwaway — do not promote it. It was written under prototype rules: no error handling, no abstractions.

## Answer

### The elements

```
<daily-todo-app>      root. Owns State, hosts DayController, the ONLY caller of
 │                    store.ts and storage.ts.
 ├─ <task-composer>   the input. → task-added { title }
 ├─ <triage-view>     two-pane. Rendered only while leftovers exist.
 │   │                Leftover rows are inline markup, not an element.
 │   │                → task-triaged { id, verdict }
 │   └─ <task-list>   the right pane — today's plan
 └─ <task-list>       single column, once nothing is older than today
                      → task-toggled { id }
```

`<task-list>` is **one element, always interactive** — no `readonly` property. The prototype's read-only right pane was a shortcut, not a decision: there is no reason to stop someone ticking a Task off during Triage. A boolean that changes behaviour would widen the interface and make the element answer for two modes.

The root swaps between `<triage-view>` and a bare `<task-list>` rather than one element rendering both layouts. Each element then commits to a single layout.

### The plain TypeScript modules (no Lit imports)

- **`store.ts`** — pure operations, `(state, …) => State`. A family of named functions (`addTask`, `toggleTask`, `triage`), **not** a `reduce(state, action)` reducer: the action union would only re-encode the function names, and plain functions read better cold.
- **`storage.ts`** — `load(): State` and `save(state): void`. **The only module that touches `localStorage`.**
- **`day.ts`** — `currentDay()`, from ticket 04.

### The persistence seam

Ticket 01 said "the store owns `localStorage`", but pure functions cannot do I/O. Resolved by splitting them: **`store.ts` computes, `storage.ts` persists.**

`storage.ts` is a **real seam, not a hypothetical one** — it gets its second adapter the moment sync arrives, and swapping to IndexedDB or a remote cache touches one file.

The cost is real: the root must `save()` after every change, and forgetting means **silent data loss**. Contain it with a **single funnel** — one private method on `<daily-todo-app>` that applies a store operation, sets state, and saves. Nothing else calls `store.ts` or `storage.ts`, ever.

### Who owns "today"

A **Lit reactive controller**, `DayController`. It owns the `focus`/`visibilitychange` listeners from ticket 04 and exposes the current Day.

Chosen over plain `@state` on the root because the controller makes the **listener lifecycle automatic** — attached on host connect, removed on disconnect, which is exactly the teardown people forget. It is also core Lit that this project had not touched, and ticket 07 wants the same hook, so the seam has two users rather than one.

### Events: specific, not generic

`task-added`, `task-toggled`, `task-triaged` — each with a small `detail`. **Not** one generic `task-action`.

A generic event is the action union in a costume, so choosing it here would contradict the store's shape. Specific events also match the DOM's own vocabulary and read plainly in templates: `@task-triaged=${…}`.

### No `subscribe()`

The store exposes no subscription. With props down / events up there is exactly **one** reader — the root — and *one adapter means a hypothetical seam*. Ticket 07 may produce a genuine second reader (another tab); it can make that case then.

### A note on method

Testability normally settles seam arguments — the interface is the test surface. **Tests are out of scope here**, so that lever was unavailable and these calls rest on **locality** and readability instead.

Two calls came from the **deletion test**: delete `<task-composer>` and input handling (trimming, rejecting empties, clearing, focus) reappears smeared across the root — it earns its keep. Delete `<triage-row>` and nothing reappears; the markup just moves up a level. So the composer is an element and the triage row is not.

## Addendum (from ticket 07)

`storage.ts` grew slightly, and both changes are part of its **interface**, not hidden inside it:

- **`load()` keeps the raw string it read**, for the write guard to compare against.
- **`save()` can fail** — when another tab changed the document first. The root's single apply-and-save funnel must handle that failure: reload, and tell the user the action did not apply. A funnel that ignores the return value reintroduces exactly the silent loss the guard exists to prevent.
