# 07 — What happens when two tabs are open?

Type: grilling
Status: resolved
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

## Added after ticket 06

Ticket 06 deliberately gave the store **no `subscribe()`**: with one reader, the seam was hypothetical. This ticket is where a genuine second reader would appear. If the answer here needs one, that is the case being made — say so explicitly rather than adding it quietly.

Also settled by 06: `storage.ts` is the only module touching `localStorage`, and the root funnels every change through a single apply-and-save method. Any tab-awareness hangs off those two facts.

## Answer

Multi-tab divergence is handled, minimally, in two places — both inside `storage.ts`.

### Why it needed handling at all

State is **one key holding the whole document**, and every save writes all of it. So a stale tab does not lose one edit, it **overwrites everything the other tab did**. Open a tab in the morning, work in a second one all day, click once in the first, and the day is gone. That is severe enough to be worth a few lines.

### 1. Reload on focus

When a tab regains focus it **re-reads from storage** before doing anything. A stale tab stops being stale the moment you touch it.

This is nearly free: **`DayController` already listens to `focus`/`visibilitychange`** for the day boundary (ticket 04), so it is the same hook doing a second job.

It needs **no `subscribe()`** — the root re-reads, which is a read, not a subscription. Ticket 06's decision to omit the subscription stands.

Live `storage` events were rejected: real-time cross-tab updates are a lot of machinery for a single-user app on one machine.

### 2. A guard on write

Reload-on-focus does nothing for **two tabs both visible** — a second monitor, a split screen — where neither tab ever loses focus.

So `storage.ts` keeps the **exact raw string it last read**. On `save()` it re-reads and compares; if the stored document changed underneath, it **does not write**.

Detection is by **raw string comparison**, deliberately. It leaves ticket 03's shape untouched — `State` stays `{ version, tasks }`. A `writeToken` field would mean amending a resolved decision to add a field existing purely for this guard, when `localStorage` already hands over the serialized document.

On conflict the write is **discarded and the tab reloads**. Re-applying the operation on fresh data would be better, but that is merge logic, and merge logic belongs to the sync effort.

### What the user sees

- **A reload is silent.** Returning to a tab and finding current data is what people expect; a banner about it just draws attention to plumbing.
- **A discarded write is not silent.** "Changed in another tab — try again." The point of the guard was converting silent data loss into *one lost click*, which only works if the user knows the click was lost. Silent here would hand the data loss back in a different costume.

### Consequence for the storage interface

**`save()` can now fail.** That failure is part of its interface, not an implementation detail, and the root's single apply-and-save funnel (ticket 06) has to handle it: on failure, reload and surface the message rather than leaving the UI showing a change that was never written.
