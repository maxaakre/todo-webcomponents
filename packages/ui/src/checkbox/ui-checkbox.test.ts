import { html } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture } from '../test/fixture.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import './ui-checkbox.js';
import type { UiCheckbox } from './ui-checkbox.js';

const box = (el: UiCheckbox) => el.shadowRoot!.querySelector('input')!;

describe('ui-checkbox: properties and attributes', () => {
  it('reads checked and disabled from attributes', async () => {
    const el = await fixture<UiCheckbox>(html`<ui-checkbox checked disabled>Done</ui-checkbox>`);
    expect(el.checked).toBe(true);
    expect(box(el).checked).toBe(true);
    expect(box(el).disabled).toBe(true);
  });

  it('reflects checked, so consumers can style ui-checkbox[checked]', async () => {
    const el = await fixture<UiCheckbox>(html`<ui-checkbox>Done</ui-checkbox>`);
    el.checked = true;
    await el.updateComplete;
    expect(el.hasAttribute('checked')).toBe(true);
  });

  it('shows indeterminate on the native input, so it is announced as "mixed"', async () => {
    const el = await fixture<UiCheckbox>(html`<ui-checkbox>All</ui-checkbox>`);
    el.indeterminate = true;
    await el.updateComplete;
    expect(box(el).indeterminate).toBe(true);
  });
});

describe('ui-checkbox: label', () => {
  it('the slotted text is the accessible name', async () => {
    const el = await fixture<UiCheckbox>(html`<ui-checkbox>Buy milk</ui-checkbox>`);
    await expectNoA11yViolations(el);
    expect(box(el).labels![0].contains(el.shadowRoot!.querySelector('slot'))).toBe(true);
  });

  it('clicking the slotted text toggles it', async () => {
    const el = await fixture<UiCheckbox>(html`<ui-checkbox><span>Buy milk</span></ui-checkbox>`);
    await userEvent.click(el.querySelector('span')!);
    expect(el.checked).toBe(true);
  });

  it('the click target fills the host, so a stretched checkbox is clickable anywhere', async () => {
    const el = await fixture<UiCheckbox>(html`<ui-checkbox style="display:block; width:400px">Done</ui-checkbox>`);
    await userEvent.click(el, { position: { x: 390, y: 5 } });
    expect(el.checked).toBe(true);
  });

  it('warns in dev when it has no label text', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await fixture<UiCheckbox>(html`<ui-checkbox></ui-checkbox>`);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('accessible name'), expect.anything());
    warn.mockRestore();
  });
});

describe('ui-checkbox: user action and events', () => {
  it('toggles on click and on Space', async () => {
    const el = await fixture<UiCheckbox>(html`<ui-checkbox>Done</ui-checkbox>`);
    await userEvent.click(box(el));
    expect(el.checked).toBe(true);
    await userEvent.keyboard(' ');
    expect(el.checked).toBe(false);
  });

  it('clears indeterminate when the user toggles it, like a native checkbox', async () => {
    const el = await fixture<UiCheckbox>(html`<ui-checkbox>All</ui-checkbox>`);
    el.indeterminate = true;
    await el.updateComplete;
    await userEvent.click(box(el));
    expect(el.indeterminate).toBe(false);
    expect(el.checked).toBe(true);
  });

  it('re-dispatches change on the host, with checked already updated', async () => {
    const seen: boolean[] = [];
    const el = await fixture<UiCheckbox>(html`
      <ui-checkbox @change=${(e: Event) => seen.push((e.target as UiCheckbox).checked)}>Done</ui-checkbox>`);
    await userEvent.click(box(el));
    expect(seen).toEqual([true]);
  });

  it('a controlled consumer can refuse a toggle by setting checked back', async () => {
    // Scripted click on purpose: no microtask checkpoint between listeners,
    // so Lit sees checked go true → false → true before it renders. Equal
    // to the last render, so only live() fixes the DOM.
    const el = await fixture<UiCheckbox>(html`<ui-checkbox checked>Locked</ui-checkbox>`);
    el.addEventListener('change', () => { el.checked = true; });
    box(el).click();
    await el.updateComplete;
    expect(box(el).checked).toBe(true);
  });

  it('FormData is current inside a change listener, even for a scripted click', async () => {
    const seen: unknown[] = [];
    const form = await fixture<HTMLFormElement>(html`
      <form @change=${(e: Event) => seen.push(new FormData(e.currentTarget as HTMLFormElement).get('done'))}>
        <ui-checkbox name="done">Done</ui-checkbox>
      </form>`);
    box(form.querySelector('ui-checkbox')!).click();
    expect(seen).toEqual(['on']);
  });

  it('fires no change when checked is set in code', async () => {
    const onChange = vi.fn();
    const el = await fixture<UiCheckbox>(html`<ui-checkbox @change=${onChange}>Done</ui-checkbox>`);
    el.checked = true;
    await el.updateComplete;
    expect(box(el).checked).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not toggle when disabled', async () => {
    const el = await fixture<UiCheckbox>(html`<ui-checkbox disabled>Done</ui-checkbox>`);
    await userEvent.click(el, { force: true });
    expect(el.checked).toBe(false);
  });
});

