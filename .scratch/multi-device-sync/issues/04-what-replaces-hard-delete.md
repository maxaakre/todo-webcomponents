# 04 — What replaces hard delete?

Type: grilling
Status: resolved
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

## Answer

**A `status` enum replaces hard delete. Nothing is ever removed from the array again.**

```
status: 'open' | 'done' | 'abandoned' | 'erased'
```

`done: boolean` **disappears** into it. The illegal state — done *and* abandoned — stops being representable, and the shape now matches the glossary, where done and abandoned are the two ways a Task is finished with.

**Drop and `×` are different acts, and the code was wrong to conflate them.**

| | Where it appears | Means | Status |
|---|---|---|---|
| **Drop** | Leftovers only, in Triage | "I decided not to do this" — a fact about work | `abandoned` |
| **`×`** | Today's list only, via `<task-list>` | "This should never have existed" — typo, duplicate | `erased` |

A user never sees both on the same Task, which is why the conflation survived unnoticed.

**`×` is always an erase, whatever the Task's age.** Rejected: a time window that reclassifies the act after N minutes. It would need a **device clock**, and ticket 05 exists because those cannot be trusted — a rule that silently changes what an action *means* based on an untrustworthy timestamp is a bad rule.

**Abandonment is final in the UI, recoverable in the data.** No un-drop. Since any reappearance is therefore never a user action, **any resurrection is by definition a merge bug** — which is the argument, on ticket 08, for abandonment winning a merge regardless of timestamp.

**Tombstones are kept forever.** A decade of daily planning is kilobytes. Pruning sounds tidy and quietly reintroduces resurrection: a device offline since before a prune returns holding Tasks the server has forgotten. If it is ever done, the rule must be time-based and longer than the worst offline gap.

**Nothing new appears in the UI.** Abandoned and erased Tasks both vanish from view exactly as they do today. **On one device, v1 and v2 behave identically** — the entire change is invisible until a second device exists. Worth saying out loud, because this is work that looks like it did nothing.

### Two consequences that leave this ticket

**1. `deleteTask` never touches `updatedAt` — today it only filters the array.** The moment a drop becomes a tombstone it must carry a timestamp, or it merges as the oldest possible version and **loses every conflict it enters**. Abandoning and erasing must both set `updatedAt`. Ticket 08 depends on this.

**2. The enum holds two different kinds of thing.** `open`, `done` and `abandoned` describe *work*; `erased` is a claim the Task never counted. Accepted knowingly as the price of one code path, one merge rule and one migration — but it is the seam to watch if the model is ever revisited.

### Scheduling

This needs a schema bump, **v1 → v2, and it should be done now, before sync exists.** Today there is one device and one copy, so the migration is a pure function and nothing more. Once the phone is live the same migration must reach a device that may be offline, on a stale cached build, or freshly wiped by Safari. This is the cheapest this change will ever be. Split out as ticket 13.
