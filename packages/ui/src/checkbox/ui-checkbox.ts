import { css, html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { customElement } from '../internal/define.js';
import { live } from 'lit/directives/live.js';
import { base } from '../internal/styles.js';
import { FormControl } from '../internal/form-control.js';
import { warnIfSlotEmpty } from '../internal/warn.js';

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
  static styles = [base, css`
    :host { display: inline-block; }

    /* flex, not inline-flex: the label fills the host, so the click
       target grows when a consumer stretches the checkbox. */
    label {
      display: flex; align-items: center;
      gap: var(--_space-2);
      cursor: pointer;
    }
    input {
      inline-size: var(--ui-checkbox-size, 1rem);
      block-size: var(--ui-checkbox-size, 1rem);
      margin: 0; flex: none; cursor: inherit;
      accent-color: var(--_color-accent);
    }
    input:focus-visible { outline: var(--_focus-ring); outline-offset: 2px; }
    :host([disabled]) label, label:has(input:disabled) { cursor: not-allowed; opacity: 0.55; }
  `];

  /** Reflected, so `ui-checkbox[checked]` works in CSS. The initial attribute is restored on form reset. */
  @property({ type: Boolean, reflect: true }) checked = false;

  /** Neither checked nor unchecked. Announced as "mixed". Cleared when the user toggles. */
  @property({ type: Boolean }) indeterminate = false;

  /** Form field name. Read by the browser from the host's `name` attribute. */
  @property({ reflect: true }) name?: string;

  /** Submitted when checked. Same default as a native checkbox. */
  @property() value = 'on';

  @query('input') private input!: HTMLInputElement;

  /**
   * Captured once, from the property: `checked` reflects, so the attribute
   * changes later, and React sets the property before the element connects,
   * when there is no attribute yet.
   */
  private defaultChecked?: boolean;

  connectedCallback() {
    super.connectedCallback();
    this.defaultChecked ??= this.checked;
  }

  /** Called by the browser on `form.reset()`. */
  formResetCallback() {
    this.checked = this.defaultChecked ?? false;
    this.indeterminate = false;
  }

  /** Called by the browser when it restores the form: back/forward navigation, autofill. */
  formStateRestoreCallback(state: string | File | FormData | null, _mode: 'restore' | 'autocomplete') {
    this.checked = state === 'checked';
  }

  private onChange() {
    // The native input already toggled and cleared its indeterminate state.
    this.checked = this.input.checked;
    this.indeterminate = this.input.indeterminate;
    this.syncForm();
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private syncForm() {
    // The second argument is the state the browser hands back to
    // formStateRestoreCallback; the value alone cannot tell unchecked apart.
    this.internals.setFormValue(this.checked ? this.value : null, this.checked ? 'checked' : 'unchecked');
  }

  private warnIfNameless() {
    warnIfSlotEmpty(this, this.shadowRoot!.querySelector('slot'),
      '<ui-checkbox> has no label text, so it has no accessible name.');
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
        <slot @slotchange=${this.warnIfNameless}></slot>
      </label>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ui-checkbox': UiCheckbox }
}
