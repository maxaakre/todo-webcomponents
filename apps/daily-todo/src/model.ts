export type Verdict = 'today' | 'tomorrow' | 'drop';

/** How a Task stands. `done` and `abandoned` are the two ways of being
 *  finished with it; see CONTEXT.md. */
export type TaskStatus = 'open' | 'done' | 'abandoned' | 'erased';

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  /** "YYYY-MM-DD" — a LABEL, not an instant. A day-start setting may shift it. */
  day: string;
  /** Integer, renumbered within a Day. */
  order: number;
  /** ISO 8601 — an absolute INSTANT. Day handling must never touch this. */
  updatedAt: string;
};

export const CURRENT_VERSION = 2;

export type State = {
  version: typeof CURRENT_VERSION;
  tasks: Task[];
};

export const emptyState = (): State => ({ version: CURRENT_VERSION, tasks: [] });
