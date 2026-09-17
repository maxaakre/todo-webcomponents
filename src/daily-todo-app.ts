import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './task-composer.js';
import './task-list.js';
import './triage-view.js';
import { DayController } from './day-controller.js';
import { makeClock } from './day.js';
import { addTask, leftovers, tasksForDay, toggleTask, triageTask } from './store.js';
import * as storage from './storage.js';
import { emptyState } from './model.js';
import type { State, Verdict } from './model.js';

/**
 * The root. Owns State, hosts the DayController, and is the ONLY caller of
 * store.ts and storage.ts. Every change goes through `apply()`.
 */
@customElement('daily-todo-app')
export class DailyTodoApp extends LitElement {
  static styles = css`
    :host { display: block; max-width: 48rem; margin: 0 auto; padding: var(--gap-4) var(--gap-3); }
    header { margin-bottom: var(--gap-3); }
    h1 { margin: 0; font-size: 1.6rem; font-weight: 620; letter-spacing: -0.02em; }
    .date { color: var(--dim); font-size: 0.85rem; }
    task-composer { margin-bottom: var(--gap-3); }
    .notice {
      border: 1px solid var(--danger); border-radius: var(--radius);
      padding: var(--gap-2); margin-bottom: var(--gap-3); color: var(--danger);
    }
    .error { border: 1px solid var(--line); border-radius: var(--radius); padding: var(--gap-3); }
    .error h2 { margin: 0 0 var(--gap-2); font-size: 1.05rem; }
    .error p { color: var(--dim); }
    button {
      font: inherit; cursor: pointer; border: 1px solid var(--danger);
      background: var(--page); color: var(--danger);
      border-radius: var(--radius); padding: 0.5rem 0.8rem;
    }
  `;

  private day = new DayController(this, () => this.reload());

  @state() private data: State = emptyState();
  /** Set when load() refused. The app is read-only and saving is disabled. */
  @state() private blocked: string | null = null;
  @state() private notice: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.reload();
  }

  private reload() {
    const result = storage.load();
    if (result.ok) {
      this.data = result.state;
      this.blocked = null;
    } else {
      this.blocked = result.message;
    }
  }

  /**
   * The single funnel. Nothing else may call store.ts or storage.ts, and the
   * result of save() is never ignored — that is how data goes missing.
   */
  private apply(op: (state: State) => State) {
    if (this.blocked) return;
    const next = op(this.data);
    if (next === this.data) return;

    const result = storage.save(next);
    if (result.ok) {
      this.data = next;
      this.notice = null;
      return;
    }
    // Another tab wrote first. Discard, reload, and say so — a silent drop
    // here would hand back the data loss the guard exists to prevent.
    this.reload();
    this.notice = 'Changed in another tab — that action was not applied. Try again.';
  }

  private startFresh() {
    this.data = storage.startFresh();
    this.blocked = null;
    this.notice = null;
  }

  render() {
    if (this.blocked) {
      return html`
        <header><h1>Daily Todo</h1></header>
        <div class="error">
          <h2>Saved data could not be opened</h2>
          <p>${this.blocked}</p>
          <p>Nothing has been deleted. Starting fresh will replace it.</p>
          <button @click=${this.startFresh}>Start fresh</button>
        </div>`;
    }

    const today = this.day.today;
    const stale = leftovers(this.data, today);
    const todays = tasksForDay(this.data, today);

    return html`
      <header>
        <h1>${stale.length ? 'Plan today' : 'Today'}</h1>
        <div class="date">${today}</div>
      </header>

      ${this.notice ? html`<div class="notice" role="alert">${this.notice}</div>` : ''}

      <task-composer @task-added=${this.onAdded}></task-composer>

      ${stale.length
        ? html`<triage-view
              .leftovers=${stale} .todays=${todays} .today=${today}
              @task-triaged=${this.onTriaged} @task-toggled=${this.onToggled}
            ></triage-view>`
        : html`<task-list
              .tasks=${todays} @task-toggled=${this.onToggled}
            ></task-list>`}`;
  }

  private onAdded = (e: CustomEvent<{ title: string }>) =>
    this.apply((s) => addTask(s, e.detail.title, makeClock()));

  private onToggled = (e: CustomEvent<{ id: string }>) =>
    this.apply((s) => toggleTask(s, e.detail.id, makeClock()));

  private onTriaged = (e: CustomEvent<{ id: string; verdict: Verdict }>) =>
    this.apply((s) => triageTask(s, e.detail.id, e.detail.verdict, makeClock()));
}

declare global { interface HTMLElementTagNameMap { 'daily-todo-app': DailyTodoApp } }
