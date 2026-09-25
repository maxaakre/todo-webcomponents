# Design: `@maxaakre/ui` — a small, deep Lit component library

Date: 2026-09-25
Status: built (steps 1–8 done, 2026-09-25). Changes made during the build are marked in the text.

## 1. Purpose

A component library pulled out of the Daily Todo app. It exists so the author can **talk through real code in interviews** for a design-system frontend role (Lit, Web Components, a11y, component API design, tokens, testing, packaging).

**Success means:** every topic in the author's interview notes has a concrete piece of code to open and explain.

### Constraints

- **Time:** 1–2 weeks.
- **Depth over breadth:** 6 components, each meeting the full quality bar (section 7).
- **Honesty:** the library is a learning build, not production code. Gaps (for example, untested screen readers) are written down, not hidden.

### Interview topic → where it is shown

| Topic | Where |
|---|---|
| Properties vs attributes | `ui-button`: reflected `variant`, `disabled` |
| Slots, `slotchange` | `ui-disclosure`, `ui-tabs` |
| Keyboard, focus | `ui-tabs`: arrow keys, roving tabindex |
| Dialog a11y | `ui-dialog`: native `<dialog>`, focus return |
| Forms across shadow DOM | `ui-text-field`, `ui-checkbox`, `ui-button`: `ElementInternals` |
| Events | typed `CustomEvent`s, deliberate `bubbles`/`composed` |
| Tokens, theming | three-tier CSS custom properties, `data-theme`, `::part` |
| Web Components in React | `apps/react-demo` on React 19 |
| Testing | Vitest browser mode + Playwright + axe + keyboard tests |
| Docs | Storybook with API tables generated from the Custom Elements Manifest |
| Versioning, CI | changesets, semver, GitHub Actions |
| Screen readers | a per-component manual test log |

## 2. Repo layout

Approach: **monorepo in this repo**, with pnpm workspaces.

```
webcomponents/
├─ pnpm-workspace.yaml
├─ package.json              # root: shared scripts, dev tools only
├─ .changeset/
├─ .github/workflows/ci.yml
├─ docs/superpowers/specs/
├─ packages/
│  └─ ui/                    # "@maxaakre/ui"
│     ├─ src/
│     │  ├─ tokens/
│     │  └─ <component>/     # ui-<name>.ts, .test.ts, .stories.ts, README.md
│     ├─ custom-elements.json
│     └─ .storybook/
├─ apps/
│  ├─ daily-todo/            # the existing app, moved
│  └─ react-demo/            # React 19 consumer
└─ .scratch/                 # unchanged
```

- **Package name:** `@maxaakre/ui`.
- **Publishing:** ready to publish, not published. CI runs `npm publish --dry-run`.
- **Library build:** `tsc` only. Output is ES modules plus `.d.ts`. No bundler; consumers bundle.
- **Exports:** one entry per component (`@maxaakre/ui/button`, …) plus `@maxaakre/ui/tokens.css`.
- **Tag prefix:** `ui-`.
- **Vercel:** the app's root directory becomes `apps/daily-todo`. Ticket 01 of the multi-device-sync map must be told.

## 3. API conventions (all components)

### Properties and attributes
- Simple values (string, boolean, number) are properties with matching attributes.
- Reflect only what helps styling or reading state: `variant`, `size`, `disabled`, `open`, `selected`.
- Objects and arrays are property-only (`attribute: false`).
- Booleans follow HTML: present means true.

### Events
- Name: `ui-<verb>` (`ui-toggle`, `ui-tab-change`, `ui-close`).
- Every event is typed through a global event map, so `addEventListener` knows the `detail` type.
- `bubbles: true, composed: true` only when the event must leave the component. Each case is documented.
- Where a native event fits (`input`, `change`), re-dispatch it instead of inventing one.
- **Events fire only on user action**, never when code sets a property.

### Slots
- Content goes in slots, not props. A button's label is its default slot.
- Named slots for layout parts (`prefix`, `suffix`, `summary`, `footer`).
- React to `slotchange` where needed.

