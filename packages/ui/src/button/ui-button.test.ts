import { html } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture } from '../test/fixture.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import './ui-button.js';
import type { UiButton } from './ui-button.js';

const inner = (el: UiButton) => el.shadowRoot!.querySelector('button')!;

describe('ui-button: properties and attributes', () => {
  it('defaults to variant="secondary", size="md", type="button"', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Save</ui-button>`);
    expect(el.variant).toBe('secondary');
    expect(el.size).toBe('md');
    expect(el.type).toBe('button');
  });

  it('reflects variant, size and disabled so consumers can style on them', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Save</ui-button>`);
    el.variant = 'danger';
    el.size = 'sm';
    el.disabled = true;
    await el.updateComplete;
    expect(el.getAttribute('variant')).toBe('danger');
    expect(el.getAttribute('size')).toBe('sm');
    expect(el.hasAttribute('disabled')).toBe(true);
  });

  it('reads attributes into properties', async () => {
    const el = await fixture<UiButton>(html`<ui-button variant="primary" disabled>Save</ui-button>`);
    expect(el.variant).toBe('primary');
    expect(el.disabled).toBe(true);
    expect(inner(el).disabled).toBe(true);
  });

  it('forwards label to the inner button as its accessible name', async () => {
    const el = await fixture<UiButton>(html`<ui-button label="Close">✕</ui-button>`);
    expect(inner(el).getAttribute('aria-label')).toBe('Close');
  });
});

describe('ui-button: slots', () => {
  it('renders default, prefix and suffix slots in order', async () => {
    const el = await fixture<UiButton>(html`
      <ui-button><span slot="prefix">←</span>Back<span slot="suffix">!</span></ui-button>`);
    const names = [...inner(el).querySelectorAll('slot')].map((s) => s.name || 'default');
    expect(names).toEqual(['prefix', 'default', 'suffix']);
  });
});

describe('ui-button: accessible name warning', () => {
  it('warns when there is no text and no label', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await fixture<UiButton>(html`<ui-button><svg aria-hidden="true"></svg></ui-button>`);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('accessible name'), expect.anything());
    warn.mockRestore();
  });

  it('stays quiet when there is text or a label', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await fixture<UiButton>(html`<ui-button>Save</ui-button>`);
    await fixture<UiButton>(html`<ui-button label="Close"><svg aria-hidden="true"></svg></ui-button>`);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('ui-button: keyboard and focus', () => {
  it('is reachable with Tab', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Save</ui-button>`);
    await userEvent.tab();
    expect(document.activeElement).toBe(el);
    expect(el.shadowRoot!.activeElement).toBe(inner(el));
  });

  it('focus() on the host moves focus to the inner button (delegatesFocus)', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Save</ui-button>`);
    el.focus();
    expect(el.shadowRoot!.activeElement).toBe(inner(el));
  });

  it('activates on Enter and on Space', async () => {
    const onClick = vi.fn();
    await fixture<UiButton>(html`<ui-button @click=${onClick}>Save</ui-button>`);
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('is skipped by Tab when disabled', async () => {
    const el = await fixture<HTMLDivElement>(html`
      <div><ui-button disabled>One</ui-button><ui-button>Two</ui-button></div>`);
    await userEvent.tab();
    expect(document.activeElement).toBe(el.children[1]);
  });

  it('fires no click for consumers when disabled, from a pointer', async () => {
    const onClick = vi.fn();
    const el = await fixture<UiButton>(html`<ui-button disabled @click=${onClick}>Save</ui-button>`);
    await userEvent.click(el, { force: true });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('fires no click for consumers when disabled, from el.click()', async () => {
    // A native disabled <button>.click() does nothing. The host is not a
    // <button>, so without a guard this click would reach listeners.
    const onClick = vi.fn();
    const el = await fixture<UiButton>(html`<ui-button disabled @click=${onClick}>Save</ui-button>`);
    el.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('blocks clicks when disabled is set as a property, because it reflects', async () => {
    const onClick = vi.fn();
    const el = await fixture<UiButton>(html`<ui-button @click=${onClick}>Save</ui-button>`);
    el.disabled = true;
    await el.updateComplete;
    el.click();
    await userEvent.tab();
    expect(onClick).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(el);
  });
});

describe('ui-button: forms', () => {
  const inForm = (button: ReturnType<typeof html>) => html`
    <form @submit=${(e: Event) => e.preventDefault()}>
      <input name="q" value="x" />${button}
    </form>`;

  it('type="submit" submits its form, across the shadow boundary', async () => {
    const form = await fixture<HTMLFormElement>(inForm(html`<ui-button type="submit">Go</ui-button>`));
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    form.addEventListener('submit', onSubmit);
    await userEvent.click(form.querySelector('ui-button')!);
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('type="button" does not submit', async () => {
    const form = await fixture<HTMLFormElement>(inForm(html`<ui-button>Go</ui-button>`));
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    form.addEventListener('submit', onSubmit);
    await userEvent.click(form.querySelector('ui-button')!);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('is disabled by a disabled <fieldset>, like a native button', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fieldset disabled><ui-button type="submit">Go</ui-button></fieldset></form>`);
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    form.addEventListener('submit', onSubmit);
    const button = form.querySelector('ui-button')!;
    await button.updateComplete;
    expect(inner(button).disabled).toBe(true);
    await userEvent.click(button, { force: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('ui-button: axe', () => {
  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)('%s has no violations', async (variant) => {
    const el = await fixture<UiButton>(html`<ui-button variant=${variant}>Save</ui-button>`);
    await expectNoA11yViolations(el);
  });

  it('icon-only with a label has no violations', async () => {
    const el = await fixture<UiButton>(html`<ui-button label="Close"><svg aria-hidden="true"></svg></ui-button>`);
    await expectNoA11yViolations(el);
  });
});
