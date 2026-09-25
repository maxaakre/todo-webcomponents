# `ui-disclosure`

Show and hide a section.

```html
<ui-disclosure open>
  <span slot="summary">Unfinished (2)</span>
  <ul>…</ul>
</ui-disclosure>
```

## When not to use it

- **Content the user must see.** Hidden content is easy to miss. Don't hide errors or required steps.
- **Switching between views.** Use tabs (`ui-tabs`).
- **A menu or popover** that floats over the page. That is a different pattern, with different keyboard rules.

## Decisions

- **Built on native `<details>` / `<summary>`.** The button role, the expanded/collapsed state, Enter and Space, and find-in-page (the browser opens it to show a match) all come for free. No ARIA written by hand.
- **`open` syncs both ways.** Set it in code and the `<details>` opens. The user clicks and `open` updates and reflects.
- **`ui-toggle` fires only for the user.** Native `toggle` fires for *every* change, including ours, one task later. The handler ignores that echo: if the property already matches the `<details>`, it was us.
- **`ui-toggle` bubbles but is not composed.** A component that wraps this one decides for itself what to expose outside its own shadow root.
- **Summary is text only.** `<summary>` acts as a button, and a button's children are presentational. A heading or link inside it is lost to screen readers.

## Known limit

- **No exclusive accordion.** Native `<details name="x">` closes the others in a group, but only within one DOM tree. Each `ui-disclosure` has its own shadow root, so the grouping cannot work. It would need a parent component to coordinate.

## Keyboard

| Key | Does |
|---|---|
| Tab | Moves focus to the summary. |
| Enter | Opens or closes. |
| Space | Opens or closes. |

## Screen-reader log

| Setup | Checked | Should hear | Result |
|---|---|---|---|
| VoiceOver + Safari | Closed | "Unfinished (2), collapsed, disclosure triangle" | *to do* |
| VoiceOver + Safari | Open | "Unfinished (2), expanded, disclosure triangle" | *to do* |
| NVDA + Firefox | — | — | not tested |
| JAWS | — | — | not tested |