### Styling hooks
- CSS custom properties are the main theming API (section 5).
- `::part` only for deliberately exposed parts, each documented. Kept few; every part is a promise.

### Focus and forms
- `delegatesFocus: true` when the component wraps one focusable element.
- Form controls are form-associated through `ElementInternals`: value, validity, `disabled`, reset.

### Documentation in code
- JSDoc on every class: `@slot`, `@csspart`, `@cssprop`, `@fires`.
- The Custom Elements Manifest is generated from these tags.

## 4. Components

Listed in build order.

### 4.1 `ui-button`
- **API:** `variant` (`primary` | `secondary` | `ghost` | `danger`), `size`, `disabled`, `type` (`button` | `submit`).
- **Slots:** default (label), `prefix`, `suffix`.
- **Form:** form-associated. `type="submit"` calls `form.requestSubmit()`, because a button in shadow DOM cannot submit a form by itself.
- **Accessible name:** an icon-only button with no name logs a dev-mode warning.
- **App use:** Add, Erase, Triage verdicts.

### 4.2 `ui-text-field`
- **API:** `label`, `value`, `name`, `required`, `disabled`, `placeholder`, `hint`, `error`.
- **Label:** rendered inside the shadow root, because an outside `<label for>` cannot reach an inner `<input>`. `hint` and `error` link through `aria-describedby`, also inside.
- **Form:** form-associated; validity mirrors the inner input.
- **Events:** native `input` and `change`, re-dispatched.
- **App use:** the task composer.

### 4.3 `ui-checkbox`
- **API:** `checked`, `indeterminate`, `disabled`, `name`, `value`.
- **Slots:** default (label). Clicking the label text toggles the box.
- **Form:** form-associated with a boolean value.
- **App use:** marking a Task done or open.

### 4.4 `ui-disclosure`
- **Built on** native `<details>`/`<summary>`.
- **API:** `open` (reflected, synced both ways).
- **Slots:** `summary`, default.
- **Events:** `ui-toggle`, `detail: { open }`.
- **App use:** collapsible leftovers in Triage.

### 4.5 `ui-tabs`, `ui-tab`, `ui-tab-panel`
- **Pattern:** ARIA tabs, **manual activation**. ←/→ move focus and wrap, Home/End jump, Enter/Space select, Tab moves to the panel.
- **Roving tabindex:** only the selected tab is in the tab order.
- **Structure:** tabs and panels are light-DOM children of `ui-tabs`, so `aria-controls` and `aria-labelledby` stay in one DOM tree.
- **Slots:** `tab` for `ui-tab` elements, default for panels. Re-link on `slotchange`.
- **Events:** `ui-tab-change`, `detail: { index, value }`.
- **App use:** none. Portfolio-only: shown in Storybook and the React demo.

### 4.6 `ui-dialog`
- **Built on** native `<dialog>` with `showModal()`: focus trap, background `inert` and top layer come from the platform.
- **API:** `open` (reflected), `label`, `close-on-backdrop` (off by default).
- **Slots:** default, `footer`.
- **Behaviour:** Escape closes. Focus returns to the element that had focus before opening.
- **Events:** `ui-close`, `detail: { returnValue }`, cancelable. Calling `preventDefault()` keeps the dialog open.
- **Motion:** open animation off under `prefers-reduced-motion`.
- **App use:** confirm before Erase.

## 5. Tokens and theming

Grows the app's existing tokens in `src/styles.css`.

### Tiers
1. **Primitive:** raw values (`--ui-blue-600`, `--ui-space-2`). Not read by components.
2. **Semantic:** meaning (`--ui-color-accent`, `--ui-color-border`). Themes override this tier.
3. **Component:** one knob per need (`--ui-button-radius`), falling back to tier 2.

- Components read only tiers 2 and 3.
- Components read private copies (`--_color-accent`, …) defined once in `internal/styles.ts`, each with a light-theme fallback, so components render without `tokens.css`. A test checks the fallbacks match the tokens.
- **Changed after review:** semantic colours use `light-dark()`, written once; `data-theme` sets `color-scheme`.

