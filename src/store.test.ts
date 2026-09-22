import { describe, expect, it } from 'vitest';
import { abandonTask, addTask, eraseTask, leftovers, tasksForDay, toggleTask, triageTask } from './store.js';
import { emptyState } from './model.js';
import type { State, Task } from './model.js';

const clock = { today: '2026-09-17', now: '2026-09-17T09:00:00.000Z' };

const task = (over: Partial<Task>): Task => ({
  id: 'x', title: 't', status: 'open', day: '2026-09-17', order: 0,
  updatedAt: '2026-09-01T00:00:00.000Z', ...over,
});

const stateWith = (tasks: Task[]): State => ({ ...emptyState(), tasks });

describe('addTask', () => {
  it('adds a Task to today with a uuid and a fresh updatedAt', () => {
    const next = addTask(emptyState(), 'Buy oat milk', clock);
    expect(next.tasks).toHaveLength(1);
    expect(next.tasks[0]).toMatchObject({ title: 'Buy oat milk', status: 'open', day: clock.today, order: 0 });
    expect(next.tasks[0].updatedAt).toBe(clock.now);
    expect(next.tasks[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('trims the title', () => {
    const next = addTask(emptyState(), '   spaced out   ', clock);
    expect(next.tasks[0].title).toBe('spaced out');
  });

  it('rejects an empty or whitespace-only title, returning the SAME state', () => {
    const state = emptyState();
    expect(addTask(state, '   ', clock)).toBe(state);
    expect(addTask(state, '', clock)).toBe(state);
  });

  it('appends at the bottom of today', () => {
    const state = stateWith([task({ id: 'a', order: 0 }), task({ id: 'b', order: 1 })]);
    const next = addTask(state, 'third', clock);
    expect(next.tasks.at(-1)!.order).toBe(2);
  });

  it('does not mutate the input state', () => {
    const state = emptyState();
    addTask(state, 'x', clock);
    expect(state.tasks).toHaveLength(0);
  });

  it('returns a new array reference, so Lit re-renders', () => {
    const state = emptyState();
    expect(addTask(state, 'x', clock).tasks).not.toBe(state.tasks);
  });
});

describe('leftovers', () => {
  it('includes unfinished work from ANY earlier Day, not just yesterday', () => {
    // The weekend hole: only-yesterday would orphan the Friday task forever.
    const state = stateWith([
      task({ id: 'fri', day: '2026-09-13' }),
      task({ id: 'yest', day: '2026-09-16' }),
    ]);
    expect(leftovers(state, clock.today).map((t) => t.id)).toEqual(['fri', 'yest']);
  });

  it('excludes finished work', () => {
    const state = stateWith([task({ id: 'done', day: '2026-09-16', status: 'done' })]);
    expect(leftovers(state, clock.today)).toHaveLength(0);
  });

  it("excludes today's and future Tasks", () => {
    const state = stateWith([
      task({ id: 'today', day: '2026-09-17' }),
      task({ id: 'future', day: '2026-09-20' }),
    ]);
    expect(leftovers(state, clock.today)).toHaveLength(0);
  });

  it('orders oldest first', () => {
    const state = stateWith([
      task({ id: 'newer', day: '2026-09-16' }),
      task({ id: 'older', day: '2026-09-10' }),
    ]);
    expect(leftovers(state, clock.today).map((t) => t.id)).toEqual(['older', 'newer']);
  });
});

describe('tasksForDay', () => {
  it('returns only that Day, sorted by order', () => {
    const state = stateWith([
      task({ id: 'second', order: 1 }),
      task({ id: 'first', order: 0 }),
      task({ id: 'other-day', day: '2026-09-16' }),
    ]);
    expect(tasksForDay(state, clock.today).map((t) => t.id)).toEqual(['first', 'second']);
  });

  it('hides abandoned and erased Tasks, so v2 looks identical to v1 on screen', () => {
    const state = stateWith([
      task({ id: 'visible' }),
      task({ id: 'gone', order: 1, status: 'abandoned' }),
      task({ id: 'typo', order: 2, status: 'erased' }),
    ]);
    expect(tasksForDay(state, clock.today).map((t) => t.id)).toEqual(['visible']);
  });
});

describe('toggleTask', () => {
  it('flips done and stamps updatedAt', () => {
    const state = stateWith([task({ id: 'a', status: 'open' })]);
    const next = toggleTask(state, 'a', clock);
    expect(next.tasks[0].status).toBe('done');
    expect(next.tasks[0].updatedAt).toBe(clock.now);
  });

  it('flips back', () => {
    const state = stateWith([task({ id: 'a', status: 'done' })]);
    expect(toggleTask(state, 'a', clock).tasks[0].status).toBe('open');
  });

  it('leaves other Tasks alone', () => {
    const state = stateWith([task({ id: 'a' }), task({ id: 'b' })]);
    expect(toggleTask(state, 'a', clock).tasks[1]).toBe(state.tasks[1]);
  });

  it('REFUSES to resurrect an abandoned or erased Task', () => {
    // The UI offers no un-drop, so any reappearance is a bug by definition.
    // A stale device toggling a tombstone is exactly how that would happen.
    for (const status of ['abandoned', 'erased'] as const) {
      const state = stateWith([task({ id: 'a', status })]);
      const next = toggleTask(state, 'a', clock);
      expect(next.tasks[0].status).toBe(status);
      expect(next.tasks[0].updatedAt).toBe(state.tasks[0].updatedAt);
    }
  });
});

describe('abandonTask', () => {
  it('keeps the row as a tombstone and stamps updatedAt', () => {
    // A hard delete cannot cross devices: a removed row is indistinguishable
    // from one the other device has not seen yet, so it resurrects.
    const state = stateWith([task({ id: 'a' }), task({ id: 'b' })]);
    const next = abandonTask(state, 'a', clock);
    expect(next.tasks.map((t) => t.id)).toEqual(['a', 'b']);
    expect(next.tasks[0].status).toBe('abandoned');
    expect(next.tasks[0].updatedAt).toBe(clock.now);
  });
});

describe('eraseTask', () => {
  it('keeps the row too — a different act, but it cannot vanish either', () => {
    // Erasing means "this should never have existed" (a typo), which is NOT
    // abandoning. It still needs a tombstone, or it resurrects the same way.
    const state = stateWith([task({ id: 'a' })]);
    const next = eraseTask(state, 'a', clock);
    expect(next.tasks).toHaveLength(1);
    expect(next.tasks[0].status).toBe('erased');
    expect(next.tasks[0].updatedAt).toBe(clock.now);
  });

  it('leaves an order gap that does not disturb later appends', () => {
    // A tombstone keeps its `order`, so nothing renumbers and nothing reuses
    // its slot — which is what keeps `order` merge-safe for now.
    const state = stateWith([
      task({ id: 'a', order: 0 }),
      task({ id: 'b', order: 1 }),
      task({ id: 'c', order: 2 }),
    ]);
    const next = addTask(eraseTask(state, 'b', clock), 'new one', clock);
    expect(next.tasks.at(-1)!.order).toBe(3);
    expect(tasksForDay(next, clock.today).map((t) => t.id)).toEqual(['a', 'c', next.tasks.at(-1)!.id]);
  });
});

describe('triageTask', () => {
  it('moves to today at the BOTTOM of the existing plan', () => {
    // The gap the prototype exposed: a leftover must not jump the queue ahead
    // of work chosen deliberately for today.
    const state = stateWith([
      task({ id: 'planned', day: '2026-09-17', order: 0 }),
      task({ id: 'leftover', day: '2026-09-16', order: 0 }),
    ]);
    const next = triageTask(state, 'leftover', 'today', clock);
    const plan = tasksForDay(next, clock.today).map((t) => t.id);
    expect(plan).toEqual(['planned', 'leftover']);
  });

  it('moves to tomorrow, and tomorrow only', () => {
    const state = stateWith([task({ id: 'a', day: '2026-09-16' })]);
    expect(triageTask(state, 'a', 'tomorrow', clock).tasks[0].day).toBe('2026-09-18');
  });

  it('lands at the bottom of tomorrow too', () => {
    const state = stateWith([
      task({ id: 'already', day: '2026-09-18', order: 0 }),
      task({ id: 'moved', day: '2026-09-16', order: 5 }),
    ]);
    const next = triageTask(state, 'moved', 'tomorrow', clock);
    expect(next.tasks.find((t) => t.id === 'moved')!.order).toBe(1);
  });

  it('drop ABANDONS — the row survives as a tombstone, and stops being shown', () => {
    const state = stateWith([task({ id: 'a' }), task({ id: 'b', order: 1 })]);
    const next = triageTask(state, 'a', 'drop', clock);
    expect(next.tasks.map((t) => t.id)).toEqual(['a', 'b']);
    expect(next.tasks[0].status).toBe('abandoned');
    expect(next.tasks[0].updatedAt).toBe(clock.now);
    expect(tasksForDay(next, clock.today).map((t) => t.id)).toEqual(['b']);
  });

  it('stamps updatedAt on a move but leaves `day` as a label', () => {
    const state = stateWith([task({ id: 'a', day: '2026-09-16' })]);
    const moved = triageTask(state, 'a', 'today', clock).tasks[0];
    expect(moved.updatedAt).toBe(clock.now);
    expect(moved.day).toBe('2026-09-17');
  });

  it('a Task moved to tomorrow is not re-triaged the same day', () => {
    const state = stateWith([task({ id: 'a', day: '2026-09-16' })]);
    const next = triageTask(state, 'a', 'tomorrow', clock);
    expect(leftovers(next, clock.today)).toHaveLength(0);
  });

  it('but IS triaged again the day after, if still unfinished', () => {
    const state = stateWith([task({ id: 'a', day: '2026-09-16' })]);
    const next = triageTask(state, 'a', 'tomorrow', clock);
    expect(leftovers(next, '2026-09-19').map((t) => t.id)).toEqual(['a']);
  });

  it('does not mutate the input state', () => {
    const state = stateWith([task({ id: 'a', day: '2026-09-16' })]);
    triageTask(state, 'a', 'drop', clock);
    expect(state.tasks).toHaveLength(1);
  });
});
