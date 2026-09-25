# @maxaakre/ui

## 0.1.0

### Minor Changes

- 70f9a0e: Add `ui-dialog`: a modal on native `<dialog>`, with a cancelable `ui-close` for user closes and `data-dialog-close` buttons.
- b54fbfa: Add `ui-disclosure`: native `<details>` underneath, `open` synced both ways, and a `ui-toggle` event for user changes only.
- a7ea2cf: Add `ui-tabs`, `ui-tab` and `ui-tab-panel`: the WAI-ARIA tabs pattern with manual activation and roving tabindex. Tabs and panels are light-DOM children so `aria-controls` works.
- 57ba852: Add `ui-text-field` (label, hint, error, validation, Enter submits) and `ui-checkbox` (indeterminate, form value, reset). Both are form-associated.
- 0542f88: Add `ui-button`: four variants, two sizes, form-associated submit, and a dev warning for buttons with no accessible name.