### Themes
- Default follows `prefers-color-scheme`.
- `data-theme="light" | "dark"` on any ancestor overrides it.
- Custom themes override tier 2 on a wrapper. Storybook shows one example.

### Accessibility
- All text/background pairs meet WCAG AA (4.5:1 text, 3:1 borders and focus rings). A test enforces it.
- `@media (forced-colors: active)` maps components to system colours.
- `prefers-reduced-motion` is honoured.

### Out of scope
- No token build tool (for example Style Dictionary). Plain CSS serves one platform.

### App migration
- The app's `styles.css` keeps only the page reset and imports `@maxaakre/ui/tokens.css`. The app switches to the new token names.

## 6. Testing

### Library (Vitest browser mode, Playwright, Chromium)
1. **Behaviour:** property/attribute sync, events only on user action with correct `detail`, slots, form association (`FormData`, reset, `disabled`).
2. **Keyboard:** real key presses through `userEvent`. Each component's keyboard contract is written as tests.
3. **axe:** every story is checked by one shared helper, `expectNoA11yViolations(el)`. Known limit: axe catches roughly 30–40% of real issues.
4. **Contrast:** token pairs checked against the WCAG ratios.

### Manual screen-reader log
- Each component README holds a table: what was tested, what was announced, pass/fail.
- Tested: VoiceOver + Safari.
- Listed as not tested: NVDA + Firefox, JAWS.

### App
- The app's 62 existing tests must pass after the move.
- **Changed during step 4:** happy-dom has no `ElementInternals`, so `elements.test.ts` runs in Chromium (Vitest browser mode). The pure logic tests stay on happy-dom.

### Out of scope
- No visual regression screenshots.

## 7. Quality bar per component

A component is done when it has:
- behaviour, keyboard and axe tests, all passing
- stories for each state, in light and dark
- JSDoc tags, so its API table generates
- a README with purpose, when not to use it, keyboard contract and screen-reader log
- a changeset

## 8. Docs, versioning, CI

### Storybook
- Web Components + Vite framework.
- API tables generated from the Custom Elements Manifest.
- Per component: overview, state stories, a11y notes, keyboard contract.
- A Foundations page for tokens with swatches and contrast ratios.
- A Decisions section with short ADRs: light-DOM tabs, native `<dialog>`, events only on user action.
- Deployed to Vercel as a static site.

### Versioning
- changesets for every change to `packages/ui`. The CHANGELOG is generated.
- Deprecation: `@deprecated` plus a dev warning, kept one minor version, removed in the next major.
- First version `0.1.0`. Before 1.0, a minor release may break things.

### CI (GitHub Actions, every push and PR)
1. install with pnpm cache
2. typecheck
3. lint with lit-analyzer
4. tests: library in browser, app on happy-dom
5. build library, apps and Storybook
6. check `custom-elements.json` is up to date
7. build Storybook, then a smoke test: every story loads and every `ui-*` element in it is defined
8. `npm publish --dry-run`

## 9. Build order

| Step | Work | Done when |
|---|---|---|
| 1 | Move the app to `apps/daily-todo`, add the workspace | 62 tests pass, app runs, Vercel note on ticket 01 |
| 2 | `packages/ui` skeleton: tokens, test runner, axe helper, Storybook, manifest, CI | CI green with no components |
| 3 | `ui-button` | Meets section 7. Sets the template. |
| 4 | `ui-text-field`, `ui-checkbox` | Meet section 7. App composer and list use them. |
| 5 | `ui-disclosure` | Meets section 7. Used in Triage. |
| 6 | `ui-tabs` | Meets section 7. |
| 7 | `ui-dialog` | Meets section 7. Erase confirmation in the app. |
| 8 | `apps/react-demo`, first `0.1.0` changeset | React demo uses all 6 components |

Steps 1–5 are the core. Stopping after step 5 still covers most interview topics.

## 10. Relation to other work

- **Multi-device sync map:** mostly decisions on paper, so little code conflict. The app move changes the Vercel root (ticket 01). This work settles that map's "Keyboard and accessibility" fog entry for the components it touches.
- **`CONTEXT.md`** glossary stays at the repo root.
