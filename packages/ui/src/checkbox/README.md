# `ui-checkbox`

A checkbox with its label.

```html
<ui-checkbox name="done" checked>Buy oat milk</ui-checkbox>
```

## When not to use it

- **An instant on/off setting**, like "Dark mode". That is a switch (`role="switch"`). Not built yet.
- **One choice out of several.** Use radio buttons.

## Decisions

- **The slotted text is the label.** The `<label>` in the shadow root wraps both the input and the slot, so clicking the text toggles the box. No ID references needed.
- **`checked` reflects** for styling. So the attribute cannot also hold the *initial* state, like it does on a native checkbox. The initial state is captured once, on first connect, from the **property**, and restored on `form.reset()`. Not from the attribute: React sets `checked` before the element connects, when there is no attribute yet.
- **Survives back/forward.** The form value is saved with a state (`'checked'` / `'unchecked'`), which the browser hands back to `formStateRestoreCallback`.
- **`indeterminate` does not reflect**, same as native. It is a display state, not a value.
- **`change` is re-dispatched** (native `change` is not composed). `checked` is already updated when it fires.
- **Controlled use works.** A consumer can refuse a toggle by setting `checked` back in its `change` listener. `live()` makes the DOM follow.

## Keyboard

| Key | Does |
|---|---|
| Tab | Moves focus to the box. Skipped when disabled. |
| Space | Toggles. Clears `indeterminate`. |

## Screen-reader log

| Setup | Checked | Should hear | Result |
|---|---|---|---|
| VoiceOver + Safari | Unchecked | "Buy oat milk, unticked, tick box" | *to do* |
| VoiceOver + Safari | Checked | "Buy oat milk, ticked, tick box" | *to do* |
| VoiceOver + Safari | Indeterminate | "All tasks, mixed, tick box" | *to do* |
| NVDA + Firefox | — | — | not tested |
| JAWS | — | — | not tested |
