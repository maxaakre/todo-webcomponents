import { LitElement, css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import '@maxaakre/ui/button';
import '@maxaakre/ui/text-field';
import type { UiTextField } from '@maxaakre/ui/text-field';

/** Owns the input: trimming, rejecting empties, clearing, keeping focus. */
@customElement('task-composer')
export class TaskComposer extends LitElement {
  static styles = css`
    :host { display: block; }
    form { display: flex; gap: var(--ui-space-1); }
    ui-text-field { flex: 1; }
  `;

  @query('ui-text-field') private field!: UiTextField;

  private submit(e: Event) {
    e.preventDefault();
    const title = this.field.value.trim();
    if (!title) return;
    this.dispatchEvent(new CustomEvent('task-added', {
      detail: { title }, bubbles: true, composed: true,
    }));
    this.field.value = '';
    this.field.focus();
  }

  render() {
    return html`
      <form @submit=${this.submit}>
        <ui-text-field label="New task" hide-label name="title"
                       placeholder="Add a task for today"></ui-text-field>
        <ui-button type="submit" variant="primary">Add</ui-button>
      </form>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'task-composer': TaskComposer } }
