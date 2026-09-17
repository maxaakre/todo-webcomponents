/**
 * Pure operations over State. No I/O, no Lit, no clock reads — time arrives
 * as a Clock argument. Every operation returns a NEW State.
 */
import { addDays } from './day.js';
import type { Clock } from './day.js';
import type { State, Task, Verdict } from './model.js';

/** Unfinished work from any earlier Day — not just yesterday. */
export const leftovers = (state: State, today: string): Task[] =>
  state.tasks
    .filter((t) => t.day < today && !t.done)
    .sort((a, b) => (a.day === b.day ? a.order - b.order : a.day < b.day ? -1 : 1));

export const tasksForDay = (state: State, day: string): Task[] =>
  state.tasks.filter((t) => t.day === day).sort((a, b) => a.order - b.order);

/** A moved Task lands at the bottom of its destination Day. */
const nextOrder = (state: State, day: string): number => {
  const inDay = state.tasks.filter((t) => t.day === day);
  return inDay.length ? Math.max(...inDay.map((t) => t.order)) + 1 : 0;
};

export function addTask(state: State, title: string, clock: Clock): State {
  const clean = title.trim();
  if (!clean) return state;
  const task: Task = {
    id: crypto.randomUUID(),
    title: clean,
    done: false,
    day: clock.today,
    order: nextOrder(state, clock.today),
    updatedAt: clock.now,
  };
  return { ...state, tasks: [...state.tasks, task] };
}

export function toggleTask(state: State, id: string, clock: Clock): State {
  return {
    ...state,
    tasks: state.tasks.map((t) =>
      t.id === id ? { ...t, done: !t.done, updatedAt: clock.now } : t,
    ),
  };
}

export function triageTask(state: State, id: string, verdict: Verdict, clock: Clock): State {
  if (verdict === 'drop') {
    // Hard delete. No tombstone — a knowingly sync-hostile choice (ticket 03).
    return { ...state, tasks: state.tasks.filter((t) => t.id !== id) };
  }
  const day = verdict === 'today' ? clock.today : addDays(clock.today, 1);
  const order = nextOrder(state, day);
  return {
    ...state,
    tasks: state.tasks.map((t) =>
      t.id === id ? { ...t, day, order, updatedAt: clock.now } : t,
    ),
  };
}
