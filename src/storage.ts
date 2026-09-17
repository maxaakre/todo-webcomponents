/**
 * The ONLY module that touches localStorage.
 *
 * Two guarantees:
 *  - Nothing is ever wiped automatically. An unreadable document refuses.
 *  - A save will not overwrite a document another tab changed underneath it.
 */
import { CURRENT_VERSION, emptyState } from './model.js';
import type { State } from './model.js';

const KEY = 'daily-todo/v1';

export type LoadResult =
  | { ok: true; state: State }
  | { ok: false; reason: 'version' | 'corrupt'; message: string };

export type SaveResult = { ok: true } | { ok: false; reason: 'conflict' | 'not-loaded' };

/**
 * The exact string last read. The write guard compares against it.
 * Stays null after a refusal — nothing may write, so nothing may compare.
 */
let lastRaw: string | null = null;
let loaded = false;

export function load(): LoadResult {
  const raw = localStorage.getItem(KEY);

  if (raw === null) {
    lastRaw = null;
    loaded = true;
    return { ok: true, state: emptyState() };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    loaded = false;
    return {
      ok: false,
      reason: 'corrupt',
      message: 'Saved data could not be read. It has been left untouched.',
    };
  }

  const doc = parsed as Partial<State>;
  if (doc?.version !== CURRENT_VERSION) {
    loaded = false;
    return {
      ok: false,
      reason: 'version',
      message: `Saved data is version ${String(doc?.version)}, and this build only understands version ${CURRENT_VERSION}. It has been left untouched.`,
    };
  }

  lastRaw = raw;
  loaded = true;
  return { ok: true, state: { version: CURRENT_VERSION, tasks: doc.tasks ?? [] } };
}

export function save(state: State): SaveResult {
  if (!loaded) return { ok: false, reason: 'not-loaded' };

  // Another tab may have written since we read. Refuse rather than clobber.
  if (localStorage.getItem(KEY) !== lastRaw) return { ok: false, reason: 'conflict' };

  const raw = JSON.stringify(state);
  localStorage.setItem(KEY, raw);
  lastRaw = raw;
  return { ok: true };
}

/** Deliberate reset after a refusal. Only ever called from a user action. */
export function startFresh(): State {
  const state = emptyState();
  const raw = JSON.stringify(state);
  localStorage.setItem(KEY, raw);
  lastRaw = raw;
  loaded = true;
  return state;
}
