import { html } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture } from '../test/fixture.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import './ui-dialog.js';
import type { UiCloseEvent, UiDialog } from './ui-dialog.js';

const native = (el: UiDialog) => el.shadowRoot!.querySelector('dialog')!;

/** A trigger button, a dialog with two footer buttons, and something after. */
const make = (attrs: { closeOnBackdrop?: boolean } = {}) => fixture<HTMLDivElement>(html`
  <div>
    <button id="trigger">Erase…</button>
    <ui-dialog label="Erase “Buy milk”?" ?close-on-backdrop=${attrs.closeOnBackdrop}>
      <p>This cannot be undone.</p>
      <button slot="footer" id="cancel" data-dialog-close="cancel">Cancel</button>
      <button slot="footer" id="confirm" data-dialog-close="erase">Erase</button>
    </ui-dialog>
  </div>`);

const parts = (root: HTMLDivElement) => ({
  trigger: root.querySelector<HTMLButtonElement>('#trigger')!,
  dialog: root.querySelector('ui-dialog')!,
  cancel: root.querySelector<HTMLButtonElement>('#cancel')!,
  confirm: root.querySelector<HTMLButtonElement>('#confirm')!,
});

/** Open the way an app does: the user activates a trigger, code sets open. */
const openFrom = async (trigger: HTMLElement, dialog: UiDialog) => {
  trigger.addEventListener('click', () => { dialog.open = true; }, { once: true });
  await userEvent.click(trigger);
  await dialog.updateComplete;
};

