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
- **Planning, not building.** Tickets resolve decisions. The one exception is the scaffold task, which exists to unblock the prototype.

## Decisions so far

<!-- one line per closed ticket: gist + link -->

_(none yet — the map was just charted)_

## Not yet specified

- **Multi-device sync.** The stated direction, deliberately postponed. Revisit once the data shape and persistence layer are settled; the `id` + `updatedAt` decision is the hook it will hang from.
- **Styling system.** Shadow DOM styling, CSS custom properties as a theming seam, dark mode. Can't be specified until the component seams exist.
- **History and Backlog views, and routing.** Ruled out of v1 but expected to return. Routing becomes a real decision the moment a second view exists.
- **Persistence schema evolution.** What happens to stored data when the Task shape changes. Sharpens once the shape is settled.
- **Keyboard and accessibility.** A daily planner is a keyboard tool. Unclear yet which interactions matter.
- **Where the app actually runs.** Local dev server forever, or deployed somewhere? Bears on sync later.
- **Task extras.** Notes, priority, recurrence, estimates. Parked until the minimal Task is used in anger.

## Out of scope

- **Multi-user, accounts, and auth.** The destination is one person's daily plan. Multi-*device* is in the fog; multi-*user* is past the destination.
- **Automated tests.** Ruled out by the user (Q12). Returns only if the destination is redrawn.
