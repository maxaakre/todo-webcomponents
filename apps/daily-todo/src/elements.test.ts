import type { LitElement } from 'lit';
import { beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { UiButton } from '@maxaakre/ui/button';
import type { UiTextField } from '@maxaakre/ui/text-field';
import './daily-todo-app.js';
import { currentDay } from './day.js';
import type { DailyTodoApp } from './daily-todo-app.js';
import type { TaskComposer } from './task-composer.js';
import type { TaskList } from './task-list.js';
import type { TriageView } from './triage-view.js';
import type { Task } from './model.js';

const KEY = 'daily-todo/v1';
const LONG_AGO = '2020-01-01';

/** A stored Task: open, today, order 0. Pass only what the test is about. */
const task = (id: string, fields: Partial<Task> = {}): Task => ({
  id, title: `Task ${id}`, status: 'open', day: currentDay(), order: 0,
  updatedAt: '2026-01-01T00:00:00.000Z', ...fields,
});

/** A v2 storage document, as the app writes it. */
const doc = (...tasks: Task[]) => JSON.stringify({ version: 2, tasks });

/** Put Tasks in storage before mounting. */
const seed = (...tasks: Task[]) => localStorage.setItem(KEY, doc(...tasks));

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

/** Find an element in the app's shadow root and wait for it to render. */
const child = async <T extends LitElement>(app: DailyTodoApp, selector: string): Promise<T> => {
  const el = app.shadowRoot!.querySelector(selector) as unknown as T;
  await el.updateComplete;
  return el;
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
    seed(task('a', { title: 'Renew passport', day: LONG_AGO }));
    const app = await mount();
    expect(app.shadowRoot!.querySelector('triage-view')).not.toBeNull();
    expect(app.shadowRoot!.querySelector('h1')!.textContent).toBe('Plan today');
  });

  it('adds a Task through the composer and persists it', async () => {
    const app = await mount();
    const composer = await child<TaskComposer>(app, 'task-composer');
    const field = composer.shadowRoot!.querySelector('ui-text-field') as UiTextField;
    await userEvent.type(field.shadowRoot!.querySelector('input')!, '  Buy oat milk  {Enter}');
    await settle(app);

    expect(stored().tasks).toHaveLength(1);
    expect(stored().tasks[0].title).toBe('Buy oat milk'); // trimmed
    expect(field.value).toBe(''); // cleared
    expect(field.shadowRoot!.activeElement).not.toBeNull(); // kept focus
  });

  it('ignores an empty submit', async () => {
    const app = await mount();
    const composer = await child<TaskComposer>(app, 'task-composer');
    (composer.shadowRoot!.querySelector('ui-text-field') as UiTextField).value = '   ';
    await userEvent.click(composer.shadowRoot!.querySelector('ui-button')!);
    await settle(app);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('toggles a Task from the list', async () => {
    seed(task('a', { title: 'Buy oat milk' }));
    const app = await mount();
    const list = await child<TaskList>(app, 'task-list');
    await userEvent.click(list.shadowRoot!.querySelector('ui-checkbox')!);
    await settle(app);
    expect(stored().tasks[0].status).toBe('done');
    expect(list.shadowRoot!.querySelector('ui-checkbox')!.checked).toBe(true);
  });

  const twoTasks = () => seed(task('a', { title: 'Typo task' }), task('b', { title: 'Keep me', order: 1 }));

  /** Click × on the first row and wait for the confirm dialog. */
  const askToErase = async (app: DailyTodoApp) => {
    const list = await child<TaskList>(app, 'task-list');
    await userEvent.click(list.shadowRoot!.querySelectorAll('ui-button')[0]);
    const dialog = list.shadowRoot!.querySelector('ui-dialog')!;
    await dialog.updateComplete;
    return { list, dialog };
  };

  /** Press Erase in the open dialog, and wait for the app and the list. */
  const confirmErase = async (app: DailyTodoApp, list: TaskList, dialog: HTMLElement) => {
    await userEvent.click(dialog.querySelector('[data-dialog-close=erase]')!);
    await settle(app);
    await list.updateComplete;
  };

  it('× asks first: the dialog names the Task, and nothing is erased yet', async () => {
    twoTasks();
    const app = await mount();
    const { dialog } = await askToErase(app);
    expect(dialog.open).toBe(true);
    expect(dialog.label).toBe('Erase “Typo task”?');
    expect(stored().tasks.every((t: { status: string }) => t.status === 'open')).toBe(true);
  });

  it('confirming ERASES the Task: the row survives, but it leaves the list', async () => {
    twoTasks();
    const app = await mount();
    const { list, dialog } = await askToErase(app);
    await confirmErase(app, list, dialog);
    const rows = stored().tasks as { id: string; status: string }[];
    expect(rows.map((t) => t.id)).toEqual(['a', 'b']);
    expect(rows.find((t) => t.id === 'a')!.status).toBe('erased');
    expect(list.shadowRoot!.querySelectorAll('li')).toHaveLength(1);
    expect(dialog.open).toBe(false);
  });

  it('after an erase, focus moves to the next Task, not lost on <body>', async () => {
    // The × that opened the dialog is gone with its row, so the browser's
    // own focus return has nowhere to go. The list must pick a target.
    twoTasks();
    const app = await mount();
    const { list, dialog } = await askToErase(app);
    await confirmErase(app, list, dialog);
    const next = list.shadowRoot!.querySelector('ui-checkbox')!;
    expect(next.textContent).toContain('Keep me');
    expect(list.shadowRoot!.activeElement).toBe(next);
  });

  it('focus still finds the next Task if the list reloaded while the dialog was open', async () => {
    // A reload (another tab wrote) hands the list new Task objects, so the
    // erased row must be found by id, not by object identity. The middle
    // row is erased: a failed lookup (-1) would land on the first row.
    seed(task('a'), task('b', { order: 1 }), task('c', { order: 2 }));
    const app = await mount();
    const list = await child<TaskList>(app, 'task-list');
    await userEvent.click(list.shadowRoot!.querySelectorAll('ui-button')[1]);
    const dialog = list.shadowRoot!.querySelector('ui-dialog')!;
    await dialog.updateComplete;
    list.tasks = list.tasks.map((t) => ({ ...t }));
    await list.updateComplete;
    await confirmErase(app, list, dialog);
    expect((list.shadowRoot!.activeElement as HTMLElement).textContent).toContain('Task c');
  });

  it('erasing the last Task moves focus to the empty message, not <body>', async () => {
    seed(task('a', { title: 'Only one' }));
    const app = await mount();
    const { list, dialog } = await askToErase(app);
    await confirmErase(app, list, dialog);
    const message = list.shadowRoot!.querySelector('p')!;
    expect(message.textContent).toContain('Nothing planned yet');
    expect(list.shadowRoot!.activeElement).toBe(message);
  });

  it('Cancel and Escape erase nothing, and focus returns to ×', async () => {
    twoTasks();
    const app = await mount();
    let { list, dialog } = await askToErase(app);
    await userEvent.click(dialog.querySelector('[data-dialog-close=cancel]')!);
    await dialog.updateComplete;
    expect(dialog.open).toBe(false);
    ({ list, dialog } = await askToErase(app));
    await userEvent.keyboard('{Escape}');
    await dialog.updateComplete;
    await settle(app);
    expect(stored().tasks.every((t: { status: string }) => t.status === 'open')).toBe(true);
    expect(list.shadowRoot!.activeElement).toBe(list.shadowRoot!.querySelectorAll('ui-button')[0]);
  });

  it('the erase button is labelled for screen readers', async () => {
    seed(task('a', { title: 'Buy oat milk' }));
    const app = await mount();
    const list = await child<TaskList>(app, 'task-list');
    const erase = list.shadowRoot!.querySelector('ui-button') as UiButton;
    await erase.updateComplete;
    expect(erase.shadowRoot!.querySelector('button')!.getAttribute('aria-label')).toBe('Erase "Buy oat milk"');
  });

  it('triages a leftover to today, landing it at the bottom of the plan', async () => {
    seed(task('planned', { title: 'Planned' }), task('old', { title: 'Leftover', day: LONG_AGO }));
    const app = await mount();
    const triage = await child<TriageView>(app, 'triage-view');
    await userEvent.click(triage.shadowRoot!.querySelector('ui-button[variant=primary]')!);
    await settle(app);

    const today = stored().tasks
      .filter((t: { day: string }) => t.day === currentDay())
      .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
      .map((t: { id: string }) => t.id);
    expect(today).toEqual(['planned', 'old']);
  });

  it('the Unfinished pane can be collapsed, and the plan stays usable', async () => {
    seed(task('old', { title: 'Leftover', day: LONG_AGO }));
    const app = await mount();
    const triage = await child<TriageView>(app, 'triage-view');
    const pane = triage.shadowRoot!.querySelector('ui-disclosure')!;
    expect(pane.open).toBe(true);
    await userEvent.click(pane.querySelector('[slot=summary]')!);
    await new Promise((r) => setTimeout(r, 0));
    expect(pane.open).toBe(false);
    expect(triage.shadowRoot!.querySelector('ui-button[variant=primary]')!.checkVisibility()).toBe(false);
    expect(triage.shadowRoot!.querySelector('task-list')!.checkVisibility()).toBe(true);
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

    await userEvent.click(app.shadowRoot!.querySelector('.error ui-button')!);
    await settle(app);

    expect(app.shadowRoot!.querySelector('.error')).toBeNull();
    expect(stored()).toEqual({ version: 2, tasks: [] });
  });

  it('discards a write that would clobber another tab, and says so', async () => {
    seed();
    const app = await mount();

    // Another tab writes directly, bypassing storage.ts.
    const otherTab = doc(task('other', { title: 'From another tab' }));
    localStorage.setItem(KEY, otherTab);

    const composer = await child<TaskComposer>(app, 'task-composer');
    const field = composer.shadowRoot!.querySelector('ui-text-field') as UiTextField;
    await userEvent.type(field.shadowRoot!.querySelector('input')!, 'Mine{Enter}');
    await settle(app);

    // The other tab's work survived, and the user was told.
    expect(stored().tasks.map((t: { id: string }) => t.id)).toEqual(['other']);
    expect(app.shadowRoot!.querySelector('.notice')!.textContent).toContain('another tab');
  });
});
