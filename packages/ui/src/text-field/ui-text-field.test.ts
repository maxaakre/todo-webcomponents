import { html } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture } from '../test/fixture.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import './ui-text-field.js';
import type { UiTextField } from './ui-text-field.js';

const input = (el: UiTextField) => el.shadowRoot!.querySelector('input')!;
const byId = (el: UiTextField, id: string) => el.shadowRoot!.getElementById(id);

/** Set the inner input and fire `input` from script, as test tools do. */
const typeFromCode = (el: UiTextField, text: string) => {
  input(el).value = text;
  input(el).dispatchEvent(new Event('input', { bubbles: true, composed: true }));
};

describe('ui-text-field: label and descriptions', () => {
  it('labels the inner input with a <label> in the same shadow root', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field label="Task"></ui-text-field>`);
    const label = el.shadowRoot!.querySelector('label')!;
    expect(label.textContent!.trim()).toBe('Task');
    expect(label.htmlFor).toBe(input(el).id);
    expect(input(el).labels![0]).toBe(label);
  });

  it('clicking the label focuses the input', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field label="Task"></ui-text-field>`);
    await userEvent.click(el.shadowRoot!.querySelector('label')!);
    expect(el.shadowRoot!.activeElement).toBe(input(el));
  });

  it('links hint and error through aria-describedby, and only when present', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field label="Task"></ui-text-field>`);
    expect(input(el).hasAttribute('aria-describedby')).toBe(false);

    el.hint = 'Keep it short';
    el.error = 'Required';
    await el.updateComplete;
    const ids = input(el).getAttribute('aria-describedby')!.split(' ');
    expect(ids.map((id) => byId(el, id)!.textContent!.trim())).toEqual(['Keep it short', 'Required']);
  });

  it('marks the input invalid while an error is shown', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field label="Task" error="Required"></ui-text-field>`);
    expect(input(el).getAttribute('aria-invalid')).toBe('true');
    el.error = '';
    await el.updateComplete;
    expect(input(el).hasAttribute('aria-invalid')).toBe(false);
  });

  it('hide-label hides the label visually but keeps it as the accessible name', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field label="New task" hide-label></ui-text-field>`);
    const label = el.shadowRoot!.querySelector('label')!;
    expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(input(el).labels![0]).toBe(label);
    await expectNoA11yViolations(el);
  });

  it('warns in dev when there is no label', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await fixture<UiTextField>(html`<ui-text-field></ui-text-field>`);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('label'), expect.anything());
    warn.mockRestore();
  });
});

describe('ui-text-field: value and events', () => {
  it('passes placeholder and required to the inner input', async () => {
    const el = await fixture<UiTextField>(html`
      <ui-text-field label="Task" placeholder="Add a task" required></ui-text-field>`);
    expect(input(el).placeholder).toBe('Add a task');
    expect(input(el).required).toBe(true);
  });

  it('updates value as the user types, and input events reach the host', async () => {
    const onInput = vi.fn();
    const el = await fixture<UiTextField>(html`<ui-text-field label="Task" @input=${onInput}></ui-text-field>`);
    await userEvent.type(input(el), 'Milk');
    expect(el.value).toBe('Milk');
    expect(onInput).toHaveBeenCalledTimes(4);
  });

  it('re-dispatches change on the host, because native change is not composed', async () => {
    const onChange = vi.fn();
    const el = await fixture<UiTextField>(html`
      <div><ui-text-field label="Task" @change=${onChange}></ui-text-field><button>next</button></div>`);
    const field = el.querySelector('ui-text-field')!;
    await userEvent.type(input(field), 'Milk');
    await userEvent.tab();
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].target).toBe(field);
  });

  it('a consumer can filter input by setting value back inside its listener', async () => {
    // Lit skips a DOM write when the value equals the last rendered one.
    // "a" was rendered, the input now shows "a1", the listener sets "a":
    // equal, so without live() the "1" would stay on screen.
    //
    // The event is dispatched from code on purpose. For a real keypress the
    // browser runs microtasks between listeners, so Lit re-renders "a1"
    // first and the bug hides. Scripted events (tests, automation, other
    // libraries) get no such checkpoint.
    const el = await fixture<UiTextField>(html`<ui-text-field label="Letters" value="a"></ui-text-field>`);
    el.addEventListener('input', () => { el.value = el.value.replace(/\d/g, ''); });
    typeFromCode(el, 'a1');
    await el.updateComplete;
    expect(input(el).value).toBe('a');
  });

  it('fires no events when value is set in code', async () => {
    const onInput = vi.fn();
    const onChange = vi.fn();
    const el = await fixture<UiTextField>(html`
      <ui-text-field label="Task" @input=${onInput} @change=${onChange}></ui-text-field>`);
    el.value = 'Set by code';
    await el.updateComplete;
    expect(input(el).value).toBe('Set by code');
    expect(onInput).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ui-text-field: forms', () => {
  it('contributes its value to FormData under its name', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><ui-text-field label="Task" name="title" value="Milk"></ui-text-field></form>`);
    expect(new FormData(form).get('title')).toBe('Milk');
    await userEvent.type(input(form.querySelector('ui-text-field')!), ' now');
    expect(new FormData(form).get('title')).toBe('Milk now');
  });

  it('FormData is current inside an input listener, even for scripted events', async () => {
    // Scripted, for the same reason as the filter test above: no microtask
    // checkpoint between listeners, so the value must sync synchronously.
    const seen: unknown[] = [];
    const form = await fixture<HTMLFormElement>(html`
      <form @input=${(e: Event) => seen.push(new FormData(e.currentTarget as HTMLFormElement).get('title'))}>
        <ui-text-field label="Task" name="title"></ui-text-field>
      </form>`);
    typeFromCode(form.querySelector('ui-text-field')!, 'ab');
    expect(seen).toEqual(['ab']);
  });

  it('submits its form on Enter, like a native input', async () => {
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    const form = await fixture<HTMLFormElement>(html`
      <form @submit=${onSubmit}><ui-text-field label="Task" name="title"></ui-text-field></form>`);
    await userEvent.type(input(form.querySelector('ui-text-field')!), 'Milk{Enter}');
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('is invalid while required and empty, and the form knows', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><ui-text-field label="Task" name="title" required></ui-text-field></form>`);
    const el = form.querySelector('ui-text-field')!;
    expect(el.checkValidity()).toBe(false);
    expect(form.checkValidity()).toBe(false);
    await userEvent.type(input(el), 'x');
    expect(el.checkValidity()).toBe(true);
    expect(form.checkValidity()).toBe(true);
  });

  it('an error message makes it invalid, with that message', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field label="Task" error="Too long"></ui-text-field>`);
    expect(el.checkValidity()).toBe(false);
    expect(el.validationMessage).toBe('Too long');
  });

  it('resets to its initial value with the form', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><ui-text-field label="Task" name="title" value="Start"></ui-text-field></form>`);
    const el = form.querySelector('ui-text-field')!;
    await userEvent.type(input(el), ' more');
    form.reset();
    await el.updateComplete;
    expect(el.value).toBe('Start');
    expect(input(el).value).toBe('Start');
    expect(new FormData(form).get('title')).toBe('Start');
  });

  it('is disabled by a disabled <fieldset> and leaves FormData', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fieldset disabled><ui-text-field label="Task" name="title" value="x"></ui-text-field></fieldset></form>`);
    const el = form.querySelector('ui-text-field')!;
    await el.updateComplete;
    expect(input(el).disabled).toBe(true);
    expect(new FormData(form).has('title')).toBe(false);
  });
});

