# React demo

Every `@maxaakre/ui` component, used from **React 19**. It exists to prove the library works for a React team, with tests, not claims.

```bash
pnpm --filter react-demo dev    # http://localhost:5173
pnpm --filter react-demo test   # 10 tests, real Chromium
```

## What the tests prove

| Claim | How |
|---|---|
| React 19 sets **properties**, not attributes, when the element has them | `checked`, `selectedIndex`, `hideLabel`, `open` all work from JSX |
| `onClick` and `onChange` work as usual | The checkbox toggles **once** per click (twice would undo it) |
| **Custom events** use `on` + the exact name | `onui-tab-change`, `onui-toggle`, `onui-close`. `onUiTabChange` does *not* work (checked by breaking it) |
| Form-associated elements need **no React wiring** | A plain `<form>` reads `ui-text-field` through `FormData`, and `form.reset()` clears it |
| A dialog can be **controlled** | `open` comes from state; `onui-close` updates state. Escape and reopen both work |

## Typing

`src/custom-elements.d.ts` adds the elements to `React.JSX.IntrinsicElements`, typed from the library's own classes and event types.

## React 18 and older

React 18 sets everything as **attributes** and cannot listen to custom events from JSX. There you would need a wrapper, for example `@lit/react`'s `createComponent`. Worth asking which React version the consuming teams run.
