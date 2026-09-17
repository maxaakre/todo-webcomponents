import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Task } from './model.js';

/** One element, always interactive — no readonly mode. Used both inside
 *  <triage-view> and on its own once nothing is left to triage. */
@customElement('task-list')
export class TaskList extends LitElement {
  static styles = css`
    :host { display: block; }
    ul { list-style: none; margin: 0; padding: 0; }
    li {
      display: flex; align-items: center; gap: var(--gap-2);
      padding: 0.55rem 0; border-bottom: 1px solid var(--line);
    }
    li:last-child { border-bottom: 0; }
    li.done span { text-decoration: line-through; color: var(--dim); }
    input { width: 1rem; height: 1rem; accent-color: var(--accent); cursor: pointer; }
    p { color: var(--dim); margin: 0; padding: var(--gap-3) 0; }
  `;

  @property({ attribute: false }) tasks: Task[] = [];
  @property() empty = 'Nothing planned yet.';

  private toggle(id: string) {
    this.dispatchEvent(new CustomEvent('task-toggled', {
      detail: { id }, bubbles: true, composed: true,
    }));
  }

  render() {
    if (!this.tasks.length) return html`<p>${this.empty}</p>`;
    return html`<ul>${this.tasks.map((t) => html`
      <li class=${t.done ? 'done' : ''}>
        <input type="checkbox" .checked=${t.done}
               @change=${() => this.toggle(t.id)}
               aria-label=${t.title} />
        <span>${t.title}</span>
      </li>`)}</ul>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'task-list': TaskList } }
