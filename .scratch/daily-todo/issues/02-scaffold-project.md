# 02 — Scaffold the Lit + TypeScript project

Type: task
Status: resolved
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

## Answer

Done. Generated from the official Vite template (`pnpm create vite --template lit-ts`) rather than hand-written, so the toolchain matches what Lit's own docs assume.

### Versions installed (2026-09-17)

| | |
|---|---|
| `lit` | **3.3.3** |
| `typescript` | **6.0.3** (range `~6.0.2`; **7.0.2** is available — not taken) |
| `vite` | **8.3.0** |
| node / pnpm | 24.1.0 / 10.33.0 |

No state library — not `@lit/context`, not `@lit-labs/signals`, per ticket 01. No test tooling, per the map's Out of scope.

### Commands

- `pnpm dev` → dev server on **http://localhost:5173/**
- `pnpm build` → `tsc && vite build`
- `pnpm preview`

### tsconfig settings worth knowing

- **`useDefineForClassFields: false`** — the load-bearing one. With `experimentalDecorators`, standard class-field semantics would overwrite the accessors Lit's `@property` / `@state` install, and reactivity silently dies. Do not "clean this up".
- **`experimentalDecorators: true`** — legacy decorators, which is what Lit 3's decorators still target.
- **`erasableSyntaxOnly: true`** ships in the template and **coexists with decorators fine** — verified by a passing `pnpm build`, not assumed.
- `verbatimModuleSyntax: true` means type-only imports must be written `import type { ... }`.

### What was verified, and how

- `pnpm build` passes: 22 modules, no type errors.
- Loaded the dev server in a real browser. The element **upgrades and renders through shadow DOM** (a11y tree shows the heading, text and button).
- **Reactivity confirmed deterministically**: one programmatic `button.click()` took the counter 9 → 10, with `await updateComplete`. One instance on the page, one constructor.
- Left idle for 1.5s after a reload the count stayed at 0 — it does not self-increment.
- Console is clean apart from Lit's expected dev-mode warning.

A note on a red herring: driving the button through browser automation appeared to increment by more than one per click. That was the button retaining **focus** while automation ran, not a double-fire — hence the programmatic check above, which is exact.

### What is in the repo

- `index.html`, `src/daily-todo-app.ts`, `public/favicon.svg`, `package.json`, `tsconfig.json`
- The template's demo assets (`hero.png`, `lit.svg`, `vite.svg`, `icons.svg`, `index.css`) were dropped as clutter.
- `src/daily-todo-app.ts` is a **placeholder** — a counter that proves reactive state re-renders. **Ticket 06 owns the real component decomposition.** Do not grow this element into the app before that ticket resolves.
