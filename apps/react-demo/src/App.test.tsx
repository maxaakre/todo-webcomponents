import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { UiCheckbox, UiDialog, UiTextField } from '@maxaakre/ui';
import { App } from './App.js';

// Each test checks one claim about React 19 + custom elements, through
// the real app, in a real browser.

let root: Root;
let host: HTMLDivElement;

beforeEach(async () => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<App />));
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

type State = { view: number; showDone: boolean; tasks: { title: string; done: boolean }[] };
const state = (): State => JSON.parse(host.querySelector('[data-testid=state]')!.textContent!);
/** Let events land and React re-render. */
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe('React 19 → element: properties', () => {
  it('sets checked as a property, so the box reflects React state', async () => {
    await userEvent.click(page.getByRole('tab', { name: /All/ }));
    await flush();
    const boxes = [...host.querySelectorAll<UiCheckbox>('ui-tab-panel:not([hidden]) ui-checkbox')];
    expect(boxes.map((b) => [b.textContent, b.checked])).toEqual([
      ['Buy oat milk', false],
      ['Renew passport', true],
    ]);
  });

  it('sets selectedIndex as a property (camelCase, not an attribute)', async () => {
    expect(host.querySelector('ui-tabs')!.selectedIndex).toBe(0);
  });

  it('sets hideLabel as a property: the label stays for screen readers', async () => {
    expect(page.getByRole('textbox', { name: 'New task' }).element()).toBeTruthy();
  });
});

describe('element → React 19: events', () => {
  it('onChange receives the re-dispatched change, exactly once', async () => {
    await userEvent.click(page.getByRole('checkbox', { name: 'Buy oat milk' }));
    await flush();
    expect(state().tasks[0].done).toBe(true);
  });

  it('onui-tab-change receives the custom event, with typed detail', async () => {
    await userEvent.click(page.getByRole('tab', { name: /All/ }));
    await flush();
    expect(state().view).toBe(1);
  });

  it('onui-toggle receives the custom event', async () => {
    await userEvent.click(page.getByRole('tab', { name: /All/ }));
    await flush();
    await userEvent.click(page.getByText('Done (1)'));
    await flush();
    expect(state().showDone).toBe(false);
  });
});

describe('forms: form-associated elements need no React wiring', () => {
  it('a native form reads ui-text-field through FormData, and reset() clears it', async () => {
    const input = page.getByRole('textbox', { name: 'New task' });
    await userEvent.type(input, 'Call the dentist{Enter}');
    await flush();
    expect(state().tasks.map((t) => t.title)).toContain('Call the dentist');
    expect(host.querySelector<UiTextField>('ui-text-field')!.value).toBe('');
  });

  it('an empty submit shows the error through the error property', async () => {
    await userEvent.click(page.getByRole('button', { name: 'Add' }));
    await flush();
    expect(host.querySelector<UiTextField>('ui-text-field')!.error).toBe('Give the task a name.');
  });
});

describe('a controlled dialog', () => {
  it('opens from state, and onui-close drives the result', async () => {
    await userEvent.click(page.getByRole('button', { name: 'Erase "Buy oat milk"' }));
    await flush();
    const dialog = host.querySelector<UiDialog>('ui-dialog')!;
    expect(dialog.open).toBe(true);
    expect(page.getByRole('dialog', { name: 'Erase “Buy oat milk”?' }).element()).toBeTruthy();

    await userEvent.click(page.getByRole('button', { name: 'Erase', exact: true }));
    await flush();
    expect(dialog.open).toBe(false);
    expect(state().tasks.map((t) => t.title)).toEqual(['Renew passport']);
  });

  it('Escape closes it, React state follows, and it can open again', async () => {
    await userEvent.click(page.getByRole('button', { name: 'Erase "Buy oat milk"' }));
    await flush();
    await userEvent.keyboard('{Escape}');
    await flush();
    const dialog = host.querySelector<UiDialog>('ui-dialog')!;
    expect(dialog.open).toBe(false);
    expect(state().tasks).toHaveLength(2);

    await userEvent.click(page.getByRole('button', { name: 'Erase "Buy oat milk"' }));
    await flush();
    expect(dialog.open).toBe(true);
    await userEvent.keyboard('{Escape}');
    await flush();
  });
});
