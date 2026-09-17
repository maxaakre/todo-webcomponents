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
