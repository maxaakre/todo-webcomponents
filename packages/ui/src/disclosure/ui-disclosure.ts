import { LitElement, css, html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { customElement } from '../internal/define.js';
import { DEV } from '../internal/dev.js';
import { slotText } from '../internal/slot-text.js';

export type UiToggleEvent = CustomEvent<{ open: boolean }>;

/**
 * Show and hide a section. Built on native `<details>` and `<summary>`, so
 * the button role, expanded state, Enter/Space and find-in-page come from
 * the platform.
 *
 * @slot summary - The always-visible label. Keep it short, and text only:
 *   `<summary>` acts as a button, so headings or links inside it are lost.
 * @slot - The content that is shown and hidden.
 *
 * @fires {UiToggleEvent} ui-toggle - The user opened or closed it.
 *   `detail.open` is the new state. Not fired when `open` is set in code.
 *
 * @csspart summary - The native `<summary>`.
 * @csspart content - The wrapper around the default slot.
 *
 * @cssprop [--ui-disclosure-gap=var(--ui-space-2)] - Space between summary and content.
 */
@customElement('ui-disclosure')
export class UiDisclosure extends LitElement {
  static styles = css`
    :host { display: block; }
    :host([hidden]) { display: none; }

    summary {
      display: flex; align-items: center; gap: var(--ui-space-1, 0.35rem);
      cursor: pointer; border-radius: var(--ui-radius-sm, 6px);
      list-style: none; /* hide the native marker… */
    }
    summary::-webkit-details-marker { display: none; } /* …in Safari too */
    summary:focus-visible { outline: 2px solid var(--ui-color-focus, #2563eb); outline-offset: 2px; }

    .chevron {
      flex: none; inline-size: 0.5em; block-size: 0.5em;
      border-inline-end: 2px solid currentColor; border-block-end: 2px solid currentColor;
      transform: rotate(-45deg); transition: transform var(--ui-duration, 150ms);
    }
    details[open] .chevron { transform: rotate(45deg); }

    .content { padding-block-start: var(--ui-disclosure-gap, var(--ui-space-2, 0.75rem)); }

    @media (prefers-reduced-motion: reduce) {
      .chevron { transition: none; }
    }
    @media (forced-colors: active) {
      summary:focus-visible { outline-color: Highlight; }
    }
  `;

  /** Reflected, so `ui-disclosure[open]` works in CSS. Kept in sync with the native `<details>`. */
  @property({ type: Boolean, reflect: true }) open = false;

  @query('details') private details!: HTMLDetailsElement;

  private onToggle() {
    // Native `toggle` fires for every change, including ours: when we render
    // `open` into <details>, a toggle event follows a task later. If the
    // property already matches, this is that echo, not the user.
    if (this.details.open === this.open) return;

    this.open = this.details.open;
    // Bubbles for delegation, but not composed: a component that wraps this
    // one decides for itself what to expose outside its own shadow root.
    this.dispatchEvent(new CustomEvent('ui-toggle', { detail: { open: this.open }, bubbles: true }));
  }

  protected firstUpdated() {
    if (DEV && !slotText(this.shadowRoot!.querySelector('slot[name="summary"]')!)) {
      console.warn('<ui-disclosure> has an empty summary, so its button has no name.', this);
    }
  }

  render() {
    return html`
      <details .open=${this.open} @toggle=${this.onToggle}>
        <summary part="summary">
          <span class="chevron" aria-hidden="true"></span>
          <slot name="summary"></slot>
        </summary>
        <div part="content" class="content"><slot></slot></div>
      </details>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ui-disclosure': UiDisclosure }
  interface HTMLElementEventMap { 'ui-toggle': UiToggleEvent }
}
