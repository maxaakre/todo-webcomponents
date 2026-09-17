// PROTOTYPE — throwaway. Ticket 05.
// VARIANT A — "Blocking queue": full-screen, one Task at a time, cannot be skipped.
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { base, } from './shared.js';
import { daysAgo } from './model.js';
import type { Task, Verdict } from './model.js';

export const VARIANT_A_NAME = 'Blocking queue';

@customElement('variant-a')
export class VariantA extends LitElement {
  static styles = [base, css`
    .wrap { max-width: 34rem; margin: 0 auto; padding: 3.5rem 1.25rem; }
    .progress { font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dim); }
    .card {
      margin: 1.25rem 0 2rem;
      padding: 2rem 1.5rem;
      border: 1px solid var(--line);
      border-radius: 14px;
      box-shadow: 0 1px 2px rgba(0,0,0,.04);
    }
    .title { font-size: 1.5rem; font-weight: 620; letter-spacing: -0.02em; }
    .actions { display: grid; gap: 0.5rem; }
    .actions button { padding: 0.8rem; text-align: left; display: flex; justify-content: space-between; }
    kbd { font: 0.75rem ui-monospace, monospace; color: var(--dim); }
    .bar { height: 3px; background: var(--line); border-radius: 2px; overflow: hidden; }
    .bar i { display: block; height: 100%; background: var(--accent); }
    .done { text-align: center; padding: 3rem 0; }
  `];

  @property({ attribute: false }) leftovers: Task[] = [];
  @property({ attribute: false }) todays: Task[] = [];

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this.onKey);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.onKey);
  }

  // The 1/2/3 hints in the UI have to actually work, or the prototype is lying
  // about how fast the flow feels.
  private onKey = (e: KeyboardEvent) => {
    const [current] = this.leftovers;
    if (!current) return;
    const map: Record<string, Verdict> = { '1': 'today', '2': 'tomorrow', '3': 'drop' };
    const verdict = map[e.key];
    if (verdict) { e.preventDefault(); this.act(current.id, verdict); }
  };

  private act(id: string, verdict: Verdict) {
    this.dispatchEvent(new CustomEvent('triage-action', {
      detail: { id, verdict }, bubbles: true, composed: true,
    }));
  }

  render() {
    const [current] = this.leftovers;
    if (!current) {
      return html`<div class="wrap done">
        <h1>Today</h1>
        <p class="dim">Nothing left to triage. ${this.todays.length} ${this.todays.length === 1 ? 'task' : 'tasks'} planned.</p>
        <ul>${this.todays.map(t => html`<li style="padding:.4rem 0;border-bottom:1px solid var(--line)">${t.title}</li>`)}</ul>
      </div>`;
    }
    const total = this.leftovers.length;
    return html`
      <div class="wrap">
        <div class="progress">${total} left to decide</div>
        <div class="bar" style="margin-top:.5rem"><i style="width:${100 / Math.max(total, 1)}%"></i></div>
        <div class="card">
          <div class="stale">${daysAgo(current.day)}</div>
          <div class="title">${current.title}</div>
        </div>
        <div class="actions">
          <button class="primary" @click=${() => this.act(current.id, 'today')}>Do it today <kbd>1</kbd></button>
          <button @click=${() => this.act(current.id, 'tomorrow')}>Tomorrow <kbd>2</kbd></button>
          <button class="danger" @click=${() => this.act(current.id, 'drop')}>Drop it <kbd>3</kbd></button>
        </div>
      </div>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'variant-a': VariantA } }
