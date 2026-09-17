export type Verdict = 'today' | 'tomorrow' | 'drop';

export type Task = {
  id: string;
  title: string;
  done: boolean;
  /** "YYYY-MM-DD" — a LABEL, not an instant. A day-start setting may shift it. */
  day: string;
  /** Integer, renumbered within a Day. */
  order: number;
  /** ISO 8601 — an absolute INSTANT. Day handling must never touch this. */
  updatedAt: string;
};

export const CURRENT_VERSION = 1;

export type State = {
  version: typeof CURRENT_VERSION;
  tasks: Task[];
};

export const emptyState = (): State => ({ version: CURRENT_VERSION, tasks: [] });
