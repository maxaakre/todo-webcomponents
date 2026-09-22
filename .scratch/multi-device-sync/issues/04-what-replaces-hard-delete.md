# 04 — What replaces hard delete?

Type: grilling
Status: open
Blocked by: —
Map: ../map.md

## Question

The single most sync-hostile thing in the codebase. `deleteTask` removes the row outright, and `drop` calls it. On two devices a deleted Task is **indistinguishable from a Task the other device has not seen yet — so it comes back.**

Settled while charting, and recorded in `CONTEXT.md`: a dropped Task is **abandoned, not erased**. Deciding against something is an outcome, like finishing it. What remains is the shape:

- Does `Task` gain a **status** (`open` / `done` / `abandoned`), or a nullable `abandonedAt`? Is `done: boolean` absorbed into that status, or left alone?
- **Can an abandoned Task come back?** The recommendation while charting was **final in the UI, recoverable in the data** — Triage is about committing, and an undo button turns the abandoned pile into a backlog, which the README rejects. Confirm or overturn: it changes what Triage means.
- Does the manual `deleteTask` (the Today-list delete, added after the predecessor map closed) mean the same thing as `drop`, or is it a genuine "this was a mistake, it never happened"? **Two different intentions may be sharing one function.**
- Do abandoned Tasks ever get collected, or is the record permanent? Permanent means storage grows forever — which the app's whole ethos is against.
- Does this need a schema version bump, and does that collide with ticket 12?

## Comments

**2026-09-22, from the charting session.** The user settled the un-drop sub-question: **final in the UI, recoverable in the data.** Triage is about committing to a plan; an undo button turns the abandoned pile into a backlog, which the README rejects. The record persists so History and sync work, but the user is given no door back.

Recorded in `CONTEXT.md` under **Abandoned**.

Still open on this ticket: the shape of the status field, whether `done` is absorbed into it, whether the manual Today-list delete means the same thing as `drop`, whether tombstones are ever collected, and the schema bump.

**Note for whoever works this with ticket 08.** "No un-drop in the UI" plus per-Task last-write-wins has a sharp consequence: if abandonment merges by plain timestamp, then a device that touches the Task later — toggling `done` on a stale offline copy, say — **un-abandons it**. Since the UI offers no un-drop, *any* resurrection is by definition a merge bug. That argues abandonment should win regardless of timestamp. Ticket 08 asks this question; this is the reason it matters.
