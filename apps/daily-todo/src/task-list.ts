import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@maxaakre/ui/button';
import '@maxaakre/ui/checkbox';
import '@maxaakre/ui/dialog';
import type { UiCloseEvent } from '@maxaakre/ui/dialog';
import type { Task } from './model.js';

/** One element, always interactive — no readonly mode. Used both inside
 *  <triage-view> and on its own once nothing is left to triage. */
@customElement('task-list')
export class TaskList extends LitElement {
  static styles = css`
    :host { display: block; }
    ul { list-style: none; margin: 0; padding: 0; }
    li {
      display: flex; align-items: center; gap: var(--ui-space-2);
      padding: 0.55rem 0; border-bottom: 1px solid var(--ui-color-border);
    }
    li:last-child { border-bottom: 0; }
    ui-checkbox { flex: 1; }
    /* checked reflects, so the slotted title can be styled from here. */
    ui-checkbox[checked] { text-decoration: line-through; color: var(--ui-color-text-muted); }
    p { color: var(--ui-color-text-muted); margin: 0; padding: var(--ui-space-3) 0; }
    ui-dialog p { color: inherit; padding: 0; }
  `;

  @property({ attribute: false }) tasks: Task[] = [];
  @property() empty = 'Nothing planned yet.';

  /** The Task whose × was pressed. Erase has no undo, so it asks first. */
  @state() private pending: Task | null = null;

  /** Row to focus once the erased Task has left the list. */
  private focusIndexAfterErase: number | null = null;

  private toggle(id: string) {
    this.dispatchEvent(new CustomEvent('task-toggled', {
      detail: { id }, bubbles: true, composed: true,
    }));
  }

  private onConfirmClosed(e: UiCloseEvent) {
    const task = this.pending;
    this.pending = null;
    if (!task || e.detail.returnValue !== 'erase') return;

    this.focusIndexAfterErase = this.tasks.indexOf(task);
    this.dispatchEvent(new CustomEvent('task-erased', {
      detail: { id: task.id }, bubbles: true, composed: true,
    }));
  }

  protected updated(changed: Map<string, unknown>) {
    if (!changed.has('tasks') || this.focusIndexAfterErase === null) return;
    // The next row slides into the erased one's place; at the end, the one before.
    const boxes = this.renderRoot.querySelectorAll('ui-checkbox');
    boxes[Math.min(this.focusIndexAfterErase, boxes.length - 1)]?.focus();
    this.focusIndexAfterErase = null;
  }

  render() {
    if (!this.tasks.length) return html`<p>${this.empty}</p>`;
    return html`<ul>${this.tasks.map((t) => html`
      <li>
        <ui-checkbox .checked=${t.status === 'done'}
                     @change=${() => this.toggle(t.id)}>${t.title}</ui-checkbox>
        <ui-button variant="ghost" size="sm" label=${`Erase "${t.title}"`}
                   @click=${() => (this.pending = t)}>&#10005;</ui-button>
      </li>`)}</ul>
      <ui-dialog label=${this.pending ? `Erase “${this.pending.title}”?` : ''}
                 .open=${this.pending !== null} @ui-close=${this.onConfirmClosed}>
        <p>It leaves your list. This cannot be undone.</p>
        <ui-button slot="footer" data-dialog-close="cancel">Cancel</ui-button>
        <ui-button slot="footer" variant="danger" data-dialog-close="erase">Erase</ui-button>
      </ui-dialog>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'task-list': TaskList } }
