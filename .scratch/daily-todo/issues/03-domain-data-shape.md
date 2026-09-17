# 03 — The shape of a Task and a Day in storage

Type: grilling
Status: resolved
Blocked by: —
Map: ../map.md

## Question

What exactly is persisted, and in what shape?

Open sub-decisions:

- Is a **Day** a stored record, or derived by grouping Tasks by date?
- Does a Task hold a date, a `dayId`, or something else?
- How is **manual ordering** stored — array position, an integer rank, or a fractional index? Reordering and a future sync pull in different directions here.
- What exactly do `id` and `updatedAt` look like, given they exist to make sync possible later?
- What is the single `localStorage` key, and what is the top-level shape under it?

The glossary in `CONTEXT.md` names the terms. This ticket pins down their representation.

## Added after ticket 01

- The store is a **plain TypeScript module with no Lit imports**, exposing immutable operations that return new values. This ticket defines the values it returns.
- Ticket 01 raised a collision to settle here: is `updatedAt` an **absolute instant** (wall clock at write) while `Day` is a **label**? `CONTEXT.md` defines Today as `currentDay()`, deliberately not the calendar date — so the two must not be conflated. Coordinate with ticket 04.

## Answer

### The Task

```ts
type Task = {
  id: string;        // crypto.randomUUID()
  title: string;     // trimmed, non-empty
  done: boolean;
  day: string;       // "YYYY-MM-DD" — a LABEL. No time, no timezone.
  order: number;     // integer, 0..n within a Day
  updatedAt: string; // ISO 8601 — an absolute INSTANT, set on every write
};
```

Six fields, nothing else. No `createdAt`, no `completedAt`.

### The decisions behind it

- **A Day is derived, not stored.** Only Tasks are persisted; a Day is what you get by filtering on `day`. One entity means the two can never disagree, and **Triage** becomes a plain filter: unfinished Tasks whose `day` is before today. A stored Day record would make ordering trivial but add a second entity that can drift.
- **`id` is `crypto.randomUUID()`.** Built into the browser, no dependency. An incrementing counter was rejected outright: it collides the moment a second device exists, which is the whole reason ids exist here.
- **`day` and `updatedAt` are different kinds of time, deliberately.** `day` is a shiftable **label** — a future day-start setting (ticket 04) may change which Day an instant falls into. `updatedAt` is an **absolute instant** and day-start logic must never touch it. Stored as an ISO string rather than a number, for readability while inspecting `localStorage` in devtools.
- **Manual order is an integer, renumbered per Day.** Reordering rewrites every Task in that Day. At ~10 Tasks a Day this costs nothing. A **fractional index** (midpoint insertion, one-record writes, conflict-friendly) is the better technique and the obvious upgrade — but it spends the learning budget on ordering theory rather than on Lit, and swapping it in later changes only the store module.
  - Array position was ruled out: with derived Days, reordering within one Day would mean shuffling a global array spanning every Day.
- **Drop is a hard delete.** No tombstones. This is the one knowingly sync-hostile choice: without a tombstone, a delete here is indistinguishable from "the other device has a Task this one hasn't seen", so a dropped Task can resurrect when sync arrives. Accepted because tombstones tax every read, forever, for a payoff that may never be collected.

### Storage layout

One key, holding everything:

```ts
"daily-todo/v1" → { version: 1, tasks: Task[] }
```

Every write is atomic, the whole state is one `JSON.parse`, and **`version`** is the hook schema evolution needed — see ticket 08. A key-per-Day layout was rejected: Triage would have to read N keys just to find leftovers.

### Accepted risk

Rescheduled Tasks are **invisible until their Day arrives**. Today shows `day === today`; a Task pushed to Friday cannot be seen anywhere before Friday. Accepted for v1 — an "Upcoming" peek is a second view wearing a disguise, and views are out of v1 scope. Recorded in the map's fog; revisit if Tasks start getting lost.
