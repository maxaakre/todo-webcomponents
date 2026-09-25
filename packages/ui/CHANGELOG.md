# @maxaakre/ui

## 0.2.0

### Minor Changes

- e3868a5: Add `@maxaakre/ui/react`: JSX types for React 19, generated from `custom-elements.json`. `import type {} from '@maxaakre/ui/react'` types every element's properties and custom events.

### Patch Changes

- 26fe35f: `ui-dialog`: `close-on-backdrop` no longer closes on a text selection dragged out onto the backdrop. `ui-tabs`: arrow keys follow reading direction in right-to-left layouts. `ui-checkbox`: `form.reset()` restores `checked` set as a property before connecting (React). `ui-checkbox` and `ui-text-field` restore their state on back/forward navigation and autofill.
- 1962490: `ui-button` has a visible hover state in every variant, in both themes. Outlined (`secondary`) and `ghost` buttons previously showed no visible change. Hover is off for disabled buttons and on touch-only devices.
- 483e57e: Dev-only warnings are now silent in webpack and Rollup production builds too: `process.env.NODE_ENV` is read (literally, so bundlers can replace it) when `import.meta.env` is not available.
- aea9a52: `ui-dialog` no longer closes when a click inside it bubbles past an ancestor that has `data-dialog-close`. All elements now skip registration, with a dev warning, when their tag is already defined, so two copies of the library on one page no longer crash it.
- 714cc32: Tokens use `light-dark()`, so each semantic colour is written once; `data-theme` now just sets `color-scheme`. Components share one set of fallbacks, one focus ring and one Windows High Contrast rule. No visual change.

## 0.1.0

### Minor Changes

- 70f9a0e: Add `ui-dialog`: a modal on native `<dialog>`, with a cancelable `ui-close` for user closes and `data-dialog-close` buttons.
- b54fbfa: Add `ui-disclosure`: native `<details>` underneath, `open` synced both ways, and a `ui-toggle` event for user changes only.
- a7ea2cf: Add `ui-tabs`, `ui-tab` and `ui-tab-panel`: the WAI-ARIA tabs pattern with manual activation and roving tabindex. Tabs and panels are light-DOM children so `aria-controls` works.
- 57ba852: Add `ui-text-field` (label, hint, error, validation, Enter submits) and `ui-checkbox` (indeterminate, form value, reset). Both are form-associated.
- 0542f88: Add `ui-button`: four variants, two sizes, form-associated submit, and a dev warning for buttons with no accessible name.
