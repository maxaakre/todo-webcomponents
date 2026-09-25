import { html } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture } from '../test/fixture.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import './ui-disclosure.js';
import type { UiDisclosure } from './ui-disclosure.js';

const details = (el: UiDisclosure) => el.shadowRoot!.querySelector('details')!;
const summary = (el: UiDisclosure) => el.shadowRoot!.querySelector('summary')!;

/** The native toggle event is queued as a task, so wait one. */
const nextTask = () => new Promise((r) => setTimeout(r, 0));

const make = (open = false) => fixture<UiDisclosure>(html`
  <ui-disclosure ?open=${open}>
    <span slot="summary">Unfinished (2)</span>
    <p>Fix the bike</p>
  </ui-disclosure>`);

describe('ui-disclosure: open, both ways', () => {
  it('is closed by default, and the content is hidden', async () => {
    const el = await make();
    expect(el.open).toBe(false);
    expect(details(el).open).toBe(false);
    // Not getBoundingClientRect: Chrome hides closed <details> content with
    // content-visibility, which keeps a layout size.
    expect(el.querySelector('p')!.checkVisibility()).toBe(false);
    el.open = true;
    await el.updateComplete;
    expect(el.querySelector('p')!.checkVisibility()).toBe(true);
  });

  it('native → property: a user click updates open', async () => {
    const el = await make();
    await userEvent.click(summary(el));
    await nextTask();
    expect(el.open).toBe(true);
    expect(el.hasAttribute('open')).toBe(true);
  });
});

describe('ui-disclosure: events', () => {
  it('fires ui-toggle with the new state when the user toggles', async () => {
    const el = await make();
    const seen: boolean[] = [];
    el.addEventListener('ui-toggle', (e) => seen.push(e.detail.open));
    await userEvent.click(summary(el));
    await nextTask();
    await userEvent.click(summary(el));
    await nextTask();
    expect(seen).toEqual([true, false]);
  });

  it('fires no ui-toggle when open is set in code', async () => {
    const el = await make();
    const onToggle = vi.fn();
    el.addEventListener('ui-toggle', onToggle);
    el.open = true;
    await el.updateComplete;
    await nextTask();
    el.open = false;
    await el.updateComplete;
    await nextTask();
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('ui-toggle bubbles, but does not cross a shadow boundary', async () => {
    const el = await make();
    const onToggle = vi.fn<(e: Event) => void>();
    el.parentElement!.addEventListener('ui-toggle', onToggle);
    await userEvent.click(summary(el));
    await nextTask();
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle.mock.calls[0][0].composed).toBe(false);
  });
});

describe('ui-disclosure: keyboard', () => {
  it('toggles with Enter and Space on the summary', async () => {
    const el = await make();
    await userEvent.tab();
    expect(el.shadowRoot!.activeElement).toBe(summary(el));
    await userEvent.keyboard('{Enter}');
    await nextTask();
    expect(el.open).toBe(true);
    await userEvent.keyboard(' ');
    await nextTask();
    expect(el.open).toBe(false);
  });
});

describe('ui-disclosure: slots and a11y', () => {
  it('puts the summary slot inside <summary>, and content outside it', async () => {
    const el = await make(true);
    expect(summary(el).querySelector('slot[name="summary"]')).not.toBeNull();
    expect(summary(el).querySelector('slot:not([name])')).toBeNull();
  });

  it('warns in dev when the summary is empty', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await fixture<UiDisclosure>(html`<ui-disclosure><p>Body</p></ui-disclosure>`);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('summary'), expect.anything());
    warn.mockRestore();
  });

  it('has no axe violations, closed or open', async () => {
    await expectNoA11yViolations(await make(false));
    await expectNoA11yViolations(await make(true));
  });
});
