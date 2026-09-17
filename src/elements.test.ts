import { beforeEach, describe, expect, it } from 'vitest';
import './daily-todo-app.js';
import { currentDay } from './day.js';
import type { DailyTodoApp } from './daily-todo-app.js';
import type { TaskComposer } from './task-composer.js';
import type { TaskList } from './task-list.js';
import type { TriageView } from './triage-view.js';

const KEY = 'daily-todo/v1';

const mount = async (): Promise<DailyTodoApp> => {
  document.body.innerHTML = '<daily-todo-app></daily-todo-app>';
  const app = document.querySelector('daily-todo-app') as DailyTodoApp;
  await app.updateComplete;
  return app;
};

const settle = async (app: DailyTodoApp) => {
  await app.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await app.updateComplete;
};

const stored = () => JSON.parse(localStorage.getItem(KEY)!);

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('<daily-todo-app>', () => {
  it('renders the single-column view when there is nothing to triage', async () => {
    const app = await mount();
    expect(app.shadowRoot!.querySelector('triage-view')).toBeNull();
    expect(app.shadowRoot!.querySelector('task-list')).not.toBeNull();
    expect(app.shadowRoot!.querySelector('h1')!.textContent).toBe('Today');
  });

  it('switches to the two-pane view when something is older than today', async () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, tasks: [
      { id: 'a', title: 'Renew passport', done: false, day: '2020-01-01', order: 0, updatedAt: '2020-01-01T00:00:00.000Z' },
    ]}));
    const app = await mount();
    expect(app.shadowRoot!.querySelector('triage-view')).not.toBeNull();
    expect(app.shadowRoot!.querySelector('h1')!.textContent).toBe('Plan today');
  });

  it('adds a Task through the composer and persists it', async () => {
    const app = await mount();
    const composer = app.shadowRoot!.querySelector('task-composer') as TaskComposer;
    await composer.updateComplete;
    const input = composer.shadowRoot!.querySelector('input') as HTMLInputElement;
    input.value = '  Buy oat milk  ';
    composer.shadowRoot!.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle(app);

    expect(stored().tasks).toHaveLength(1);
    expect(stored().tasks[0].title).toBe('Buy oat milk'); // trimmed
    expect(input.value).toBe(''); // cleared
  });

  it('ignores an empty submit', async () => {
    const app = await mount();
    const composer = app.shadowRoot!.querySelector('task-composer') as TaskComposer;
    await composer.updateComplete;
    (composer.shadowRoot!.querySelector('input') as HTMLInputElement).value = '   ';
    composer.shadowRoot!.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle(app);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('toggles a Task from the list', async () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, tasks: [
      { id: 'a', title: 'Buy oat milk', done: false, day: currentDay(), order: 0, updatedAt: '2026-01-01T00:00:00.000Z' },
    ]}));
    const app = await mount();
    const list = app.shadowRoot!.querySelector('task-list') as TaskList;
    await list.updateComplete;
    (list.shadowRoot!.querySelector('input[type=checkbox]') as HTMLInputElement).dispatchEvent(new Event('change'));
    await settle(app);
    expect(stored().tasks[0].done).toBe(true);
  });

  it('deletes a Task from the Today list', async () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, tasks: [
      { id: 'a', title: 'Typo task', done: false, day: currentDay(), order: 0, updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'b', title: 'Keep me', done: false, day: currentDay(), order: 1, updatedAt: '2026-01-01T00:00:00.000Z' },
    ]}));
    const app = await mount();
    const list = app.shadowRoot!.querySelector('task-list') as TaskList;
    await list.updateComplete;
    (list.shadowRoot!.querySelectorAll('button')[0] as HTMLButtonElement).click();
    await settle(app);
    expect(stored().tasks.map((t: { id: string }) => t.id)).toEqual(['b']);
  });

  it('the delete button is labelled for screen readers', async () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, tasks: [
      { id: 'a', title: 'Buy oat milk', done: false, day: currentDay(), order: 0, updatedAt: '2026-01-01T00:00:00.000Z' },
    ]}));
    const app = await mount();
    const list = app.shadowRoot!.querySelector('task-list') as TaskList;
    await list.updateComplete;
    expect(list.shadowRoot!.querySelector('button')!.getAttribute('aria-label')).toBe('Delete "Buy oat milk"');
  });

  it('triages a leftover to today, landing it at the bottom of the plan', async () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, tasks: [
      { id: 'planned', title: 'Planned', done: false, day: currentDay(), order: 0, updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'old', title: 'Leftover', done: false, day: '2020-01-01', order: 0, updatedAt: '2020-01-01T00:00:00.000Z' },
    ]}));
    const app = await mount();
    const triage = app.shadowRoot!.querySelector('triage-view') as TriageView;
    await triage.updateComplete;
    (triage.shadowRoot!.querySelector('button.primary') as HTMLButtonElement).click();
    await settle(app);

    const today = stored().tasks
      .filter((t: { day: string }) => t.day === currentDay())
      .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
      .map((t: { id: string }) => t.id);
    expect(today).toEqual(['planned', 'old']);
  });

  it('shows the read-only error screen on an unrecognised version, and writes nothing', async () => {
    const raw = JSON.stringify({ version: 99, tasks: [{ id: 'precious' }] });
    localStorage.setItem(KEY, raw);
    const app = await mount();

    expect(app.shadowRoot!.querySelector('.error')).not.toBeNull();
    expect(app.shadowRoot!.querySelector('task-composer')).toBeNull();
    expect(localStorage.getItem(KEY)).toBe(raw);
  });

  it('start fresh is the only escape, and it is an explicit click', async () => {
    localStorage.setItem(KEY, '{not json at all');
    const app = await mount();
    expect(localStorage.getItem(KEY)).toBe('{not json at all');

    (app.shadowRoot!.querySelector('.error button') as HTMLButtonElement).click();
    await settle(app);

    expect(app.shadowRoot!.querySelector('.error')).toBeNull();
    expect(stored()).toEqual({ version: 1, tasks: [] });
  });

  it('discards a write that would clobber another tab, and says so', async () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, tasks: [] }));
    const app = await mount();

    // Another tab writes directly, bypassing storage.ts.
    const otherTab = JSON.stringify({ version: 1, tasks: [
      { id: 'other', title: 'From another tab', done: false, day: currentDay(), order: 0, updatedAt: '2026-01-01T00:00:00.000Z' },
    ]});
    localStorage.setItem(KEY, otherTab);

    const composer = app.shadowRoot!.querySelector('task-composer') as TaskComposer;
    await composer.updateComplete;
    (composer.shadowRoot!.querySelector('input') as HTMLInputElement).value = 'Mine';
    composer.shadowRoot!.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle(app);

    // The other tab's work survived, and the user was told.
    expect(stored().tasks.map((t: { id: string }) => t.id)).toEqual(['other']);
    expect(app.shadowRoot!.querySelector('.notice')!.textContent).toContain('another tab');
  });
});
