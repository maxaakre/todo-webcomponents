import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@maxaakre/ui/button';
import '@maxaakre/ui/disclosure';
import './task-list.js';
import type { Task, Verdict } from './model.js';

/** Two panes: unfinished work left, today's plan filling up right.
 *  Rendered only while something is older than today. Leftover rows are
 *  inline markup — they are a template fragment, not a module. */
@customElement('triage-view')
export class TriageView extends LitElement {
  static styles = css`
    :host { display: block; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ui-space-3); }
    @media (max-width: 40rem) { .cols { grid-template-columns: 1fr; } }
    .col {
      border: 1px solid var(--ui-color-border); border-radius: var(--ui-radius-md);
      padding: var(--ui-space-2); min-height: 12rem;
    }
    .col.plan { background: var(--ui-color-surface); }
    h2 {
      margin: 0 0 var(--ui-space-2); font-size: 0.78rem; font-weight: 620;
      text-transform: uppercase; letter-spacing: 0.08em; color: var(--ui-color-text-muted);
    }
    /* The Unfinished pane collapses (useful once the panes stack on a
       phone). Its summary gets the h2 look through ::part, so the chevron
       scales with the text. */
    ui-disclosure::part(summary) {
      font-size: 0.78rem; font-weight: 620;
      text-transform: uppercase; letter-spacing: 0.08em; color: var(--ui-color-text-muted);
    }
    .col:has(> ui-disclosure:not([open])) { min-height: 0; }
    ul { list-style: none; margin: 0; padding: 0; }
    li { padding: 0.55rem 0; border-bottom: 1px solid var(--ui-color-border); }
    li:last-child { border-bottom: 0; }
    .row { display: flex; justify-content: space-between; gap: var(--ui-space-2); align-items: baseline; }
    .stale { font-size: 0.78rem; color: var(--ui-color-text-muted); white-space: nowrap; }
    .acts { display: flex; gap: var(--ui-space-1); margin-top: var(--ui-space-1); }
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
          <ui-disclosure open>
            <span slot="summary">Unfinished (${this.leftovers.length})</span>
            <ul>
            ${this.leftovers.map((t) => html`
              <li>
                <div class="row">
                  <span>${t.title}</span>
                  <span class="stale">${this.staleness(t.day)}</span>
                </div>
                <div class="acts">
                  <ui-button size="sm" variant="primary" @click=${() => this.act(t.id, 'today')}>→ Today</ui-button>
                  <ui-button size="sm" @click=${() => this.act(t.id, 'tomorrow')}>Tomorrow</ui-button>
                  <ui-button size="sm" variant="ghost" @click=${() => this.act(t.id, 'drop')}>Drop</ui-button>
                </div>
              </li>`)}
            </ul>
          </ui-disclosure>
        </div>
        <div class="col plan">
          <h2>Today's plan (${this.todays.length})</h2>
          <task-list .tasks=${this.todays} empty="Empty. Pull something across, or add a task."></task-list>
        </div>
      </div>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'triage-view': TriageView } }
