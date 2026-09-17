# Map: Daily Todo (Lit)

Label: `wayfinder:map`

## Destination

A **running, local-first daily todo app built with Lit + TypeScript** — one user, one device, `localStorage`, with a triage step that decides the fate of yesterday's unfinished Tasks. The app is a **vehicle for learning Lit and web components**, so idiomatic Lit matters more than feature count.

## Notes

- **Domain**: personal daily planning. Glossary lives in `CONTEXT.md` at the repo root.
- **Purpose is learning.** The user is learning Lit and web components. Prefer idiomatic, well-understood Lit patterns over clever ones; explain the Lit concept in play when resolving a ticket.
- **Skills every session should consult**: `mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling`. Research tickets use `mattpocock-skills:research`; prototype tickets use `mattpocock-skills:prototype`.
- **Stack is fixed**: Lit, TypeScript, Vite, `localStorage`.
- **No automated tests in this effort.** Explicitly ruled out by the user (see Out of scope). Do not add a test suite.
- **Sync is deferred, not dropped.** Every Task carries a stable `id` and an `updatedAt` timestamp so multi-device sync stays possible without a rewrite.
- **Immutable updates are mandatory.** Lit's change detection is strict `!==`; mutating an array or object re-renders nothing, and fails silently. Always replace, never mutate. (From the state-architecture research.)
- **Planning, not building.** Tickets resolve decisions. The one exception is the scaffold task, which exists to unblock the prototype.

## Decisions so far

<!-- one line per closed ticket: gist + link -->

- [How state flows between Lit components](issues/01-lit-state-architecture.md): **Props down, events up, over a plain TypeScript store module that owns `localStorage`** — immutable values throughout. `@lit/context` deferred until prop drilling actually hurts (stable, but scoped to deep trees, and it solves distribution not observation). `@lit-labs/signals` ruled out: Labs 0.3.0, "not recommended for production use", on a Stage 1 TC39 proposal. The store seam, not the transport, is what protects deferred sync.

- [The shape of a Task and a Day in storage](issues/03-domain-data-shape.md): **A Day is derived, not stored** — only Tasks persist, a Day is a filter on `day`. `Task = { id (uuid), title, done, day ("YYYY-MM-DD" label), order (int, renumbered per Day), updatedAt (ISO instant) }`. One `localStorage` key: `"daily-todo/v1" -> { version: 1, tasks: Task[] }`. Drop is a **hard delete**, no tombstones — knowingly sync-hostile, accepted. `day` is a shiftable label; `updatedAt` is an absolute instant; day-start logic must never touch `updatedAt`.
- [Scaffold the Lit + TypeScript project](issues/02-scaffold-project.md): Vite `lit-ts` template. **lit 3.3.3, typescript 6.0.3, vite 8.3.0.** `pnpm dev` on :5173, `pnpm build` = `tsc && vite build`. The load-bearing tsconfig setting is **`useDefineForClassFields: false`** — without it, standard class fields overwrite Lit's `@property`/`@state` accessors and reactivity silently dies. `src/daily-todo-app.ts` is a placeholder counter; ticket 06 owns the real decomposition.
- [When does a Day end?](issues/04-day-boundary.md): `currentDay()` returns `"YYYY-MM-DD"` in **device local time**, and is the only place today is derived. **Triage sees everything older than today** (`day < today && !done`), not just yesterday — only-yesterday orphans Tasks across a skipped weekend. The Day **re-resolves on `focus`/`visibilitychange`**, no midnight timer; this makes the current Day runtime state that needs an owner (ticket 06). **Reschedule goes to tomorrow only**, which caps ticket 03's invisible-Task risk at one day. Timezones and DST ignored — `day` is a label, so nothing can be lost.

## Not yet specified

- **Multi-device sync.** The stated direction, deliberately postponed. Revisit once the data shape and persistence layer are settled; the `id` + `updatedAt` decision is the hook it will hang from.
- **Styling system.** Shadow DOM styling, CSS custom properties as a theming seam, dark mode. Can't be specified until the component seams exist.
- **History and Backlog views, and routing.** Ruled out of v1 but expected to return. Routing becomes a real decision the moment a second view exists.
- **An "Upcoming" view.** Rescheduled Tasks are invisible until their Day arrives — a Task pushed to Friday cannot be seen anywhere before Friday. Accepted for v1 (see ticket 03). Revisit if Tasks start getting lost in practice; it is really the History/Backlog routing question wearing a different hat.
- **Keyboard and accessibility.** A daily planner is a keyboard tool. Unclear yet which interactions matter.
- **Where the app actually runs.** Local dev server forever, or deployed somewhere? Bears on sync later.
- **Toolchain extras.** TypeScript **7.0.2** is available; the template pins `~6.0.2` and the upgrade was not taken. No linter or formatter was decided either. Neither is blocking.
- **Task extras.** Notes, priority, recurrence, estimates. Parked until the minimal Task is used in anger.

## Out of scope

- **Multi-user, accounts, and auth.** The destination is one person's daily plan. Multi-*device* is in the fog; multi-*user* is past the destination.
- **Automated tests.** Ruled out by the user (Q12). Returns only if the destination is redrawn.
