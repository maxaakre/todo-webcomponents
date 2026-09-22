import { describe, expect, it } from 'vitest';
import { migrate } from './migrate.js';

describe('migrate', () => {
  it('turns a v1 `done` boolean into a v2 status, keeping everything else', () => {
    const result = migrate({ version: 1, tasks: [
      { id: 'a', title: 'Finished', done: true, day: '2026-09-16', order: 0, updatedAt: '2026-09-16T10:00:00.000Z' },
      { id: 'b', title: 'Still open', done: false, day: '2026-09-17', order: 1, updatedAt: '2026-09-17T10:00:00.000Z' },
    ]});

    expect(result.ok).toBe(true);
    expect(result.ok && result.state).toEqual({
      version: 2,
      tasks: [
        { id: 'a', title: 'Finished', status: 'done', day: '2026-09-16', order: 0, updatedAt: '2026-09-16T10:00:00.000Z' },
        { id: 'b', title: 'Still open', status: 'open', day: '2026-09-17', order: 1, updatedAt: '2026-09-17T10:00:00.000Z' },
      ],
    });
  });

  it('passes a current-version document through untouched', () => {
    const doc = { version: 2, tasks: [
      { id: 'a', title: 'x', status: 'abandoned', day: '2026-09-16', order: 0, updatedAt: '2026-09-16T10:00:00.000Z' },
    ]};
    const result = migrate(doc);
    expect(result.ok && result.state).toEqual(doc);
  });

  it('REFUSES a version it does not recognise, in either direction', () => {
    // Never wipe: a newer build's data must survive an older build reading it.
    for (const version of [0, 3, 99, undefined, null, 'two']) {
      const result = migrate({ version, tasks: [{ id: 'precious' }] });
      expect(result.ok).toBe(false);
      expect(!result.ok && result.found).toBe(version);
    }
  });
});
