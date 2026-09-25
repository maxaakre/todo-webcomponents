# `ui-text-field`

A single-line text input with its label, hint and error.

```html
<ui-text-field label="Title" name="title" required hint="Keep it short"></ui-text-field>
```

## When not to use it

- **Multi-line text.** Use a `<textarea>`. Not built yet.
- **Search, email, numbers.** Only `type="text"` for now. The others change the keyboard on phones, so they need real support, not a pass-through.

## Decisions

- **The label is inside the component.** ID references (`for`, `aria-labelledby`, `aria-describedby`) do not cross the shadow boundary. An outside `<label for="x">` cannot find an input inside a shadow root. So the label, hint and error all live next to the input.
- **`label` is required.** There is a dev warning without one. `hide-label` hides it visually but keeps it as the accessible name. Better than `aria-label`, because it is still a real `<label>`, and clicking it still works.
- **`input` passes through, `change` is re-dispatched.** Native `input` is *composed*, so it already leaves the shadow root. Native `change` is not, so the host fires its own.
- **No events when code sets `value`.** Only the user causes events. Otherwise a framework that sets `value` in response to `input` would loop.
- **Enter submits the form.** A native input does this ("implicit submission"). The inner input has no form, so the component calls `form.requestSubmit()`.
- **Survives back/forward and autofill** through `formStateRestoreCallback`.
- **`error` makes the field invalid.** It sets a custom validity with that message, so `form.checkValidity()` and `:invalid` agree with what the user sees.

### A subtle one: scripted events

When the browser fires an event from real typing, it runs **microtasks between listeners**, so Lit re-renders before the next listener runs. A scripted `dispatchEvent` gets **no such checkpoint**. Two things only break for scripted events, and both are tested that way:

- `live()` on `.value`. A listener that filters the input (sets `value` back) would otherwise leave the rejected character on screen.
- Syncing the form value inside the `input` handler, not later in `updated()`. Otherwise `FormData` read in a listener is one character behind.

## Keyboard

| Key | Does |
|---|---|
| Tab | Moves focus to the input. Skipped when disabled. |
| Enter | Submits the form, if there is one. |

`focus()` on the host moves focus to the input (`delegatesFocus`).

## Screen-reader log

| Setup | Checked | Should hear | Result |
|---|---|---|---|
| VoiceOver + Safari | Plain | "Task, edit text" | *to do* |
| VoiceOver + Safari | Required | "Task, required, edit text" | *to do* |
| VoiceOver + Safari | With hint | Label, then the hint | *to do* |
| VoiceOver + Safari | With error | "invalid data", then the error | *to do* |
| VoiceOver + Safari | Hidden label | "New task, edit text" | *to do* |
| NVDA + Firefox | — | — | not tested |
| JAWS | — | — | not tested |

**Known gap:** an error that appears *after* submit is not announced by itself. It is linked by `aria-describedby`, so it is read when the field gets focus. The consumer should move focus to the first invalid field.
