import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

/**
 * Scaffold placeholder. Proves the toolchain renders a Lit element and that
 * reactive state re-renders. The real component decomposition is ticket 06;
 * do not grow this element into the app before that ticket is resolved.
 */
@customElement('daily-todo-app')
export class DailyTodoApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      font: 16px/1.5 system-ui, sans-serif;
      padding: 2rem;
    }
  `;

  @state()
  private count = 0;

  render() {
    return html`
      <h1>Daily Todo</h1>
      <p>Scaffold is alive. Clicked ${this.count} times.</p>
      <button @click=${() => this.count++}>Click</button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'daily-todo-app': DailyTodoApp;
  }
}