describe('ui-dialog: open and close', () => {
  it('open=true shows a modal dialog in the top layer', async () => {
    const { trigger, dialog } = parts(await make());
    await openFrom(trigger, dialog);
    expect(native(dialog).open).toBe(true);
    expect(native(dialog).matches(':modal')).toBe(true);
  });

  it('open=false closes it, and fires no event (code, not the user)', async () => {
    const { trigger, dialog } = parts(await make());
    await openFrom(trigger, dialog);
    const onClose = vi.fn();
    dialog.addEventListener('ui-close', onClose);
    dialog.open = false;
    await dialog.updateComplete;
    expect(native(dialog).open).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps open truthful if the native dialog closes by another path', async () => {
    const { trigger, dialog } = parts(await make());
    await openFrom(trigger, dialog);
    const closed = new Promise((r) => native(dialog).addEventListener('close', r, { once: true }));
    native(dialog).close();
    await closed; // queued on its own task source; setTimeout(0) is not enough
    expect(dialog.open).toBe(false);
    await dialog.updateComplete; // reflection happens on render
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('reflects open', async () => {
    const { trigger, dialog } = parts(await make());
    await openFrom(trigger, dialog);
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('opens on first render when the open attribute is already set', async () => {
    const dialog = await fixture<UiDialog>(html`<ui-dialog label="Hi" open><p>x</p></ui-dialog>`);
    expect(native(dialog).open).toBe(true);
    dialog.open = false;
    await dialog.updateComplete;
  });
});

describe('ui-dialog: focus', () => {
  it('moves focus into the dialog, to the first focusable slotted element', async () => {
    const { trigger, dialog, cancel } = parts(await make());
    await openFrom(trigger, dialog);
    expect(document.activeElement).toBe(cancel);
  });

  it('Tab never reaches the page behind it', async () => {
    // A native modal does not loop Tab. Past the last control, focus may go
    // to the browser's own UI (activeElement is then <body>). That is
    // intended: what inert guarantees is that page content is unreachable.
    const { trigger, dialog, cancel, confirm } = parts(await make());
    await openFrom(trigger, dialog);
    await userEvent.tab();
    expect(document.activeElement).toBe(confirm);
    for (let i = 0; i < 4; i++) {
      await userEvent.tab();
      expect([cancel, confirm, document.body]).toContain(document.activeElement);
    }
  });

  it('makes the rest of the page inert', async () => {
    const { trigger, dialog } = parts(await make());
    await openFrom(trigger, dialog);
    const onClick = vi.fn();
    trigger.addEventListener('click', onClick);
    await userEvent.click(trigger, { force: true });
    expect(onClick).not.toHaveBeenCalled();
  });

  // The next two guard platform behaviour, not ours: the browser restores
  // focus when a modal closes. If that ever changes, these fail.
  it('returns focus to the trigger after closing', async () => {
    const { trigger, dialog } = parts(await make());
    await openFrom(trigger, dialog);
    await userEvent.keyboard('{Escape}');
    await dialog.updateComplete;
    expect(document.activeElement).toBe(trigger);
  });

  it('returns focus to a trigger inside another shadow root', async () => {
    const host = await fixture<HTMLDivElement>(html`<div></div>`);
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = '<button>Erase…</button>';
    const trigger = root.querySelector('button')!;
    const dialog = document.createElement('ui-dialog');
    dialog.label = 'Sure?';
    dialog.innerHTML = '<button slot="footer" data-dialog-close="ok">OK</button>';
    root.append(dialog);
    await openFrom(trigger, dialog);
    await userEvent.keyboard('{Escape}');
    await dialog.updateComplete;
    expect(root.activeElement).toBe(trigger);
  });
});

describe('ui-dialog: user closes and ui-close', () => {
  it('Escape closes it and fires ui-close with an empty returnValue', async () => {
    const { trigger, dialog } = parts(await make());
    await openFrom(trigger, dialog);
    const seen: string[] = [];
    dialog.addEventListener('ui-close', (e) => seen.push(e.detail.returnValue));
    await userEvent.keyboard('{Escape}');
    await dialog.updateComplete;
    expect(dialog.open).toBe(false);
    expect(seen).toEqual(['']);
  });

  it('a data-dialog-close button closes it with that value', async () => {
    const { trigger, dialog, confirm } = parts(await make());
    await openFrom(trigger, dialog);
    const seen: string[] = [];
    dialog.addEventListener('ui-close', (e) => seen.push(e.detail.returnValue));
    await userEvent.click(confirm);
    await dialog.updateComplete;
    expect(dialog.open).toBe(false);
    expect(seen).toEqual(['erase']);
    expect(dialog.returnValue).toBe('erase');
  });

  it('preventDefault on ui-close keeps it open', async () => {
    const { trigger, dialog, confirm } = parts(await make());
    await openFrom(trigger, dialog);
    dialog.addEventListener('ui-close', (e: UiCloseEvent) => e.preventDefault());
    await userEvent.click(confirm);
    await dialog.updateComplete;
    expect(dialog.open).toBe(true);
    expect(native(dialog).open).toBe(true);
    dialog.open = false;
    await dialog.updateComplete;
  });

  it('preventDefault on ui-close also blocks Escape', async () => {
    const { trigger, dialog } = parts(await make());
    await openFrom(trigger, dialog);
    dialog.addEventListener('ui-close', (e) => e.preventDefault());
    await userEvent.keyboard('{Escape}');
    await dialog.updateComplete;
    expect(native(dialog).open).toBe(true);
    dialog.open = false;
    await dialog.updateComplete;
  });

  // A click at the page corner lands on the ::backdrop, whose event target
  // is the <dialog> itself.
  it('ignores backdrop clicks by default', async () => {
    const { trigger, dialog } = parts(await make());
    await openFrom(trigger, dialog);
    await userEvent.click(document.body, { position: { x: 2, y: 2 }, force: true });
    await dialog.updateComplete;
    expect(dialog.open).toBe(true);
    dialog.open = false;
    await dialog.updateComplete;
  });

  it('close-on-backdrop closes on a backdrop click, but not on a click inside', async () => {
    const { trigger, dialog } = parts(await make({ closeOnBackdrop: true }));
    await openFrom(trigger, dialog);
    await userEvent.click(dialog.querySelector('p')!);
    await dialog.updateComplete;
    expect(dialog.open).toBe(true);
    await userEvent.click(document.body, { position: { x: 2, y: 2 }, force: true });
    await dialog.updateComplete;
    expect(dialog.open).toBe(false);
  });

  it('ui-close bubbles but is not composed', async () => {
    const root = await make();
    const { trigger, dialog } = parts(root);
    await openFrom(trigger, dialog);
    const onClose = vi.fn<(e: Event) => void>();
    root.addEventListener('ui-close', onClose);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
    expect(onClose.mock.calls[0][0].composed).toBe(false);
  });
});

describe('ui-dialog: name and a11y', () => {
  it('is named by its label, shown as a visible heading', async () => {
    const { trigger, dialog } = parts(await make());
    await openFrom(trigger, dialog);
    const heading = dialog.shadowRoot!.querySelector('h2')!;
    expect(heading.textContent!.trim()).toBe('Erase “Buy milk”?');
    expect(native(dialog).getAttribute('aria-labelledby')).toBe(heading.id);
  });

  it('warns in dev when opened without a label, not before', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const dialog = await fixture<UiDialog>(html`<ui-dialog><p>x</p></ui-dialog>`);
    expect(warn).not.toHaveBeenCalled(); // a label may still arrive before opening
    dialog.open = true;
    await dialog.updateComplete;
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('label'), expect.anything());
    dialog.open = false;
    await dialog.updateComplete;
    warn.mockRestore();
  });

  it('has no axe violations while open', async () => {
    const root = await make();
    const { trigger, dialog } = parts(root);
    await openFrom(trigger, dialog);
    await expectNoA11yViolations(root);
    dialog.open = false;
    await dialog.updateComplete;
  });
});
