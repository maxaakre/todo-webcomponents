import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@maxaakre/ui/button';
import '@maxaakre/ui/checkbox';
import type { Task } from './model.js';

/** One element, always interactive — no readonly mode. Used both inside
 *  <triage-view> and on its own once nothing is left to triage. */
@customElement('task-list')
export class TaskList extends LitElement {
  static styles = css`
    :host { display: block; }
    ul { list-style: none; margin: 0; padding: 0; }
    li {
      display: flex; align-items: center; gap: var(--ui-space-2);
      padding: 0.55rem 0; border-bottom: 1px solid var(--ui-color-border);
    }
    li:last-child { border-bottom: 0; }
    ui-checkbox { flex: 1; }
    /* checked reflects, so the slotted title can be styled from here. */
    ui-checkbox[checked] { text-decoration: line-through; color: var(--ui-color-text-muted); }
    p { color: var(--ui-color-text-muted); margin: 0; padding: var(--ui-space-3) 0; }
  `;

  @property({ attribute: false }) tasks: Task[] = [];
  @property() empty = 'Nothing planned yet.';

  private toggle(id: string) {
    this.dispatchEvent(new CustomEvent('task-toggled', {
      detail: { id }, bubbles: true, composed: true,
    }));
  }

  private requestErase(id: string) {
    this.dispatchEvent(new CustomEvent('task-erased', {
      detail: { id }, bubbles: true, composed: true,
    }));
  }

  render() {
    if (!this.tasks.length) return html`<p>${this.empty}</p>`;
    return html`<ul>${this.tasks.map((t) => html`
      <li>
        <ui-checkbox .checked=${t.status === 'done'}
                     @change=${() => this.toggle(t.id)}>${t.title}</ui-checkbox>
        <ui-button variant="ghost" size="sm" label=${`Erase "${t.title}"`}
                   @click=${() => this.requestErase(t.id)}>&#10005;</ui-button>
      </li>`)}</ul>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'task-list': TaskList } }
