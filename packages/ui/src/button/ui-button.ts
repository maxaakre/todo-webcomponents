import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { DEV } from '../internal/dev.js';
import { FormControl } from '../internal/form-control.js';
import { slotText } from '../internal/slot-text.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

/**
 * A button. Wraps a native `<button>` so keyboard, focus and screen-reader
 * behaviour come from the platform.
 *
 * Fires only the native `click`. No custom event: consumers already know
 * how to listen for a click, and every framework handles it.
 *
 * @slot - The label.
 * @slot prefix - Content before the label, usually an icon.
 * @slot suffix - Content after the label, usually an icon.
 *
 * @csspart button - The inner native `<button>`.
 *
 * @cssprop [--ui-button-radius=var(--ui-radius-md)] - Corner radius.
 * @cssprop [--ui-button-gap=var(--ui-space-1)] - Space between slots.
 */
@customElement('ui-button')
export class UiButton extends FormControl {
  static styles = css`
    :host { display: inline-block; }
    :host([hidden]) { display: none; }

    button {
      --_bg: transparent;
      --_fg: var(--ui-color-text, #16181d);
      --_border: var(--ui-color-border-strong, #7c8491);

      display: inline-flex; align-items: center; justify-content: center;
      gap: var(--ui-button-gap, var(--ui-space-1, 0.35rem));
      /* Fill the host, so a consumer can size ui-button like any box. */
      inline-size: 100%; block-size: 100%;
      font: inherit; line-height: 1; cursor: pointer;
      color: var(--_fg); background: var(--_bg);
      border: 1px solid var(--_border);
      border-radius: var(--ui-button-radius, var(--ui-radius-md, 10px));
      padding: 0.55rem 0.9rem;
      transition: filter var(--ui-duration, 150ms);
    }
    :host([size='sm']) button { padding: 0.25rem 0.5rem; font-size: 0.875em; }

    :host([variant='primary']) button {
      --_bg: var(--ui-color-accent, #2563eb);
      --_fg: var(--ui-color-on-accent, #fff);
      --_border: var(--_bg);
    }
    :host([variant='danger']) button {
      --_bg: var(--ui-color-danger, #b91c1c);
      --_fg: var(--ui-color-on-danger, #fff);
      --_border: var(--_bg);
    }
    :host([variant='ghost']) button { --_border: transparent; }
    :host([variant='ghost']) button:hover { --_bg: var(--ui-color-surface, #f8fafc); }

    button:hover { filter: brightness(1.08); }
    button:focus-visible {
      outline: 2px solid var(--ui-color-focus, #2563eb);
      outline-offset: 2px;
    }
    button:disabled { cursor: not-allowed; opacity: 0.55; filter: none; }

    /* Windows High Contrast: let system colours win, keep an edge on ghost. */
    @media (forced-colors: active) {
      button { border-color: ButtonText; }
      button:focus-visible { outline-color: Highlight; }
      button:disabled { color: GrayText; border-color: GrayText; opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      button { transition: none; }
    }
  `;

  /** Visual weight. Reflected, so `ui-button[variant="danger"]` works in CSS. */
  @property({ reflect: true }) variant: ButtonVariant = 'secondary';

  @property({ reflect: true }) size: ButtonSize = 'md';

  /**
   * `button` by default, not `submit` like the native element: an accidental
   * submit is worse than a button that needs one more attribute.
   */
  @property() type: 'button' | 'submit' = 'button';

  /**
   * Accessible name for icon-only buttons. Use this, not `aria-label` on the
   * host: the host has no role, so a label there names nothing.
   */
  @property() label?: string;

  @query('button') private button!: HTMLButtonElement;

  private onClick() {
    // The inner <button> lives in the shadow root, so it has no form.
    // The host does, through ElementInternals.
    if (this.type === 'submit') this.form?.requestSubmit();
  }

  private warned = false;

  private warnIfNameless() {
    if (!DEV || this.label || this.warned) return;
    if (!slotText(this.button.querySelector('slot:not([name])')!)) {
      this.warned = true;
      console.warn('<ui-button> has no accessible name. Add text or a `label`.', this);
    }
  }

  render() {
    return html`
      <button part="button" type="button"
              ?disabled=${this.isDisabled}
              aria-label=${ifDefined(this.label)}
              @click=${this.onClick}>
        <slot name="prefix"></slot>
        <slot @slotchange=${this.warnIfNameless}></slot>
        <slot name="suffix"></slot>
      </button>`;
  }

  protected firstUpdated() {
    // slotchange does not fire when the default slot starts empty.
    this.warnIfNameless();
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ui-button': UiButton }
}
