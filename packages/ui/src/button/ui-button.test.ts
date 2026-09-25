import { html } from 'lit';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture } from '../test/fixture.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import { contrastRatio } from '../test/contrast.js';
import tokens from '../tokens/tokens.css?inline';
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
  it('has no violations in any variant', async () => {
    const el = await fixture<HTMLDivElement>(html`
      <div>
        <ui-button variant="primary">Save</ui-button>
        <ui-button variant="secondary">Save</ui-button>
        <ui-button variant="ghost">Save</ui-button>
        <ui-button variant="danger">Save</ui-button>
      </div>`);
    await expectNoA11yViolations(el);
  });

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
    '%s: label text meets 4.5:1 against what is actually behind it',
    async (variant) => {
      // axe does not see this inside shadow DOM, and tokens.test.ts checks
      // token pairs, not which pair each variant really renders.
      const el = await fixture<UiButton>(html`<ui-button variant=${variant}>Save</ui-button>`);
      const style = getComputedStyle(inner(el));
      // Secondary and ghost are transparent: behind them is the white test page.
      const bg = style.backgroundColor === 'rgba(0, 0, 0, 0)' ? '#ffffff' : style.backgroundColor;
      expect(contrastRatio(style.color, bg)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('icon-only with a label has no violations', async () => {
    const el = await fixture<UiButton>(html`<ui-button label="Close"><svg aria-hidden="true"></svg></ui-button>`);
    await expectNoA11yViolations(el);
  });
});

describe('ui-button: hover', () => {
  // What the eye can see: fill or border colour, by a margin a person can
  // notice. A filter on a transparent background, or #f8fafc on white
  // (1.04:1), does not count.
  const page = '#ffffff'; // the test page behind transparent buttons
  // No transition: otherwise a colour read right after hovering is taken
  // part-way through the 150ms fade, and the result depends on timing.
  const still = '--ui-duration: 0s';
  const opaque = (c: string) => (c === 'rgba(0, 0, 0, 0)' ? page : c);
  const look = (el: UiButton) => {
    const { backgroundColor, borderColor } = getComputedStyle(inner(el));
    return { bg: opaque(backgroundColor), border: opaque(borderColor) };
  };
  const visiblyChanged = (a: ReturnType<typeof look>, b: ReturnType<typeof look>) =>
    contrastRatio(a.bg, b.bg) >= 1.1 || contrastRatio(a.border, b.border) >= 1.5;

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)('%s visibly changes on hover', async (variant) => {
    const el = await fixture<UiButton>(html`<ui-button variant=${variant} style=${still}>Save</ui-button>`);
    // The pointer may still rest where the last test's button was, which is
    // exactly where this one renders. Move it off first, or "before" is
    // already the hover state.
    await userEvent.unhover(el);
    const before = look(el);
    await userEvent.hover(el);
    expect(visiblyChanged(before, look(el))).toBe(true);
  });

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)('%s keeps 4.5:1 text contrast while hovered', async (variant) => {
    const el = await fixture<UiButton>(html`<ui-button variant=${variant} style=${still}>Save</ui-button>`);
    await userEvent.hover(el);
    const style = getComputedStyle(inner(el));
    const bg = style.backgroundColor === 'rgba(0, 0, 0, 0)' ? '#ffffff' : style.backgroundColor;
    expect(contrastRatio(style.color, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('a disabled button does not react to hover', async () => {
    const el = await fixture<UiButton>(html`<ui-button disabled style=${still}>Save</ui-button>`);
    await userEvent.unhover(el, { force: true });
    const before = look(el);
    await userEvent.hover(el, { force: true });
    expect(look(el)).toEqual(before);
  });

  describe('in the dark theme, with tokens.css', () => {
    let sheet: HTMLStyleElement;
    beforeAll(() => {
      sheet = document.createElement('style');
      sheet.textContent = tokens;
      document.head.append(sheet);
    });
    afterAll(() => sheet.remove());

    it.each(['primary', 'secondary', 'ghost', 'danger'] as const)('%s visibly changes, and keeps 4.5:1', async (variant) => {
      const box = await fixture<HTMLDivElement>(html`
        <div data-theme="dark" style="background: var(--ui-color-bg); padding: 8px">
          <ui-button variant=${variant} style=${still}>Save</ui-button>
        </div>`);
      const el = box.querySelector('ui-button')!;
      const pageBg = getComputedStyle(box).backgroundColor;
      const read = () => {
        const { color, backgroundColor, borderColor } = getComputedStyle(inner(el));
        const bg = backgroundColor === 'rgba(0, 0, 0, 0)' ? pageBg : backgroundColor;
        return { color, bg, border: borderColor === 'rgba(0, 0, 0, 0)' ? bg : borderColor };
      };
      await userEvent.unhover(el);
      const before = read();
      await userEvent.hover(el);
      const after = read();
      expect(contrastRatio(before.bg, after.bg, box) >= 1.1 || contrastRatio(before.border, after.border, box) >= 1.5).toBe(true);
      expect(contrastRatio(after.color, after.bg, box)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
