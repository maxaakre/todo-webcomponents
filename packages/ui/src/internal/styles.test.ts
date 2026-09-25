import { html } from 'lit';
import { describe, expect, it } from 'vitest';
import tokens from '../tokens/tokens.css?inline';
import { fixture } from '../test/fixture.js';
import { toRgb } from '../test/contrast.js';
import { base } from './styles.js';
import '../button/ui-button.js';

// Every `--_name: var(--ui-name, fallback)` pair written in base.
const pairs = [...base.cssText.matchAll(/(--_[a-z0-9-]+):\s*var\((--ui-[a-z0-9-]+),/g)]
  .map(([, own, token]) => ({ own, token }));

describe('fallbacks in internal/styles.ts', () => {
  it('equal the light theme in tokens.css, so a page without it looks the same', async () => {
    // Guard the parsing: an empty list would make this test pass vacuously.
    expect(pairs.length).toBeGreaterThan(0);

    // 1. No tokens.css on the page: what the fallbacks give.
    const bare = await fixture<HTMLElement>(html`<ui-button>x</ui-button>`);
    const read = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name).trim();
    const fallback = Object.fromEntries(pairs.map(({ own }) => [own, read(bare, own)]));

    // 2. With tokens.css, light theme: what the tokens give.
    const style = document.createElement('style');
    style.textContent = tokens;
    document.head.append(style);
    const themed = await fixture<HTMLDivElement>(html`<div data-theme="light"><ui-button>x</ui-button></div>`);
    const button = themed.querySelector('ui-button')!;

    // Colours may be written differently (#fff vs #ffffff, light-dark()),
    // so compare them as the browser resolves them.
    const norm = (v: string) => (v.startsWith('#') || v.startsWith('light-dark') ? toRgb(v, themed).join() : v);
    const mismatches = pairs
      .map(({ own, token }) => ({ token, fallback: norm(fallback[own]), light: norm(read(button, own)) }))
      .filter((p) => p.fallback !== p.light);
    style.remove();

    expect(mismatches).toEqual([]);
  });
});
