# 05 — Prototype the Triage flow

Type: prototype
Status: resolved
Blocked by: 02, 03, 04
Map: ../map.md

## Question

What should **Triage** look and feel like?

It is the one interaction that makes this a *daily plan* rather than a growing list, and it is the hardest thing to judge in the abstract. Build a rough, throwaway Lit prototype to react to.

Things the prototype should force a reaction to:

- All leftovers on one screen, or one Task at a time?
- Is Triage a **blocking gate** before Today, or skippable?
- How are move / drop / reschedule presented — buttons, swipe, keyboard?
- What does Today look like when there is nothing to triage?
- What does an empty Day look like?

Link the prototype from this ticket rather than pasting it in.

## Answer

**Variant C — the two-pane sorter — wins.** Prototype and all three variants are on branch **`prototype/triage-flow`** (run with `pnpm prototype`); only the decision is recorded here.

### What C is

Two panes: **unfinished work on the left, today's plan filling up on the right.** Each leftover carries three actions — *→ Today*, *Tomorrow*, *Drop*. The framing is **committing to a plan**, not clearing an inbox: you watch today's plan grow as you pull work across.

### Why it beat the others

- **A (blocking full-screen queue, one Task at a time)** — good on day one, hostile by week three. It stands between you and your list every single morning, including the mornings with nothing to decide. The `nothing-to-triage` scenario makes this obvious: a whole screen dedicated to nothing.
- **B (non-blocking inline banner above Today)** — safe but weightless. Its *Move all to today* button is one click that undoes the entire point of triage, which makes the deliberate act optional and therefore skipped.
- **C** keeps Today visible the whole time, so the decision is made **in context** — you can see what you have already committed to before deciding whether an old Task deserves a slot.

### Two refinements the prototype exposed

**1. C must collapse once triage is done.** With the left pane empty, half the screen is a large box reading "All cleared." C reads best *during* triage and worst for the rest of the day, which is most of it. Once there is nothing older than today, **drop to a single-column Today view** — the two-pane layout is the triage state, not the resting state.

**2. A moved Task lands at the BOTTOM of today's plan.** See the addendum on ticket 03.

### Still open, deliberately

Whether Triage is a hard gate was answered implicitly: **C is non-blocking** — Today is visible and usable throughout. No modal, no forced queue.
