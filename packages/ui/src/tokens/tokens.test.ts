import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import tokens from './tokens.css?inline';
import { contrastRatio } from '../test/contrast.js';

// [foreground, background, minimum ratio, why]
const PAIRS: [string, string, number, string][] = [
  ['text', 'bg', 4.5, 'body text'],
  ['text', 'surface', 4.5, 'text on a panel'],
  ['text-muted', 'bg', 4.5, 'secondary text'],
  ['text-muted', 'surface', 4.5, 'secondary text on a panel'],
  ['accent', 'bg', 4.5, 'accent used as text'],
  ['on-accent', 'accent', 4.5, 'primary button label'],
  ['danger', 'bg', 4.5, 'danger used as text'],
  ['on-danger', 'danger', 4.5, 'danger button label'],
  ['border-strong', 'bg', 3, 'control border (1.4.11)'],
  ['border-strong', 'surface', 3, 'control border on a panel'],
  ['focus', 'bg', 3, 'focus ring (1.4.11)'],
  ['focus', 'surface', 3, 'focus ring on a panel'],
];

let style: HTMLStyleElement;
beforeAll(() => {
  style = document.createElement('style');
  style.textContent = tokens;
  document.head.append(style);
});
afterAll(() => style.remove());

describe.each(['light', 'dark'])('%s theme', (theme) => {
  it.each(PAIRS)('%s on %s ≥ %s:1 (%s)', (fg, bg, min) => {
    const el = document.createElement('div');
    el.dataset.theme = theme;
    document.body.append(el);
    const read = (role: string) => getComputedStyle(el).getPropertyValue(`--ui-color-${role}`).trim();
    const ratio = contrastRatio(read(fg), read(bg), el);
    el.remove();
    expect(ratio).toBeGreaterThanOrEqual(min);
  });
});
