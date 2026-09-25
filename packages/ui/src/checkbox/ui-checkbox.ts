import { css, html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { customElement } from '../internal/define.js';
import { live } from 'lit/directives/live.js';
import { DEV } from '../internal/dev.js';
import { FormControl } from '../internal/form-control.js';
import { slotText } from '../internal/slot-text.js';

/**
 * A checkbox with its label. Wraps a native `<input type="checkbox">`, so
 * Space, focus and the checked/mixed announcement come from the platform.
 *
 * The slotted text is the label: the `<label>` in the shadow root wraps the
 * slot, so clicking the text toggles the box.
 *
 * Events: native `input` and a re-dispatched `change` (native `change` is not
 * composed). Neither fires when `checked` is set in code.
 *
 * @slot - The label.
 *
 * @csspart control - The native `<input type="checkbox">`.
 * @csspart label - The `<label>` around the box and the slot.
 *
 * @cssprop [--ui-checkbox-size=1rem] - Width and height of the box.
 */
@customElement('ui-checkbox')
export class UiCheckbox extends FormControl {
  static styles = css`
    :host { display: inline-block; }
    :host([hidden]) { display: none; }

    /* flex, not inline-flex: the label fills the host, so the click
       target grows when a consumer stretches the checkbox. */
    label {
      display: flex; align-items: center;
      gap: var(--ui-space-2, 0.75rem);
      cursor: pointer;
    }
    input {
      inline-size: var(--ui-checkbox-size, 1rem);
      block-size: var(--ui-checkbox-size, 1rem);
      margin: 0; flex: none; cursor: inherit;
      accent-color: var(--ui-color-accent, #2563eb);
    }
    input:focus-visible { outline: 2px solid var(--ui-color-focus, #2563eb); outline-offset: 2px; }
    :host([disabled]) label, label:has(input:disabled) { cursor: not-allowed; opacity: 0.55; }

    @media (forced-colors: active) {
      input:focus-visible { outline-color: Highlight; }
    }
  `;

  /** Reflected, so `ui-checkbox[checked]` works in CSS. The initial attribute is restored on form reset. */
  @property({ type: Boolean, reflect: true }) checked = false;

  /** Neither checked nor unchecked. Announced as "mixed". Cleared when the user toggles. */
  @property({ type: Boolean }) indeterminate = false;

  /** Form field name. Read by the browser from the host's `name` attribute. */
  @property({ reflect: true }) name?: string;

  /** Submitted when checked. Same default as a native checkbox. */
  @property() value = 'on';

  @query('input') private input!: HTMLInputElement;

  /** Captured once: `checked` reflects, so the attribute changes later. */
  private defaultChecked?: boolean;

  connectedCallback() {
    super.connectedCallback();
    this.defaultChecked ??= this.hasAttribute('checked');
  }

  /** Called by the browser on `form.reset()`. */
  formResetCallback() {
    this.checked = this.defaultChecked ?? false;
    this.indeterminate = false;
  }

  private onChange() {
    // The native input already toggled and cleared its indeterminate state.
    this.checked = this.input.checked;
    this.indeterminate = this.input.indeterminate;
    this.syncForm();
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private syncForm() {
    this.internals.setFormValue(this.checked ? this.value : null);
  }

  private warnIfNameless() {
    if (DEV && !slotText(this.shadowRoot!.querySelector('slot')!)) {
      console.warn('<ui-checkbox> has no label text, so it has no accessible name.', this);
    }
  }

  protected firstUpdated() {
    this.warnIfNameless();
  }

  protected updated() {
    this.syncForm();
  }

  render() {
    return html`
      <label part="label">
        <input part="control" type="checkbox"
               .checked=${live(this.checked)}
               .indeterminate=${this.indeterminate}
               ?disabled=${this.isDisabled}
               @change=${this.onChange} />
        <slot></slot>
      </label>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ui-checkbox': UiCheckbox }
}
