# Context

Glossary for the daily todo app. Terms only — no implementation detail.

## Task

One thing the user intends to do. Minimally a **title** and a **done** state, plus a position in a manual ordering. A Task belongs to exactly one Day.

## Day

A dated bucket of Tasks — the unit the user plans in. "Today" is the Day the app opens on.

## Today

The Day currently in effect. Not simply the calendar date: it is whatever `currentDay()` resolves to, so that a later day-start setting (e.g. the day begins at 4am) can change it without changing anything else.

## Rollover

What becomes of a Task that was not done when its Day ended. Rollover is never automatic — it is resolved by Triage.

## Triage

The step the user is shown when opening the app on a new Day while unfinished Tasks remain on an earlier Day. For each such Task the user chooses: **move** it to Today, **drop** it, or **reschedule** it to a later Day.

## Reschedule

Move an open Task to **tomorrow** — never further. Offered in Triage, and on any open Task in Today. A rescheduled Task stays visible in the **Tomorrow** section until its Day comes, and can be moved back to Today from there.

## Drop

The Triage verdict meaning "I am not going to do this." A dropped Task is **abandoned, not erased** — deciding against something is an outcome, the same as finishing it.

## Abandoned

The state of a Task that was dropped. Alongside **done**, one of the two ways a Task can be finished with; a Task that is neither is still open. Abandonment is **final** — there is no un-dropping.

## Erase

What the `×` on a Task means: **this should never have existed** — a typo, a duplicate, a mistake. Distinct from **Drop**: dropping is a decision about work, erasing is a correction to the record. Pressing `×` always means erase, whatever the Task's age.

## Erased

The state of a Task that was erased. Unlike **done** and **abandoned**, it is not an outcome — it is a claim that the Task never counted.

## Device

One place the user runs the app — their laptop, their phone. A Device has its own clock, its own idea of which Day is **Today**, and its own copy of the Tasks. Devices belong to one person; there is no notion of another person's Device.
