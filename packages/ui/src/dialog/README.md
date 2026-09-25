# `ui-dialog`

A modal dialog.

```html
<ui-dialog label="Erase “Buy oat milk”?">
  <p>This cannot be undone.</p>
  <ui-button slot="footer" data-dialog-close="cancel">Cancel</ui-button>
  <ui-button slot="footer" variant="danger" data-dialog-close="erase">Erase</ui-button>
</ui-dialog>
```

```js
dialog.open = true;
dialog.addEventListener('ui-close', (e) => {
  if (e.detail.returnValue === 'erase') erase();
});
```

## When not to use it

- **To show a message** the user does not have to act on. Use inline text or a status message. A modal blocks the whole page.
- **For long forms or flows.** Use a page.
- **Non-modal popovers** (menus, tooltips). Use the `popover` attribute instead.

## Decisions

- **Built on native `<dialog>` and `showModal()`.** The platform gives: the focus trap (the page behind is `inert`), the top layer (no `z-index` fights), Escape, and **focus return** to the element that opened it. None of that is hand-written.
- **Focus return is the platform's.** The first version saved the opener and focused it on close, walking into shadow roots to find it. A mutation test showed that code did nothing: the browser already restores focus, even into another shadow root. It was deleted. Two tests now guard the *platform* behaviour.
- **Tab is not looped.** Past the last control, focus can go to the browser's own UI. That is how native modals work, and it is fine. What matters is that the page behind can't be reached.
- **`ui-close` is cancelable.** Every *user* close (Escape, backdrop, `data-dialog-close`) asks first. `preventDefault()` keeps it open, for example with unsaved changes. Code setting `open = false` closes without asking.
- **`data-dialog-close`, not `<form method="dialog">`.** A slotted form's DOM parent is the host, not the `<dialog>` inside the shadow root, so `method="dialog"` cannot find it. A shadow-boundary trap.
- **`label` is required.** It becomes a visible heading and the dialog's accessible name through `aria-labelledby`. Both are in the same shadow root, so the ID reference works.
- **Backdrop clicks are off by default.** One stray click should not throw away what someone typed.

## Known limits

- **Chrome limits repeated Escape vetoes.** Without a user click or key press in between, a second Escape cannot be cancelled. This stops pages that trap users. It is by design.
- **Focus return needs a connected opener.** If the button that opened the dialog is removed (for example, the row it belonged to was erased), focus falls to `<body>`. The consumer must move focus somewhere sensible.

## Keyboard

| Key | Does |
|---|---|
| Tab / Shift+Tab | Moves between controls in the dialog. The page behind is unreachable. |
| Escape | Closes (asks through `ui-close` first). |

On open, focus moves to the first focusable element. On close, it returns to the opener.

## Screen-reader log

| Setup | Checked | Should hear | Result |
|---|---|---|---|
| VoiceOver + Safari | Open | "Erase “Buy oat milk”?, web dialog", then the first button | *to do* |
| VoiceOver + Safari | Try to read the page behind with VO keys | Nothing outside the dialog | *to do* |
| VoiceOver + Safari | Close | Back on the trigger button | *to do* |
| NVDA + Firefox | — | — | not tested |
| JAWS | — | — | not tested |
