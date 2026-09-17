// PROTOTYPE — throwaway. Ticket 05.
// VARIANT C — "Two-pane sorter": leftovers on the left, today's plan being
// built on the right. Frames the act as COMMITTING to a plan, not clearing a list.
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { base } from './shared.js';
import { daysAgo } from './model.js';
import type { Task, Verdict } from './model.js';

export const VARIANT_C_NAME = 'Two-pane sorter';

@customElement('variant-c')
export class VariantC extends LitElement {
  static styles = [base, css`
    .wrap { max-width: 52rem; margin: 0 auto; padding: 2.5rem 1.25rem; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.25rem; }
    @media (max-width: 40rem) { .cols { grid-template-columns: 1fr; } }
    .col { border: 1px solid var(--line); border-radius: 12px; padding: 1rem; min-height: 15rem; }
    .col.plan { background: #f8fafc; border-style: solid; }
    .col h2 { font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; color: var(--dim); margin-bottom: .75rem; }
    li.pile { padding: .55rem 0; border-bottom: 1px solid var(--line); }
    li.pile:last-child { border-bottom: 0; }
    .row { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem; }
    .mini { display: flex; gap: .3rem; margin-top: .35rem; }
    .mini button { font-size: .78rem; padding: .15rem .5rem; }
    .count { font-variant-numeric: tabular-nums; }
    .cleared { padding: 2rem 0; text-align: center; }
  `];

  @property({ attribute: false }) leftovers: Task[] = [];
  @property({ attribute: false }) todays: Task[] = [];

  private act(id: string, verdict: Verdict) {
    this.dispatchEvent(new CustomEvent('triage-action', {
      detail: { id, verdict }, bubbles: true, composed: true,
    }));
  }

  render() {
    return html`
      <div class="wrap">
        <h1>Plan today</h1>
        <p class="dim">Decide what earlier work is worth your day.</p>
        <div class="cols">
          <div class="col">
            <h2>Unfinished <span class="count">(${this.leftovers.length})</span></h2>
            ${this.leftovers.length ? html`
              <ul>
                ${this.leftovers.map(t => html`
                  <li class="pile">
                    <div class="row"><span>${t.title}</span><span class="stale">${daysAgo(t.day)}</span></div>
                    <div class="mini">
                      <button class="primary" @click=${() => this.act(t.id, 'today')}>→ Today</button>
                      <button @click=${() => this.act(t.id, 'tomorrow')}>Tomorrow</button>
                      <button class="danger" @click=${() => this.act(t.id, 'drop')}>Drop</button>
                    </div>
                  </li>`)}
              </ul>` : html`<p class="cleared dim">All cleared.</p>`}
          </div>
          <div class="col plan">
            <h2>Today's plan <span class="count">(${this.todays.length})</span></h2>
            ${this.todays.length ? html`
              <ul>${this.todays.map(t => html`<li class="pile"><div class="row"><span>${t.title}</span></div></li>`)}</ul>
            ` : html`<p class="cleared dim">Empty. Pull something across, or start fresh.</p>`}
          </div>
        </div>
      </div>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'variant-c': VariantC } }
