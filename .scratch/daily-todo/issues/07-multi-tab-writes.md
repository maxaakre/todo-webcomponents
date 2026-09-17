# 07 — What happens when two tabs are open?

Type: grilling
Status: open
Blocked by: 03
Map: ../map.md

## Question

Surfaced by the state-architecture research: **multi-tab is an unplanned mini-sync problem, and it is live from day one.** Two tabs open on the app means two writers over one `localStorage`. The map defers multi-*device* sync; it never mentions multi-*tab*, which needs no new infrastructure to occur.

- Is divergence between tabs **acceptable** for v1 (last write wins, silently), or does it need handling?
- The `storage` event fires in *other* tabs, not the writer. Is listening to it worth it now — a cheap rehearsal for real sync — or premature?
- Does this change the store module's interface (a `subscribe()`, a reload-on-focus), or is it purely a behaviour question?

Cheap to decide now; awkward to retrofit once the store's shape is fixed.

## Added after ticket 04

Ticket 04 already commits the app to re-resolving state on **`focus` / `visibilitychange`**. That is the same hook a reload-on-focus answer to multi-tab would use, so much of the cost may already be paid — check before treating tab-awareness as new work.
