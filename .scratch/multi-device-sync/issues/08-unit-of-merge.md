# 08 — What is the unit of merge, and what happens to a discarded write?

Type: grilling
Status: open
Blocked by: 03, 04, 05
Map: ../map.md

## Question

The centre of the map. Everything downstream is shaped by this.

- **Per-Task last-write-wins**, or **per-field**? Every Task already carries `updatedAt`, so per-Task is nearly free: two devices editing different Tasks both survive; two devices editing the *same* Task means the later write wins and the other is lost. Per-field means a title change on the phone and a `done` toggle on the laptop both survive — at the cost of a timestamp per field, on a model deliberately kept minimal.
- **Is a discarded write allowed to be silent?** `storage.ts` already refuses a conflicting write and tells the user — "changed in another tab, try again". The same instinct should apply across devices. A daily planner that quietly eats an edit is worse than one that admits it.
- Ticket 04 turns a delete into an edit. Does abandonment merge by the same rule as every other field, or does it **win regardless of timestamp**? An un-abandoning merge is the resurrection bug wearing a new coat.
- What is the merge unit when a device has been offline for a week — a queue of operations replayed, or one final state pushed? These give different answers, and the difference is only visible offline.

Ticket 05 decides which clock this rule may trust. Do not settle this before it.

## Comments

**2026-09-22, from the charting session.** The user chose **per-Task last-write-wins** over per-field. Reasoning: at near-zero concurrency the per-field case is close to fictional, and per-field merging puts a timestamp on every field of a deliberately minimal model.

**Treat this as a strong steer, not a resolution.** This ticket is blocked by ticket 05 for a reason: per-Task LWW names the *unit* but not the *clock*, and LWW on untrusted device clocks is not a design — a phone running fast wins every conflict, permanently and silently. Settle 05 first, then confirm or qualify this.

Also still open here: whether a discarded write may be silent (the charting recommendation was **no** — `storage.ts` already tells the user when it refuses a write), whether abandonment merges by the same rule or wins outright (see the note on ticket 04), and whether an offline week replays as a queue of operations or pushes one final state.

**2026-09-22, ticket 05 resolved — this ticket is now unblocked.** Constraints it hands over:

- **Device `updatedAt` decides**, with a server guard that rejects only **future-dated** writes (a few minutes' tolerance). Old writes are never rejected — that is what an offline queue looks like.
- The server returns **its own time** on each response so the client can warn about its own clock drift in either direction.
- **Ties break on device id**, higher wins, computable offline by both sides.
- Rejection over clamping, which matches this ticket's open question about whether a discarded write may be silent. Ticket 05 has already answered "no" once; be consistent.
- From ticket 04: abandoning and erasing **must set `updatedAt`**, and since the UI has no un-drop, **any resurrection is by definition a merge bug**.
