# 13 — Migrate to the status enum (schema v1 → v2)

Type: task
Status: open
Blocked by: 04
Map: ../map.md

## Question

Nothing to decide — ticket 04 decided it. This is the execution, split out because it should happen **now**, while there is still one device and one copy of the data.

Once the phone is live, this same migration has to reach a device that may be offline, running a stale cached build, or freshly wiped by Safari's ITP. Today it is a pure function. That is the whole reason this ticket exists early rather than at the end.

Carry out ticket 04's decision:

- `Task.done: boolean` → `Task.status: 'open' | 'done' | 'abandoned' | 'erased'`.
- `CURRENT_VERSION` 1 → 2, with a **v1 → v2 migration** in `storage.ts`: `done: true` becomes `status: 'done'`, `done: false` becomes `status: 'open'`.
- `deleteTask` splits into **`abandonTask`** and **`eraseTask`**. Both set `status` and — critically — **both set `updatedAt`**, which the current hard delete never does.
- `triageTask`'s `'drop'` verdict calls `abandonTask`, not a delete.
- `<task-list>`'s `×` calls `eraseTask`. Its `aria-label` says "Delete"; reconsider the wording now the act has a name.
- Every read path (`leftovers`, `tasksForDay`) must filter to visible Tasks. **`status !== 'open' && status !== 'done'` disappears from view** — nothing abandoned or erased is ever rendered in v1.
- `toggleTask` flips between `'open'` and `'done'` only. It must not resurrect an abandoned or erased Task.

Done when:

- `pnpm build` is clean and `pnpm test` passes. The suite is mutation-checked; **56 tests exist and several assert the old hard-delete behaviour** — they need rewriting to assert tombstones, not deleting to make them pass.
- A v1 payload in `localStorage` loads and migrates without the user noticing.
- On one device the app behaves **exactly as before**. If anything looks different, something is wrong.

Note the collision with ticket 12: that ticket owns the policy for a version an old build does not recognise. This migration ships **before** sync, so only the v1 → v2 direction matters here. Do not try to solve ticket 12 inside this one.
