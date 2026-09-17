# 06 — Which custom elements exist, and where are the seams?

Type: grilling
Status: open
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
