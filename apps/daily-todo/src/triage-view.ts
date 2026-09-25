import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './task-list.js';
import type { Task, Verdict } from './model.js';

/** Two panes: unfinished work left, today's plan filling up right.
 *  Rendered only while something is older than today. Leftover rows are
 *  inline markup — they are a template fragment, not a module. */
@customElement('triage-view')
export class TriageView extends LitElement {
  static styles = css`
    :host { display: block; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap-3); }
    @media (max-width: 40rem) { .cols { grid-template-columns: 1fr; } }
    .col {
      border: 1px solid var(--line); border-radius: var(--radius);
      padding: var(--gap-2); min-height: 12rem;
    }
    .col.plan { background: var(--panel); }
    h2 {
      margin: 0 0 var(--gap-2); font-size: 0.78rem; font-weight: 620;
      text-transform: uppercase; letter-spacing: 0.08em; color: var(--dim);
    }
    ul { list-style: none; margin: 0; padding: 0; }
    li { padding: 0.55rem 0; border-bottom: 1px solid var(--line); }
    li:last-child { border-bottom: 0; }
    .row { display: flex; justify-content: space-between; gap: var(--gap-2); align-items: baseline; }
    .stale { font-size: 0.78rem; color: var(--dim); white-space: nowrap; }
    .acts { display: flex; gap: var(--gap-1); margin-top: var(--gap-1); }
    button {
      font: inherit; font-size: 0.82rem; cursor: pointer;
      border: 1px solid var(--line); background: var(--page); color: var(--ink);
      border-radius: 7px; padding: 0.15rem 0.5rem;
    }
    button:hover { border-color: var(--dim); }
    button.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
    button.danger { color: var(--danger); }
  `;

  @property({ attribute: false }) leftovers: Task[] = [];
  @property({ attribute: false }) todays: Task[] = [];
  @property() today = '';

  private act(id: string, verdict: Verdict) {
    this.dispatchEvent(new CustomEvent('task-triaged', {
      detail: { id, verdict }, bubbles: true, composed: true,
    }));
  }

  private staleness(day: string) {
    const ms = new Date(this.today).getTime() - new Date(day).getTime();
    const d = Math.round(ms / 86_400_000);
    return d === 1 ? 'yesterday' : `${d} days ago`;
  }

  render() {
    return html`
      <div class="cols">
        <div class="col">
          <h2>Unfinished (${this.leftovers.length})</h2>
          <ul>
            ${this.leftovers.map((t) => html`
              <li>
                <div class="row">
                  <span>${t.title}</span>
                  <span class="stale">${this.staleness(t.day)}</span>
                </div>
                <div class="acts">
                  <button class="primary" @click=${() => this.act(t.id, 'today')}>→ Today</button>
                  <button @click=${() => this.act(t.id, 'tomorrow')}>Tomorrow</button>
                  <button class="danger" @click=${() => this.act(t.id, 'drop')}>Drop</button>
                </div>
              </li>`)}
          </ul>
        </div>
        <div class="col plan">
          <h2>Today's plan (${this.todays.length})</h2>
          <task-list .tasks=${this.todays} empty="Empty. Pull something across, or add a task."></task-list>
        </div>
      </div>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'triage-view': TriageView } }
