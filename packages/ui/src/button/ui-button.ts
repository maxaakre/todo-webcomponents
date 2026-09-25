import { css, html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { customElement } from '../internal/define.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { base } from '../internal/styles.js';
import { FormControl } from '../internal/form-control.js';
import { warnIfSlotEmpty } from '../internal/warn.js';

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
  static styles = [base, css`
    :host { display: inline-block; }

    button {
      --_bg: transparent;
      --_fg: var(--_color-text);
      --_border: var(--_color-border-strong);

      display: inline-flex; align-items: center; justify-content: center;
      gap: var(--ui-button-gap, var(--_space-1));
      /* Fill the host, so a consumer can size ui-button like any box. */
      inline-size: 100%; block-size: 100%;
      font: inherit; line-height: 1; cursor: pointer;
      color: var(--_fg); background: var(--_bg);
      border: 1px solid var(--_border);
      border-radius: var(--ui-button-radius, var(--_radius-md));
      padding: 0.55rem 0.9rem;
      transition: background-color var(--_duration), border-color var(--_duration);
    }
    :host([size='sm']) button { padding: 0.25rem 0.5rem; font-size: 0.875em; }

    :host([variant='primary']) button {
      --_bg: var(--_color-accent);
      --_fg: var(--_color-on-accent);
      --_border: var(--_bg);
    }
    :host([variant='danger']) button {
      --_bg: var(--_color-danger);
      --_fg: var(--_color-on-danger);
      --_border: var(--_bg);
    }
    :host([variant='ghost']) button { --_border: transparent; }

    /* Hover changes what the eye can see: the fill, and for outlined
       buttons the border. Filled variants mix toward the text colour, which
       is darker in light mode and lighter in dark mode, so it reads in both
       themes and keeps the label's contrast. Only on devices that hover,
       so a tap on a phone does not leave it stuck. */
    @media (hover: hover) {
      /* Outlined and ghost: a tint of the text colour over the page. */
      button:hover:not(:disabled) {
        --_bg: color-mix(in srgb, var(--_color-text) 8%, var(--_color-bg));
      }
      :host([variant='secondary']) button:hover:not(:disabled) { --_border: var(--_color-text); }
      :host([variant='primary']) button:hover:not(:disabled) {
        --_bg: color-mix(in srgb, var(--_color-accent) 80%, var(--_color-text));
      }
      :host([variant='danger']) button:hover:not(:disabled) {
        --_bg: color-mix(in srgb, var(--_color-danger) 80%, var(--_color-text));
      }
    }
    button:focus-visible {
      outline: var(--_focus-ring);
      outline-offset: 2px;
    }
    button:disabled { cursor: not-allowed; opacity: 0.55; }

    /* Windows High Contrast: let system colours win, keep an edge on ghost. */
    @media (forced-colors: active) {
      button { border-color: ButtonText; }
      button:disabled { color: GrayText; border-color: GrayText; opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      button { transition: none; }
    }
  `];

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

  private warnIfNameless() {
    if (this.label) return;
    warnIfSlotEmpty(this, this.button.querySelector('slot:not([name])'),
      '<ui-button> has no accessible name. Add text or a `label`.');
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
