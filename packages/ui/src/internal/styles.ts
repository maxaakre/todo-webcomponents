import { css } from 'lit';

/**
 * Shared by every component: put it first in `static styles`.
 *
 * Components read private `--_*` copies of the tokens. Each copy falls back
 * to the light-theme value, so a component still looks right on a page
 * without tokens.css. This is the only place those values are written; a
 * test checks they match tokens.css.
 */
export const base = css`
  :host([hidden]) { display: none; }

  :host {
    --_color-bg: var(--ui-color-bg, #ffffff);
    --_color-surface: var(--ui-color-surface, #f8fafc);
    --_color-text: var(--ui-color-text, #16181d);
    --_color-text-muted: var(--ui-color-text-muted, #5b6270);
    --_color-border: var(--ui-color-border, #e5e7eb);
    --_color-border-strong: var(--ui-color-border-strong, #7c8491);
    --_color-accent: var(--ui-color-accent, #2563eb);
    --_color-on-accent: var(--ui-color-on-accent, #ffffff);
    --_color-danger: var(--ui-color-danger, #b91c1c);
    --_color-on-danger: var(--ui-color-on-danger, #ffffff);
    --_color-focus: var(--ui-color-focus, #2563eb);

    --_space-1: var(--ui-space-1, 0.35rem);
    --_space-2: var(--ui-space-2, 0.75rem);
    --_space-3: var(--ui-space-3, 1.25rem);
    --_radius-sm: var(--ui-radius-sm, 6px);
    --_radius-md: var(--ui-radius-md, 10px);
    --_duration: var(--ui-duration, 150ms);

    /* One focus ring for everything. Use: outline: var(--_focus-ring). */
    --_focus-ring: 2px solid var(--_color-focus);
  }

  /* Windows High Contrast: the system's highlight colour for every ring. */
  @media (forced-colors: active) {
    :host { --_color-focus: Highlight; }
  }
`;
