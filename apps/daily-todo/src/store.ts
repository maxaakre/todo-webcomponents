/**
 * Pure operations over State. No I/O, no Lit, no clock reads — time arrives
 * as a Clock argument. Every operation returns a NEW State.
 */
import { addDays } from './day.js';
import type { Clock } from './day.js';
import type { State, Task, TaskStatus, Verdict } from './model.js';

/** Abandoned and erased Tasks are kept forever, but never shown. */
const visible = (t: Task): boolean => t.status === 'open' || t.status === 'done';

/** Unfinished work from any earlier Day — not just yesterday. */
export const leftovers = (state: State, today: string): Task[] =>
  state.tasks
    .filter((t) => t.day < today && t.status === 'open')
    .sort((a, b) => (a.day === b.day ? a.order - b.order : a.day < b.day ? -1 : 1));

export const tasksForDay = (state: State, day: string): Task[] =>
  state.tasks.filter((t) => t.day === day && visible(t)).sort((a, b) => a.order - b.order);

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
    status: 'open',
    day: clock.today,
    order: nextOrder(state, clock.today),
    updatedAt: clock.now,
  };
  return { ...state, tasks: [...state.tasks, task] };
}

/**
 * "I decided not to do this." The row STAYS, as a tombstone: a removed row is
 * indistinguishable from one another device has not seen yet, so it would
 * resurrect. `updatedAt` must be stamped or the tombstone loses every merge.
 */
export function abandonTask(state: State, id: string, clock: Clock): State {
  return mark(state, id, 'abandoned', clock);
}

/**
 * "This should never have existed" — a typo, a duplicate. A different act from
 * abandoning, but it cannot be a removal either, for exactly the same reason.
 */
export function eraseTask(state: State, id: string, clock: Clock): State {
  return mark(state, id, 'erased', clock);
}

const mark = (state: State, id: string, status: TaskStatus, clock: Clock): State => ({
  ...state,
  tasks: state.tasks.map((t) => (t.id === id ? { ...t, status, updatedAt: clock.now } : t)),
});

/**
 * Flips between open and done ONLY. A tombstone is left strictly alone: the UI
 * has no un-drop, so any reappearance is a bug, and a stale device toggling an
 * abandoned Task is exactly how one would happen.
 */
export function toggleTask(state: State, id: string, clock: Clock): State {
  return {
    ...state,
    tasks: state.tasks.map((t) =>
      t.id === id && visible(t)
        ? { ...t, status: t.status === 'done' ? 'open' : 'done', updatedAt: clock.now }
        : t,
    ),
  };
}

/**
 * Move an open Task to today, or reschedule it to tomorrow. It lands at the
 * bottom of that Day: what was planned there deliberately keeps its place.
 * Only open Tasks move; anything finished with returns the SAME state.
 */
export function moveTask(state: State, id: string, to: 'today' | 'tomorrow', clock: Clock): State {
  const target = state.tasks.find((t) => t.id === id);
  if (!target || target.status !== 'open') return state;
  const day = to === 'today' ? clock.today : addDays(clock.today, 1);
  const order = nextOrder(state, day);
  return {
    ...state,
    tasks: state.tasks.map((t) =>
      t.id === id ? { ...t, day, order, updatedAt: clock.now } : t,
    ),
  };
}

export function triageTask(state: State, id: string, verdict: Verdict, clock: Clock): State {
  if (verdict === 'drop') return abandonTask(state, id, clock);
  return moveTask(state, id, verdict, clock);
}
