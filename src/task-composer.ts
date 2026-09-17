import { LitElement, css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';

/** Owns the input: trimming, rejecting empties, clearing, keeping focus. */
@customElement('task-composer')
export class TaskComposer extends LitElement {
  static styles = css`
    :host { display: block; }
    form { display: flex; gap: var(--gap-1); }
    input {
      flex: 1; font: inherit; color: var(--ink); background: var(--page);
      border: 1px solid var(--line); border-radius: var(--radius);
      padding: 0.55rem 0.7rem;
    }
    input:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
    button {
      font: inherit; cursor: pointer; border: 1px solid var(--accent);
      background: var(--accent); color: var(--accent-ink);
      border-radius: var(--radius); padding: 0.55rem 0.9rem;
    }
  `;

  @query('input') private input!: HTMLInputElement;

  private submit(e: Event) {
    e.preventDefault();
    const title = this.input.value.trim();
    if (!title) return;
    this.dispatchEvent(new CustomEvent('task-added', {
      detail: { title }, bubbles: true, composed: true,
    }));
    this.input.value = '';
    this.input.focus();
  }

  render() {
    return html`
      <form @submit=${this.submit}>
        <input type="text" name="title" placeholder="Add a task for today" aria-label="New task" />
        <button type="submit">Add</button>
      </form>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'task-composer': TaskComposer } }
