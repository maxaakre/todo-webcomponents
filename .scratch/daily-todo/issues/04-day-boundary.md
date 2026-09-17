# 04 — When does a Day end?

Type: grilling
Status: resolved
Blocked by: 03
Map: ../map.md

## Question

Settled already: **midnight in device local time, designed so a configurable day-start can be added later** — via a single `currentDay()` rather than `new Date()` scattered about.

What remains open:

- What does `currentDay()` return — a date string, a Day identity, something else? (Depends on 03.)
- What happens when the app is **left open across the boundary**? Does the view re-resolve, and does Triage appear unprompted mid-session?
- What triggers **Triage** exactly: any unfinished Task on any earlier Day, or only the immediately preceding Day?
- Does **reschedule** allow any future Day, or only tomorrow?
- Timezone changes and clock skew — ignored, or handled?

## Added after ticket 01

Ticket 01 flagged that `updatedAt` (for future sync) and `Day` (shiftable by a day-start setting) are different kinds of time. Be explicit: `updatedAt` is an absolute instant, `Day` is a label. Otherwise this ticket collides with 03.

## Answer

`currentDay()` returns a `"YYYY-MM-DD"` string in **device local time**, always. It is the only place the current Day is derived; nothing else calls `new Date()` to decide what today is.

### Triage looks at everything older than today

The filter is `day < today && !done`. **Not** just yesterday.

Only-yesterday has a hole you would hit inside a week: skip a weekend and Friday's leftovers never surface again, because Monday only inspects Sunday. Those Tasks stay in storage, appear nowhere, and are triaged never. With a derived Day, the broader filter is also the simpler query.

Consequences, all consistent:

- A Task rescheduled to tomorrow and still not done the day after **is** re-triaged. No orphans.
- A Task rescheduled to tomorrow is **not** re-triaged later the same day — its `day` is already in the future, so the filter excludes it.

### Crossing midnight while the app is open

**Re-resolve the Day on `focus` / `visibilitychange`.** If it changed while the tab was away, swap to the new Day and run Triage. **No midnight timer.**

The problem being solved is not cosmetic. With a stale view, adding a Task at 00:05 stamps it with today via `currentDay()` while the visible list is yesterday's — the Task disappears at the moment of creation. Re-resolving on return closes that.

A timer was rejected: it swaps the UI underneath someone mid-typing, and the realistic case is returning to the tab in the morning, which is exactly a visibility event. If the tab stays visible straight through midnight, staleness is accepted until the next interaction.

This is the same hook ticket 07 (multi-tab) will want, and it means **the current Day is runtime state that can change** — which ticket 06 must give an owner.

### Reschedule goes to tomorrow only

One button, no date picker.

This bounds the risk accepted in ticket 03: rescheduled Tasks are invisible until their Day arrives, so tomorrow-only caps that invisibility at **one day**. An arbitrary date picker lets a Task be buried in December and never seen again, and drags a date-picker UI into v1.

### Timezones and clock changes are ignored

Always device local time. `day` is a **label**, not an instant, so travelling or a DST shift cannot corrupt or lose anything — a Task simply appears under a different heading. `updatedAt` remains an absolute instant and is never touched by any of this.
