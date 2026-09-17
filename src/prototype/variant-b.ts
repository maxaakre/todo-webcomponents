// PROTOTYPE — throwaway. Ticket 05.
// VARIANT B — "Inline banner": Today is always visible; leftovers sit in a
// dismissible block above it. Non-blocking. Bulk actions available.
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { base } from './shared.js';
import { daysAgo } from './model.js';
import type { Task, Verdict } from './model.js';

export const VARIANT_B_NAME = 'Inline banner';

@customElement('variant-b')
export class VariantB extends LitElement {
  static styles = [base, css`
    .wrap { max-width: 40rem; margin: 0 auto; padding: 2.5rem 1.25rem; }
    .panel {
      border: 1px solid #fcd34d;
      background: #fffbeb;
      border-radius: 12px;
      padding: 0.9rem 1rem;
      margin-bottom: 2rem;
    }
    .panel header { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; margin-bottom: .6rem; }
    .panel h2 { font-size: 0.95rem; }
    .bulk { display: flex; gap: .4rem; }
    .bulk button { font-size: .8rem; padding: .2rem .5rem; }
    li.left { display: flex; align-items: center; gap: .75rem; padding: .45rem 0; border-top: 1px solid #fde68a; }
    li.left .t { flex: 1; }
    li.left .acts { display: flex; gap: .3rem; }
    li.left .acts button { font-size: .8rem; padding: .2rem .5rem; }
    li.today { display: flex; align-items: center; gap: .7rem; padding: .55rem 0; border-bottom: 1px solid var(--line); }
    li.today.is-done .t { text-decoration: line-through; color: var(--dim); }
    .empty { padding: 2rem 0; text-align: center; }
  `];

  @property({ attribute: false }) leftovers: Task[] = [];
  @property({ attribute: false }) todays: Task[] = [];

  private act(id: string, verdict: Verdict) {
    this.dispatchEvent(new CustomEvent('triage-action', {
      detail: { id, verdict }, bubbles: true, composed: true,
    }));
  }

  private all(verdict: Verdict) {
    for (const t of [...this.leftovers]) this.act(t.id, verdict);
  }

  render() {
    return html`
      <div class="wrap">
        ${this.leftovers.length ? html`
          <div class="panel">
            <header>
              <h2>${this.leftovers.length} unfinished from earlier</h2>
              <div class="bulk">
                <button @click=${() => this.all('today')}>Move all to today</button>
                <button class="danger" @click=${() => this.all('drop')}>Drop all</button>
              </div>
            </header>
            <ul>
              ${this.leftovers.map(t => html`
                <li class="left">
                  <span class="t">${t.title} <span class="stale">· ${daysAgo(t.day)}</span></span>
                  <span class="acts">
                    <button @click=${() => this.act(t.id, 'today')}>Today</button>
                    <button @click=${() => this.act(t.id, 'tomorrow')}>Tomorrow</button>
                    <button class="danger" @click=${() => this.act(t.id, 'drop')}>Drop</button>
                  </span>
                </li>`)}
            </ul>
          </div>` : ''}

        <h1>Today</h1>
        ${this.todays.length ? html`
          <ul>
            ${this.todays.map(t => html`
              <li class="today ${t.done ? 'is-done' : ''}">
                <input type="checkbox" .checked=${t.done} />
                <span class="t">${t.title}</span>
              </li>`)}
          </ul>` : html`<p class="empty dim">Nothing planned yet.</p>`}
      </div>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'variant-b': VariantB } }
