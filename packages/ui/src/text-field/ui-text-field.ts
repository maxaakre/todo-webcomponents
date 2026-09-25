import { css, html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { customElement } from '../internal/define.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { DEV } from '../internal/dev.js';
import { FormControl } from '../internal/form-control.js';

/**
 * A single-line text input with its label, hint and error.
 *
 * The label is rendered *inside* the shadow root, next to the input. An
 * outside `<label for>` cannot reach an input in a shadow root, and neither
 * can `aria-labelledby` or `aria-describedby`: ID references do not cross
 * the shadow boundary.
 *
 * Events: native `input` (it is composed, so it already reaches the host)
 * and `change` (re-dispatched, because native `change` is not composed).
 * Neither fires when `value` is set in code.
 *
 * @csspart label - The `<label>`.
 * @csspart input - The native `<input>`.
 * @csspart hint - The hint text.
 * @csspart error - The error text.
 *
 * @cssprop [--ui-text-field-radius=var(--ui-radius-md)] - Corner radius of the input.
 */
@customElement('ui-text-field')
export class UiTextField extends FormControl {
  static styles = css`
    :host { display: block; }
    :host([hidden]) { display: none; }

    .field { display: grid; gap: 0.3rem; }
    label { font-weight: 560; }
    .required { color: var(--ui-color-danger, #b91c1c); }

    /* Visually hidden, still in the accessibility tree. */
    :host([hide-label]) label {
      position: absolute; inline-size: 1px; block-size: 1px;
      overflow: hidden; clip-path: inset(50%); white-space: nowrap;
    }

    input {
      font: inherit; color: var(--ui-color-text, #16181d);
      background: var(--ui-color-bg, #fff);
      border: 1px solid var(--ui-color-border-strong, #7c8491);
      border-radius: var(--ui-text-field-radius, var(--ui-radius-md, 10px));
      padding: 0.55rem 0.7rem;
      inline-size: 100%; box-sizing: border-box;
    }
    input::placeholder { color: var(--ui-color-text-muted, #5b6270); }
    input:focus-visible { outline: 2px solid var(--ui-color-focus, #2563eb); outline-offset: 1px; }
    input[aria-invalid='true'] { border-color: var(--ui-color-danger, #b91c1c); }
    input:disabled { opacity: 0.55; cursor: not-allowed; }

    .hint { color: var(--ui-color-text-muted, #5b6270); font-size: 0.875em; }
    .error { color: var(--ui-color-danger, #b91c1c); font-size: 0.875em; }

    @media (forced-colors: active) {
      input { border-color: FieldText; }
      input:focus-visible { outline-color: Highlight; }
      input[aria-invalid='true'] { border-width: 2px; }
    }
  `;

  /** The visible label. Required: a field without one has no accessible name. */
  @property() label = '';

  /** Hide the label visually. It stays available to screen readers. */
  @property({ type: Boolean, reflect: true, attribute: 'hide-label' }) hideLabel = false;

  /** Current value. The `value` attribute is the initial value, restored on form reset. */
  @property() value = '';

  /** Form field name. Read by the browser from the host's `name` attribute. */
  @property({ reflect: true }) name?: string;

  @property() placeholder?: string;

  @property({ type: Boolean, reflect: true }) required = false;

  /** Help text under the input. */
  @property() hint = '';

  /** Error text. Non-empty makes the field invalid, with this as its message. */
  @property() error = '';

  @query('input') private input!: HTMLInputElement;

  private defaultValue = '';

  connectedCallback() {
    super.connectedCallback();
    this.defaultValue = this.getAttribute('value') ?? '';
  }

  // ── Validation API, mirroring native inputs ────────────────────────────
  get validity(): ValidityState { return this.internals.validity; }
  get validationMessage(): string { return this.internals.validationMessage; }
  checkValidity(): boolean { return this.internals.checkValidity(); }
  reportValidity(): boolean { return this.internals.reportValidity(); }

  /** Called by the browser on `form.reset()`. */
  formResetCallback() {
    this.value = this.defaultValue;
  }

  private onInput() {
    this.value = this.input.value;
    // Sync now, not after the next render: a listener on this same event
    // may read FormData or call checkValidity().
    this.syncForm();
  }

  private onChange() {
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private onKeydown(e: KeyboardEvent) {
    // Implicit submission: a native input submits its form on Enter. The
    // inner input has no form, so do it for it.
    if (e.key === 'Enter' && !e.isComposing) this.form?.requestSubmit();
  }

  private syncForm() {
    this.internals.setFormValue(this.value);
    if (this.error) {
      this.internals.setValidity({ customError: true }, this.error, this.input);
    } else {
      // ValidityState has the same flags as ValidityStateFlags.
      this.internals.setValidity(this.input.validity, this.input.validationMessage, this.input);
    }
  }

  protected firstUpdated() {
    if (DEV && !this.label) {
      console.warn('<ui-text-field> has no label, so it has no accessible name.', this);
    }
  }

  protected updated() {
    this.syncForm();
  }

  render() {
    const described = [this.hint && 'hint', this.error && 'error'].filter(Boolean).join(' ');
    return html`
      <div class="field">
        <label part="label" for="input">
          ${this.label}${this.required ? html`<span class="required" aria-hidden="true"> *</span>` : nothing}
        </label>
        <input part="input" id="input" type="text"
               .value=${live(this.value)}
               placeholder=${ifDefined(this.placeholder)}
               ?required=${this.required}
               ?disabled=${this.isDisabled}
               aria-describedby=${ifDefined(described || undefined)}
               aria-invalid=${ifDefined(this.error ? 'true' : undefined)}
               @input=${this.onInput}
               @change=${this.onChange}
               @keydown=${this.onKeydown} />
        ${this.hint ? html`<div part="hint" id="hint" class="hint">${this.hint}</div>` : nothing}
        ${this.error ? html`<div part="error" id="error" class="error">${this.error}</div>` : nothing}
      </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ui-text-field': UiTextField }
}