describe('ui-checkbox: forms', () => {
  it('submits value "on" by default when checked, nothing when not', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><ui-checkbox name="done">Done</ui-checkbox></form>`);
    const el = form.querySelector('ui-checkbox')!;
    expect(new FormData(form).has('done')).toBe(false);
    await userEvent.click(box(el));
    expect(new FormData(form).get('done')).toBe('on');
  });

  it('submits its value attribute when given', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><ui-checkbox name="tag" value="urgent" checked>Urgent</ui-checkbox></form>`);
    expect(new FormData(form).get('tag')).toBe('urgent');
  });

  it('resets to its initial checked state with the form', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><ui-checkbox name="done" checked>Done</ui-checkbox></form>`);
    const el = form.querySelector('ui-checkbox')!;
    await userEvent.click(box(el));
    expect(el.checked).toBe(false);
    form.reset();
    await el.updateComplete;
    expect(el.checked).toBe(true);
    expect(box(el).checked).toBe(true);
    expect(new FormData(form).get('done')).toBe('on');
  });

  it('still resets to its initial state after being moved in the DOM', async () => {
    // checked reflects, so after a toggle the attribute no longer holds the
    // initial state. It must be captured once, not on every connect.
    const form = await fixture<HTMLFormElement>(html`
      <form><ui-checkbox name="done">Done</ui-checkbox><div></div></form>`);
    const el = form.querySelector('ui-checkbox')!;
    await userEvent.click(box(el));
    form.querySelector('div')!.append(el);
    form.reset();
    await el.updateComplete;
    expect(el.checked).toBe(false);
  });

  it('is disabled by a disabled <fieldset>', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fieldset disabled><ui-checkbox name="done" checked>Done</ui-checkbox></fieldset></form>`);
    const el = form.querySelector('ui-checkbox')!;
    await el.updateComplete;
    expect(box(el).disabled).toBe(true);
    expect(new FormData(form).has('done')).toBe(false);
  });
});

describe('ui-checkbox: keyboard and focus', () => {
  it('is reachable with Tab, and skipped when disabled', async () => {
    const el = await fixture<HTMLDivElement>(html`
      <div><ui-checkbox disabled>A</ui-checkbox><ui-checkbox>B</ui-checkbox></div>`);
    await userEvent.tab();
    expect(document.activeElement).toBe(el.children[1]);
  });

  it('focus() delegates to the native input', async () => {
    const el = await fixture<UiCheckbox>(html`<ui-checkbox>Done</ui-checkbox>`);
    el.focus();
    expect(el.shadowRoot!.activeElement).toBe(box(el));
  });
});

describe('ui-checkbox: axe', () => {
  it('has no violations: unchecked, checked, indeterminate, disabled', async () => {
    const el = await fixture<HTMLDivElement>(html`
      <div>
        <ui-checkbox>Unchecked</ui-checkbox>
        <ui-checkbox checked>Checked</ui-checkbox>
        <ui-checkbox .indeterminate=${true}>Mixed</ui-checkbox>
        <ui-checkbox disabled>Disabled</ui-checkbox>
      </div>`);
    await expectNoA11yViolations(el);
  });
});
