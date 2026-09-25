/**
 * Stored documents, brought up to the current version. Pure: no localStorage,
 * no clock. Kept out of storage.ts because more migrations are coming, and
 * because the sync layer will eventually replace storage.ts around it.
 */
import { CURRENT_VERSION } from './model.js';
import type { State, Task } from './model.js';

export type MigrateResult =
  | { ok: true; state: State }
  | { ok: false; found: unknown };

/** v1 stored `done: boolean`; v2 stores a four-valued `status`. */
const fromV1 = (tasks: unknown[]): Task[] =>
  tasks.map((raw) => {
    const { done, ...rest } = raw as Task & { done?: boolean };
    return { ...rest, status: done === true ? 'done' : 'open' };
  });

export function migrate(parsed: unknown): MigrateResult {
  const doc = parsed as { version?: unknown; tasks?: unknown };
  const tasks = Array.isArray(doc?.tasks) ? doc.tasks : [];

  if (doc?.version === CURRENT_VERSION) {
    return { ok: true, state: { version: CURRENT_VERSION, tasks: tasks as Task[] } };
  }
  if (doc?.version === 1) {
    return { ok: true, state: { version: CURRENT_VERSION, tasks: fromV1(tasks) } };
  }
  return { ok: false, found: doc?.version };
}