describe('ui-text-field: keyboard and focus', () => {
  it('is reachable with Tab, and focus() delegates to the input', async () => {
    const el = await fixture<UiTextField>(html`<ui-text-field label="Task"></ui-text-field>`);
    await userEvent.tab();
    expect(el.shadowRoot!.activeElement).toBe(input(el));
    input(el).blur();
    el.focus();
    expect(el.shadowRoot!.activeElement).toBe(input(el));
  });

  it('is skipped by Tab when disabled', async () => {
    const el = await fixture<HTMLDivElement>(html`
      <div><ui-text-field label="A" disabled></ui-text-field><ui-text-field label="B"></ui-text-field></div>`);
    await userEvent.tab();
    expect(document.activeElement).toBe(el.children[1]);
  });
});

describe('ui-text-field: axe', () => {
  it('has no violations: plain, with hint, with error, disabled', async () => {
    const el = await fixture<HTMLDivElement>(html`
      <div>
        <ui-text-field label="Plain"></ui-text-field>
        <ui-text-field label="With hint" hint="Keep it short"></ui-text-field>
        <ui-text-field label="With error" error="Required"></ui-text-field>
        <ui-text-field label="Disabled" disabled></ui-text-field>
      </div>`);
    await expectNoA11yViolations(el);
  });
});
