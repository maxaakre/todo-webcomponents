# 13 — Migrate to the status enum (schema v1 → v2)

Type: task
Status: resolved
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

## Answer

**Done. `pnpm build` clean, `pnpm test` 62 passing** (was 56). No hard delete remains anywhere in `src/`.

### What changed

| File | Change |
|---|---|
| `model.ts` | `done: boolean` → `status: TaskStatus`; `CURRENT_VERSION` 1 → 2 |
| **`migrate.ts`** (new) | Pure `migrate(parsed) -> { ok, state } \| { ok: false, found }` |
| `store.ts` | `deleteTask` **deleted**; `abandonTask` and `eraseTask` added; reads filter tombstones; `toggleTask` refuses to touch one |
| `storage.ts` | `load()` runs `migrate`; refusal message now reports the version it found |
| `task-list.ts` | `×` dispatches `task-erased`; label "Delete" → **"Erase"** |
| `daily-todo-app.ts` | `onDeleted` → `onErased`, calling `eraseTask` with a clock |

### How it was built

The mechanical rename (`done` → `status`, no behaviour change) was done **first and separately**, with all 56 original tests kept green — so the rename is provably faithful. Behaviour changes were then driven test-first, one slice at a time.

`migrate.ts` is a separate pure module rather than logic inside `load()`, decided with the user: a second migration is coming with ticket 09's `order` change, ticket 12 owns version policy, and ticket 11 will replace `storage.ts` around it.

### Two things worth knowing

**1. Reading never writes.** `load()` migrates in memory and leaves the v1 bytes on disk untouched until the app actually saves. `lastRaw` deliberately holds what was *read*, not what it was migrated into, so the multi-tab write guard still compares against what is really on disk. There is a test for exactly this.

**2. `×` is now labelled "Erase", not "Delete".** The one deliberate user-visible change, because the act finally has a name. The glyph is unchanged.

### Mutation-checked

The map records this suite as mutation-checked, so the new tests were verified to actually bite. Five mutations, all caught:

| Mutation | Tests failed |
|---|---|
| `toggleTask` resurrects tombstones | 1 |
| `tasksForDay` stops hiding tombstones | 4 |
| `abandonTask` marks `erased` instead | 2 |
| Migration loses the `done` flag | 2 |
| Tombstone does not stamp `updatedAt` | 3 |

One test was **restored rather than dropped**: "leaves an order gap that does not disturb later appends" lived in the deleted `deleteTask` block, and it matters more now than before, since tombstones keep their `order` forever.

### Not verified

**This was not checked by hand in a browser.** Verification is the build, 62 tests including DOM-level element tests, and the mutation run above. The predecessor map's work was also hand-verified in Safari; this change was not. Worth five minutes on the deployed URL once ticket 01 lands — particularly that a real v1 `localStorage` document migrates silently.
