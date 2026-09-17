import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { State } from './model.js';

const KEY = 'daily-todo/v1';

/**
 * storage.ts keeps module-level state (the last raw string, and whether a load
 * succeeded), so each test gets a fresh module.
 */
const fresh = async () => {
  vi.resetModules();
  return import('./storage.js');
};

const doc = (tasks: unknown[] = []) => JSON.stringify({ version: 1, tasks });

beforeEach(() => localStorage.clear());

describe('load', () => {
  it('returns an empty state on first run', async () => {
    const storage = await fresh();
    const result = storage.load();
    expect(result).toEqual({ ok: true, state: { version: 1, tasks: [] } });
  });

  it('reads a stored document', async () => {
    localStorage.setItem(KEY, doc([{ id: 'a' }]));
    const storage = await fresh();
    const result = storage.load();
    expect(result.ok && result.state.tasks).toEqual([{ id: 'a' }]);
  });

  it('REFUSES an unrecognised version and leaves the data untouched', async () => {
    const raw = JSON.stringify({ version: 99, tasks: [{ id: 'precious' }] });
    localStorage.setItem(KEY, raw);
    const storage = await fresh();
    const result = storage.load();
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toBe('version');
    expect(localStorage.getItem(KEY)).toBe(raw); // nothing wiped
  });

  it('REFUSES an unparseable payload and leaves it untouched', async () => {
    localStorage.setItem(KEY, '{not json at all');
    const storage = await fresh();
    const result = storage.load();
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toBe('corrupt');
    expect(localStorage.getItem(KEY)).toBe('{not json at all');
  });
});

describe('save', () => {
  it('writes after a successful load', async () => {
    const storage = await fresh();
    storage.load();
    const state: State = { version: 1, tasks: [] };
    expect(storage.save(state)).toEqual({ ok: true });
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify(state));
  });

  it('refuses to write when load() was never called', async () => {
    const storage = await fresh();
    expect(storage.save({ version: 1, tasks: [] })).toEqual({ ok: false, reason: 'not-loaded' });
  });

  it('is DISABLED after a refused load, so a stale build cannot overwrite good data', async () => {
    const raw = JSON.stringify({ version: 99, tasks: [{ id: 'precious' }] });
    localStorage.setItem(KEY, raw);
    const storage = await fresh();
    storage.load();
    expect(storage.save({ version: 1, tasks: [] })).toEqual({ ok: false, reason: 'not-loaded' });
    expect(localStorage.getItem(KEY)).toBe(raw);
  });

  it('REFUSES when another tab changed the document underneath it', async () => {
    localStorage.setItem(KEY, doc([{ id: 'a' }]));
    const storage = await fresh();
    storage.load();

    // Another tab writes directly, bypassing this module.
    const otherTab = doc([{ id: 'a' }, { id: 'from-other-tab' }]);
    localStorage.setItem(KEY, otherTab);

    const result = storage.save({ version: 1, tasks: [] });
    expect(result).toEqual({ ok: false, reason: 'conflict' });
    expect(localStorage.getItem(KEY)).toBe(otherTab); // the other tab's work survives
  });

  it('allows the next save after a reload resynchronises', async () => {
    localStorage.setItem(KEY, doc([{ id: 'a' }]));
    const storage = await fresh();
    storage.load();
    localStorage.setItem(KEY, doc([{ id: 'b' }]));
    expect(storage.save({ version: 1, tasks: [] }).ok).toBe(false);

    storage.load(); // what the app does on conflict
    expect(storage.save({ version: 1, tasks: [] }).ok).toBe(true);
  });

  it('two consecutive saves both succeed (the guard tracks its own writes)', async () => {
    const storage = await fresh();
    storage.load();
    expect(storage.save({ version: 1, tasks: [] }).ok).toBe(true);
    expect(storage.save({ version: 1, tasks: [{ id: 'a' } as never] }).ok).toBe(true);
  });
});

describe('startFresh', () => {
  it('replaces the document and re-enables saving', async () => {
    localStorage.setItem(KEY, '{not json at all');
    const storage = await fresh();
    storage.load(); // refused

    const state = storage.startFresh();
    expect(state).toEqual({ version: 1, tasks: [] });
    expect(localStorage.getItem(KEY)).toBe(doc());
    expect(storage.save({ version: 1, tasks: [] }).ok).toBe(true);
  });
});
