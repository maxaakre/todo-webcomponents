import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { DEV } from '../internal/dev.js';

export type UiCloseEvent = CustomEvent<{ returnValue: string }>;

/**
 * A modal dialog. Built on native `<dialog>` and `showModal()`, so the focus
 * trap, the inert background, the top layer and Escape come from the
 * platform.
 *
 * Buttons with `data-dialog-close="<value>"` close it with that value.
 * `<form method="dialog">` does not work here: a slotted form's parent is
 * this host, not the `<dialog>` inside the shadow root.
 *
 * @slot - The dialog body.
 * @slot footer - Actions, usually buttons with `data-dialog-close`.
 *
 * @fires {UiCloseEvent} ui-close - The user is closing it: Escape, the
 *   backdrop (with `close-on-backdrop`), or a `data-dialog-close` button.
 *   `detail.returnValue` is the button's value, or `''`. Cancelable:
 *   `preventDefault()` keeps it open. Not fired when `open` is set in code.
 *
 * @csspart dialog - The native `<dialog>`.
 * @csspart title - The heading made from `label`.
 * @csspart footer - The footer row.
 *
 * @cssprop [--ui-dialog-width=28rem] - Maximum width.
 */
@customElement('ui-dialog')
export class UiDialog extends LitElement {
  static styles = css`
    dialog {
      box-sizing: border-box;
      inline-size: min(var(--ui-dialog-width, 28rem), calc(100vw - 2rem));
      padding: 0; border: 1px solid var(--ui-color-border, #e5e7eb);
      border-radius: var(--ui-radius-md, 10px);
      color: var(--ui-color-text, #16181d); background: var(--ui-color-bg, #fff);
      box-shadow: 0 10px 40px rgb(0 0 0 / 0.25);
    }
    dialog::backdrop { background: rgb(0 0 0 / 0.45); }

    /* Padding lives on the inner wrapper, so every click on the <dialog>
       element itself is a click on the backdrop. */
    .panel { padding: var(--ui-space-3, 1.25rem); display: grid; gap: var(--ui-space-2, 0.75rem); }
    h2 { margin: 0; font-size: 1.1rem; font-weight: 620; }
    footer { display: flex; justify-content: flex-end; gap: var(--ui-space-1, 0.35rem); }
    footer:not(:has(slot[name='footer'])) { display: none; }

    dialog[open] { opacity: 1; transform: none; }
    dialog { transition: opacity var(--ui-duration, 150ms), transform var(--ui-duration, 150ms); }
    @starting-style {
      dialog[open] { opacity: 0; transform: translateY(8px); }
    }

    @media (prefers-reduced-motion: reduce) {
      dialog { transition: none; }
    }
    @media (forced-colors: active) {
      dialog { border: 2px solid CanvasText; }
    }
  `;

  /** Reflected. `true` opens it as a modal; `false` closes it without an event. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** The title. Shown as a heading and used as the dialog's accessible name. */
  @property() label = '';

  /** Close when the user clicks the backdrop. Off by default: an easy mis-click to lose work on. */
  @property({ type: Boolean, attribute: 'close-on-backdrop' }) closeOnBackdrop = false;

  /** The value of the last user close, like `HTMLDialogElement.returnValue`. */
  returnValue = '';

  @query('dialog') private dialog!: HTMLDialogElement;

  /** A user-initiated close. Asks first, through a cancelable ui-close. */
  private requestClose(returnValue: string) {
    const event: UiCloseEvent = new CustomEvent('ui-close', {
      detail: { returnValue }, bubbles: true, cancelable: true,
    });
    if (!this.dispatchEvent(event)) return;
    this.returnValue = returnValue;
    this.open = false;
  }

  private onCancel(e: Event) {
    // Escape. Take over from the browser, so ui-close can veto it.
    e.preventDefault();
    this.requestClose('');
  }

  private onClick(e: MouseEvent) {
    if (e.target === this.dialog) {
      if (this.closeOnBackdrop) this.requestClose('');
      return;
    }
    // Clicks from slotted content are retargeted; composedPath sees the real target.
    const closer = e.composedPath().find(
      (n): n is Element => n instanceof Element && n.hasAttribute('data-dialog-close'),
    );
    if (closer) this.requestClose(closer.getAttribute('data-dialog-close') ?? '');
  }

  private onClose() {
    // Keep open truthful whatever closed the <dialog>. Focus needs no help:
    // the browser returns it to the element that opened the modal, even
    // inside another shadow root (tested).
    this.open = false;
  }

  protected updated(changed: Map<string, unknown>) {
    if (!changed.has('open')) return;
    if (this.open && !this.dialog.open) {
      // Checked on open, not on first render: a reused dialog often gets
      // its label only when it is about to be shown.
      if (DEV && !this.label) {
        console.warn('<ui-dialog> opened with no label, so it has no accessible name.', this);
      }
      this.dialog.showModal();
    } else if (!this.open && this.dialog.open) {
      this.dialog.close();
    }
  }

  render() {
    return html`
      <dialog part="dialog" aria-labelledby="title"
              @cancel=${this.onCancel} @close=${this.onClose} @click=${this.onClick}>
        <div class="panel">
          <h2 part="title" id="title">${this.label}</h2>
          <slot></slot>
          <footer part="footer"><slot name="footer"></slot></footer>
        </div>
      </dialog>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ui-dialog': UiDialog }
  interface HTMLElementEventMap { 'ui-close': UiCloseEvent }
}
