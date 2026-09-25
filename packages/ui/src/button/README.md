# `ui-button`

A button. It wraps a native `<button>`, so keyboard, focus and screen-reader behaviour come from the platform.

```html
<ui-button variant="primary" type="submit">Save</ui-button>
<ui-button variant="ghost" label="Close"><svg aria-hidden="true">…</svg></ui-button>
```

## When not to use it

- **To go somewhere.** Use a link (`<a href>`). A button *does* something; a link *goes* somewhere. Screen readers announce them differently.
- **As a toggle** that stays on or off. That needs `aria-pressed`, which this button does not support yet.

## Decisions

- **Default `type` is `button`, not `submit`.** The native default causes accidental submits. One extra attribute is cheaper than that bug.
- **Form-associated.** The inner `<button>` sits in the shadow root, so it cannot see a form outside. The host can, through `ElementInternals`, and calls `form.requestSubmit()`. A bonus: the browser treats the host as a real form control. A `disabled` attribute, or a disabled `<fieldset>` around it, removes it from the tab order and blocks clicks. No hand-written guard needed.
- **`label`, not `aria-label` on the host.** The host has no role, so an `aria-label` there names nothing. `label` goes onto the inner `<button>`.
- **No custom event.** Native `click` is enough, and every framework already handles it.
- **Dev warning** when a button has no text and no `label`. An icon-only button without a name is one of the most common a11y bugs.

## Keyboard

| Key | Does |
|---|---|
| Tab | Moves focus to the button. Skipped when disabled. |
| Enter | Activates. |
| Space | Activates. |

`focus()` on the host moves focus to the inner button (`delegatesFocus`).

## Screen-reader log

| Setup | Checked | Heard | Result |
|---|---|---|---|
| VoiceOver + Safari | Text button | "Save, button" | *to do* |
| VoiceOver + Safari | Icon-only with `label="Close"` | "Close, button" | *to do* |
| VoiceOver + Safari | Disabled | "Save, dimmed, button" | *to do* |
| NVDA + Firefox | — | — | not tested |
| JAWS | — | — | not tested |

The "Heard" column is what the platform *should* say. Fill in **Result** after testing by hand.
