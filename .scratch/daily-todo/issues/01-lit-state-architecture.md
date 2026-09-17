# 01 — How state flows between Lit components

Type: research
Status: resolved
Blocked by: —
Map: ../map.md

## Question

What is the **current recommended way to share and propagate application state across Lit components**, and which fits a small single-user app best?

Compare, against Lit's own documentation and release notes (not blog hearsay):

- **Props down, events up** — plain custom-element idiom, no extra machinery
- **A store element plus `@lit/context`** — shared state injected down the tree
- **Lit Signals** (`@lit-labs/signals`) — fine-grained reactivity

For each, establish: its current status (stable / labs / deprecated), what it costs in boilerplate, how it behaves with `localStorage` as the source of truth, and how well it survives a later move to synced remote state.

Record the **package names and versions** that are current, since this is the fact most likely to be stale.

Output a recommendation with reasoning, not just a summary.

## Answer

**Top-down data flow with immutable objects, over a plain TypeScript store module that owns `localStorage`.** Properties down, events up. No `@lit/context` yet. Not `@lit-labs/signals`.

The decisive facts (all verified against lit.dev, the `lit` GitHub repo and the npm registry on 2026-09-17):

- **`@lit-labs/signals` is ruled out.** Labs `0.3.0`; its own README says "not recommended for production use"; listed under "Under development", not "Near graduation"; sits on a TC39 proposal still at **Stage 1**. `0.2.0` silently changed `watch` semantics in a 0.x minor. Debugging a moving Labs package is the worst possible use of a learning budget.
- **`@lit/context` is stable (`1.1.6`, graduated from labs) but premature.** lit.dev scopes context to data needed by "a wide variety and large number of components". This tree is ~3 deep. Crucially, **context solves distribution, not observation** — it notifies on value identity, so providing a long-lived store instance re-renders nothing when a Task inside it changes. Lit's own RFC 0005 confirms Lit has no endorsed shared *observable* state system.
- **Props/events is what lit.dev teaches and recommends**: "In general, using top-down data flow with immutable objects is best for most applications." It is the DOM's own model, so it transfers beyond Lit — which matters because learning is this map's destination.

**The real decision is the store seam, not the transport.** A plain TypeScript module with no Lit imports, exposing immutable operations (`loadDay`, `addTask`, `toggleTask`, `triage` — each returning a new value). All three transports route persistence through it, so "which survives sync best" is nearly a non-question. It also keeps `localStorage` swappable, honouring the map's deferred-sync requirement cheaply.

**Load-bearing discipline:** Lit's change detection is strict `!==`. Mutating an array or object does not re-render — it fails *silently*. Immutable updates are mandatory, not stylistic.

**Revisit triggers** (evidence, not vibes):
- Adopt `@lit/context` when state is drilled through a component that does not use it, twice — or when routing and a second view land.
- Reconsider signals only when the package ships as `@lit/signals` or reaches "Near graduation".

Full report with citations: `.scratch/daily-todo/research/lit-state-architecture.md` on branch **`research/lit-state-architecture`** (commit `673f10c`).
