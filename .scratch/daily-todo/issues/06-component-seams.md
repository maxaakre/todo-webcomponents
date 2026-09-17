# 06 — Which custom elements exist, and where are the seams?

Type: grilling
Status: claimed
Blocked by: 01, 03
Map: ../map.md

## Question

What is the component decomposition, and what does each element own?

- Which custom elements exist, and what is each one's **public interface** — properties in, events out?
- Where does the **persistence boundary** sit? Which element (or non-element module) talks to `localStorage`, and how do the rest reach it?
- Which elements are **dumb and reusable**, and which are app-specific and stateful?
- What stays a plain TypeScript module rather than becoming an element?

Depends on 01 (how state flows) and 03 (what the data is). Consult `mattpocock-skills:codebase-design` for the deep-module vocabulary.

## Added after ticket 01

Ticket 01 is **resolved** and already fixes part of this: props down / events up, with a plain TypeScript store module owning `localStorage` and returning immutable values. What remains for this ticket is the element decomposition and the store's exact public interface.

One question 01 surfaced explicitly: **does the store expose a `subscribe()`, or is the root component its only reader?** A single reader is simpler and enough for v1, but a subscription is what a sync client — or another tab (ticket 07) — would later push into. It is the difference between adding a method and rewiring.

## Added after ticket 04

Ticket 04 made **the current Day runtime state**: it re-resolves on `focus`/`visibilitychange` and can change mid-session. This ticket must say **who owns it** — the root element, the store module, or a reactive controller — and how a change propagates to the view and triggers Triage.

A Lit **reactive controller** is the idiomatic answer to "a bit of state driven by browser events" and is worth evaluating here, since it is a core Lit concept the project has not otherwise touched.

## Added after ticket 05

Triage's shape is now decided (variant C, two-pane sorter, non-blocking). Two things fall to this ticket:

- The layout has **two states** — two-pane while anything is older than today, single-column Today once cleared. Is that one element that re-renders, two elements swapped by the root, or a route? It is the first real branching-view decision in the app.
- The prototype demoed the intended architecture and it held up: **variants never mutated**, they dispatched a `triage-action` verdict and the host applied it. Worth keeping as the pattern for the real elements.

The prototype's own decomposition is on branch `prototype/triage-flow` and is throwaway — do not promote it. It was written under prototype rules: no error handling, no abstractions.
