# @maxaakre/ui

A small, deep Lit component library: accessible, typed, themeable. Works in any framework, including React 19.

```bash
npm install @maxaakre/ui lit
```

```js
import '@maxaakre/ui/tokens.css';   // design tokens, light + dark
import '@maxaakre/ui/button';       // registers <ui-button>
```

```html
<ui-button variant="primary" type="submit">Save</ui-button>
```

## Components

| Import | Elements |
|---|---|
| `@maxaakre/ui/button` | `ui-button` |
| `@maxaakre/ui/text-field` | `ui-text-field` |
| `@maxaakre/ui/checkbox` | `ui-checkbox` |
| `@maxaakre/ui/disclosure` | `ui-disclosure` |
| `@maxaakre/ui/tabs` | `ui-tabs`, `ui-tab`, `ui-tab-panel` |
| `@maxaakre/ui/dialog` | `ui-dialog` |

Each component folder has a README with its decisions, keyboard contract and screen-reader log. The full API is in `custom-elements.json`.

## React 19

Types for JSX, generated from the manifest. Import once:

```ts
import type {} from '@maxaakre/ui/react';
```

Props become properties (`checked`, `selectedIndex`). Custom events use `on` plus the exact name: `onui-close`, `onui-toggle`, `onui-tab-change`.

## Theming

Override the semantic tokens (`--ui-color-*`) on any ancestor, or force a theme with `data-theme="light"` or `data-theme="dark"`. Components also read one `--ui-<component>-*` property each, and expose a few `::part`s.

## Versioning

Semver, through changesets. Before 1.0, a minor version may break things. Deprecations warn in dev for one minor version before removal.
