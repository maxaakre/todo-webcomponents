// PROTOTYPE — throwaway. Ticket 05: "What should Triage look and feel like?"
// Three variants of the Triage flow, switchable via ?variant=A|B|C.
// Scenarios via ?scenario=normal|nothing-to-triage|empty-day.
// In-memory only. No persistence — that is deliberate.
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './variant-a.js';
import './variant-b.js';
import './variant-c.js';
import { VARIANT_A_NAME } from './variant-a.js';
import { VARIANT_B_NAME } from './variant-b.js';
import { VARIANT_C_NAME } from './variant-c.js';
import { scenarioTasks, today } from './model.js';
import type { Scenario, Task, Verdict } from './model.js';

const KEYS = ['A', 'B', 'C'] as const;
type Key = (typeof KEYS)[number];
const NAMES: Record<Key, string> = { A: VARIANT_A_NAME, B: VARIANT_B_NAME, C: VARIANT_C_NAME };
const SCENARIOS: Scenario[] = ['normal', 'nothing-to-triage', 'empty-day'];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

@customElement('triage-prototype')
export class TriagePrototype extends LitElement {
  static styles = css`
    :host { display: block; min-height: 100vh; background: #fff; padding-bottom: 8rem; }
    .bar {
      position: fixed; bottom: 1rem; left: 50%; transform: translateX(-50%);
      display: flex; align-items: center; gap: .5rem;
      background: #111827; color: #fff; border-radius: 999px;
      padding: .4rem .5rem; box-shadow: 0 8px 24px rgba(0,0,0,.28);
      font: 13px/1 -apple-system, system-ui, sans-serif; z-index: 99;
    }
    .bar button {
      font: inherit; cursor: pointer; color: #fff; background: #374151;
      border: 0; border-radius: 999px; width: 1.9rem; height: 1.9rem;
    }
    .bar button:hover { background: #4b5563; }
    .label { padding: 0 .6rem; white-space: nowrap; font-weight: 600; }
    select {
      font: inherit; background: #374151; color: #fff; border: 0;
      border-radius: 999px; padding: .4rem .5rem;
    }
    .state {
      position: fixed; bottom: 1rem; right: 1rem; z-index: 99;
      font: 11px/1.4 ui-monospace, monospace; color: #6b7280;
      background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;
      padding: .5rem .6rem; max-width: 17rem;
    }
    .state b { color: #111827; }
  `;

  @state() private variant: Key = 'A';
  @state() private scenario: Scenario = 'normal';
  @state() private tasks: Task[] = [];

  connectedCallback() {
    super.connectedCallback();
    const p = new URLSearchParams(location.search);
    const v = (p.get('variant') ?? 'A').toUpperCase() as Key;
    this.variant = KEYS.includes(v) ? v : 'A';
    const s = p.get('scenario') as Scenario | null;
    this.scenario = s && SCENARIOS.includes(s) ? s : 'normal';
    this.tasks = scenarioTasks(this.scenario);
    window.addEventListener('keydown', this.onKey);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.onKey);
  }

  private onKey = (e: KeyboardEvent) => {
    const el = e.composedPath()[0] as HTMLElement | undefined;
    const tag = el?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return;
    if (e.key === 'ArrowLeft') this.cycle(-1);
    if (e.key === 'ArrowRight') this.cycle(1);
  };

  private cycle(step: number) {
    const i = (KEYS.indexOf(this.variant) + step + KEYS.length) % KEYS.length;
    this.go(KEYS[i], this.scenario);
  }

  private go(variant: Key, scenario: Scenario) {
    this.variant = variant;
    if (scenario !== this.scenario) {
      this.scenario = scenario;
      this.tasks = scenarioTasks(scenario);
    }
    const p = new URLSearchParams({ variant, scenario });
    history.replaceState(null, '', `${location.pathname}?${p}`);
  }

  // Events up: variants never mutate, they report a verdict.
  private onAction = (e: Event) => {
    const { id, verdict } = (e as CustomEvent<{ id: string; verdict: Verdict }>).detail;
    this.tasks = this.tasks.flatMap(t => {
      if (t.id !== id) return [t];
      if (verdict === 'drop') return [];
      return [{ ...t, day: verdict === 'today' ? today() : tomorrow() }];
    });
  };

  render() {
    const leftovers = this.tasks.filter(t => t.day < today() && !t.done);
    const todays = this.tasks.filter(t => t.day === today());
    const props = { leftovers, todays };

    return html`
      <div @triage-action=${this.onAction}>
        ${this.variant === 'A' ? html`<variant-a .leftovers=${props.leftovers} .todays=${props.todays}></variant-a>` : ''}
        ${this.variant === 'B' ? html`<variant-b .leftovers=${props.leftovers} .todays=${props.todays}></variant-b>` : ''}
        ${this.variant === 'C' ? html`<variant-c .leftovers=${props.leftovers} .todays=${props.todays}></variant-c>` : ''}
      </div>

      <div class="state">
        <div><b>${leftovers.length}</b> to triage · <b>${todays.length}</b> today · <b>${this.tasks.length}</b> total</div>
        ${this.tasks.map(t => html`<div>${t.day} ${t.done ? '✓' : '·'} ${t.title}</div>`)}
      </div>

      <div class="bar">
        <button title="Previous variant (←)" @click=${() => this.cycle(-1)}>‹</button>
        <span class="label">${this.variant} — ${NAMES[this.variant]}</span>
        <button title="Next variant (→)" @click=${() => this.cycle(1)}>›</button>
        <select @change=${(e: Event) => this.go(this.variant, (e.target as HTMLSelectElement).value as Scenario)}>
          ${SCENARIOS.map(s => html`<option value=${s} ?selected=${s === this.scenario}>${s}</option>`)}
        </select>
      </div>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'triage-prototype': TriagePrototype } }
