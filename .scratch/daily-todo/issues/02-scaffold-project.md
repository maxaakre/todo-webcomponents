# 02 — Scaffold the Lit + TypeScript project

Type: task
Status: open
Blocked by: —
Map: ../map.md

## Question

Nothing to decide — this unblocks the prototype, which needs somewhere to run.

Stand up a working Vite + TypeScript + Lit project in this repo:

- Vite with the TypeScript template, Lit added
- `tsconfig.json` configured for Lit's decorators (`experimentalDecorators` / `useDefineForClassFields` as Lit's docs require)
- One trivial custom element rendering, dev server confirmed running
- No test tooling (ruled out — see the map's Out of scope)

Record in the answer: the **exact versions installed**, the **dev command**, and any tsconfig setting that was non-obvious, since later tickets will depend on knowing them.

## Added after ticket 01

Install **no state library** — not `@lit/context`, not `@lit-labs/signals`. Ticket 01 settled on props down / events up over a plain TypeScript store module. Current stable core is `lit@3.3.3`; verify before installing.
