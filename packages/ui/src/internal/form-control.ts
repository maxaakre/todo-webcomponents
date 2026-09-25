import { LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

/**
 * Shared plumbing for form-associated components.
 *
 * Form-associated means the browser treats the host as a real form control:
 * it has a form, takes part in FormData and validation, and is disabled by
 * a disabled <fieldset>. The native control inside the shadow root cannot
 * do any of that, because it cannot see the form outside.
 */
export abstract class FormControl extends LitElement {
  static formAssociated = true;

  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  /**
   * Reflected, and that matters beyond styling: a form-associated element
   * with a `disabled` attribute is a disabled form control to the browser.
   * It leaves the tab order and ignores clicks, including `el.click()`.
   */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Set by a disabled ancestor `<fieldset>`, through `formDisabledCallback`. */
  @state() protected formDisabled = false;

  protected readonly internals = this.attachInternals();

  /** The form this control belongs to, if any. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  protected get isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  /** Called by the browser when a `<fieldset>` around it is (un)disabled. */
  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
  }
}
