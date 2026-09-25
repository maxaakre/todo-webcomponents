# `ui-tabs`, `ui-tab`, `ui-tab-panel`

Show one panel at a time. Follows the WAI-ARIA tabs pattern, with **manual activation**.

```html
<ui-tabs label="Task views">
  <ui-tab value="today">Today</ui-tab>
  <ui-tab value="week">This week</ui-tab>
  <ui-tab-panel>…</ui-tab-panel>
  <ui-tab-panel>…</ui-tab-panel>
</ui-tabs>
```

Tabs and panels pair up **by order**.

## When not to use it

- **Content people compare side by side.** Tabs hide all but one. Show it all.
- **Steps in a process.** Use a stepper or separate pages. Tabs suggest any order is fine.
- **Navigation to other pages.** Use links in a `<nav>`. Tabs switch panels in place.

## Decisions

### Tabs and panels are light-DOM children

`aria-controls` (tab → panel) and `aria-labelledby` (panel → tab) are **ID references**, and ID references only work **inside one DOM tree**. If `ui-tabs` rendered the tabs and panels in its own shadow root from data, that would still work. But then consumers could not put their own markup in tabs and panels. So they stay in the consumer's tree, and only the `tablist` wrapper is in the shadow root. In the accessibility tree the slotted tabs still count as children of that tablist.

### Roles are attributes, not `ElementInternals`

`ElementInternals` can set ARIA without adding attributes to the host (`internals.role = 'tab'`). The first version used it. Browsers read it fine.

**The test tools did not.** Playwright's `getByRole`, Testing Library and axe all work out roles from **attributes**. The tabs were invisible to them. In a design system that is a real cost: every team using the component would need workarounds in *their* tests.

So `ui-tab` and `ui-tab-panel` set `role` and `aria-selected` as attributes. A `role` the consumer set is never overwritten.

### Manual activation

Arrow keys move **focus**. Enter or Space **selects**. With automatic activation (selecting on arrow), every arrow press would swap the panel. That's fine for instant content, but bad if a panel is slow to render.

### Roving tabindex follows focus

Only one tab has `tabindex="0"`, and it moves with focus. So **Tab** from any tab goes straight on to the panel, not to another tab. When focus leaves the tab list, the tab stop goes back to the **selected** tab, so coming back lands there.

### Panels are focusable

A panel has `tabindex="0"`. Without it, Tab would skip a panel that has no focusable content, and keyboard users could not reach it to scroll or read (APG).

### Events

`ui-tab-change` fires when the user picks a **different** tab. Not for the same tab, and not when code sets `selectedIndex`. It bubbles but is not composed, like `ui-toggle`.

## Known limits

- **No disabled tabs.**
- **Horizontal only.** No `aria-orientation="vertical"` with ↑/↓.
- **`ui-tab` sets its own `slot="tab"`.** Handy, but it adds an attribute the consumer did not write.

## Keyboard

| Key | Does |
|---|---|
| Tab | Into the tab list: focuses the **selected** tab. From a tab: moves to the panel. |
| → / ← | Next / previous tab. Wraps at both ends. Focus only. |
| Home / End | First / last tab. Does not scroll the page. |
| Enter / Space | Selects the focused tab. |

## Screen-reader log

| Setup | Checked | Should hear | Result |
|---|---|---|---|
| VoiceOver + Safari | Focus a tab | "Today, selected, tab, 1 of 3" | *to do* |
| VoiceOver + Safari | Arrow to next | "This week, tab, 2 of 3" | *to do* |
| VoiceOver + Safari | Tab to panel | Panel content, labelled by its tab | *to do* |
| NVDA + Firefox | — | — | not tested |
| JAWS | — | — | not tested |
