import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@maxaakre/ui/button';
import '@maxaakre/ui/disclosure';
import type { Task } from './model.js';

/**
 * Tasks rescheduled to tomorrow. Without it they would be visible nowhere
 * until tomorrow comes: Today shows only today, Triage only earlier Days.
 * Collapsed by default, so it does not compete with the plan for today.
 */
@customElement('tomorrow-list')
export class TomorrowList extends LitElement {
  static styles = css`
    :host { display: block; margin-top: var(--ui-space-3); }
    ui-disclosure::part(summary) {
      font-size: 0.78rem; font-weight: 620;
      text-transform: uppercase; letter-spacing: 0.08em; color: var(--ui-color-text-muted);
    }
    ul { list-style: none; margin: 0; padding: 0; }
    li {
      display: flex; align-items: center; gap: var(--ui-space-2);
      padding: 0.4rem 0; border-bottom: 1px solid var(--ui-color-border);
    }
    li:last-child { border-bottom: 0; }
    span { flex: 1; color: var(--ui-color-text-muted); }
    p { color: var(--ui-color-text-muted); margin: 0; }
    p:focus { outline: none; } /* focused from code, as a landing spot only */
  `;

  @property({ attribute: false }) tasks: Task[] = [];

  /** Row to focus once a Task has moved back to today. */
  private focusIndexAfterMove: number | null = null;

  private moveToToday(id: string) {
    this.focusIndexAfterMove = this.tasks.findIndex((t) => t.id === id);
    this.dispatchEvent(new CustomEvent('task-moved', {
      detail: { id, to: 'today' }, bubbles: true, composed: true,
    }));
  }

  protected updated(changed: Map<string, unknown>) {
    if (!changed.has('tasks') || this.focusIndexAfterMove === null) return;
    const buttons = this.renderRoot.querySelectorAll('ui-button');
    const target = buttons.length
      ? buttons[Math.min(Math.max(this.focusIndexAfterMove, 0), buttons.length - 1)]
      : this.renderRoot.querySelector<HTMLElement>('p');
    target?.focus();
    this.focusIndexAfterMove = null;
  }

  render() {
    return html`
      <ui-disclosure>
        <span slot="summary">Tomorrow (${this.tasks.length})</span>
        ${this.tasks.length
          ? html`<ul>${this.tasks.map((t) => html`
              <li>
                <span>${t.title}</span>
                <ui-button variant="ghost" size="sm" label=${`Move "${t.title}" to today`}
                           @click=${() => this.moveToToday(t.id)}>← Today</ui-button>
              </li>`)}</ul>`
          : html`<p tabindex="-1">Nothing rescheduled.</p>`}
      </ui-disclosure>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'tomorrow-list': TomorrowList } }
