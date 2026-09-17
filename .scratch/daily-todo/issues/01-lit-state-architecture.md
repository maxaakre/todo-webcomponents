# 01 — How state flows between Lit components

Type: research
Status: open
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
