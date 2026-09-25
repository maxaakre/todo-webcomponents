import { LitElement, css, html, nothing } from 'lit';
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
    p:focus { outline: none; } /* focused from code, as a landing spot only */
    ui-dialog p { color: inherit; padding: 0; }
  `;

  @property({ attribute: false }) tasks: Task[] = [];
  @property() empty = 'Nothing planned yet.';

  /** The Task whose × was pressed. Erase has no undo, so it asks first. */
  @state() private pending: Task | null = null;

  /** Row to focus once an erased or rescheduled Task has left the list. */
  private focusIndexAfterRemoval: number | null = null;

  private toggle(id: string) {
    this.dispatchEvent(new CustomEvent('task-toggled', {
      detail: { id }, bubbles: true, composed: true,
    }));
  }

  private onConfirmClosed(e: UiCloseEvent) {
    const task = this.pending;
    this.pending = null;
    if (!task || e.detail.returnValue !== 'erase') return;

    this.removing(task.id);
    this.dispatchEvent(new CustomEvent('task-erased', {
      detail: { id: task.id }, bubbles: true, composed: true,
    }));
  }

  private reschedule(id: string) {
    this.removing(id);
    this.dispatchEvent(new CustomEvent('task-moved', {
      detail: { id, to: 'tomorrow' }, bubbles: true, composed: true,
    }));
  }

  /** Remember where the row was, so focus has somewhere to go once it is gone. */
  private removing(id: string) {
    // By id: a reload while the dialog was open replaces the Task objects.
    this.focusIndexAfterRemoval = this.tasks.findIndex((t) => t.id === id);
  }

  protected updated(changed: Map<string, unknown>) {
    if (!changed.has('tasks') || this.focusIndexAfterRemoval === null) return;
    // The next row slides into the erased one's place; at the end, the one
    // before. With no rows left, the empty message: never <body>.
    const boxes = this.renderRoot.querySelectorAll('ui-checkbox');
    const target = boxes.length
      ? boxes[Math.min(Math.max(this.focusIndexAfterRemoval, 0), boxes.length - 1)]
      : this.renderRoot.querySelector<HTMLElement>('p');
    target?.focus();
    this.focusIndexAfterRemoval = null;
  }

  render() {
    // tabindex -1: focusable from code (after erasing the last Task), not by Tab.
    if (!this.tasks.length) return html`<p tabindex="-1">${this.empty}</p>`;
    return html`<ul>${this.tasks.map((t) => html`
      <li>
        <ui-checkbox .checked=${t.status === 'done'}
                     @change=${() => this.toggle(t.id)}>${t.title}</ui-checkbox>
        ${t.status === 'open' ? html`
          <ui-button variant="ghost" size="sm" label=${`Move "${t.title}" to tomorrow`}
                     @click=${() => this.reschedule(t.id)}>Tomorrow</ui-button>` : nothing}
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
