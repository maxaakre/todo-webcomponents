# 09 — How does `order` survive merging?

Type: grilling
Status: open
Blocked by: 08
Map: ../map.md

## Question

`order` is an **integer, renumbered within a Day**, and `nextOrder` assigns `max + 1`. This is close to the worst possible shape for merging:

- Two devices each add a Task to the same Day offline. Both get the **same `order`**. On merge the tie is broken by nothing.
- A reorder rewrites **several rows at once**, so a per-Task merge rule sees an unrelated cluster of edits and can interleave them into an order neither device chose.

- Does `order` become a **fractional index** (a sortable string between its neighbours, so an insert touches exactly one row)? That is the standard answer, and it is a genuinely interesting thing to learn.
- Or does manual ordering get **weakened** — sorted by creation time, say — because it is not worth the machinery?
- Ticket 04's triage moves a Task to the bottom of its destination Day. Does that still mean anything when two devices disagree about what the bottom is?
- Whatever is chosen: `order` is persisted, so **this needs a migration**, and ticket 12 needs to know.
