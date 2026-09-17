# 04 — When does a Day end?

Type: grilling
Status: claimed
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
