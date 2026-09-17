# 03 — The shape of a Task and a Day in storage

Type: grilling
Status: open
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
