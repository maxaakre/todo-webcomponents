import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { customElement } from '../internal/define.js';
import { DEV } from '../internal/dev.js';

export type UiTabChangeEvent = CustomEvent<{ index: number; value: string }>;

let nextId = 0;
const ensureId = (el: HTMLElement, prefix: string) => {
  if (!el.id) el.id = `${prefix}-${++nextId}`;
  return el.id;
};

/**
 * One tab. Place it directly inside `<ui-tabs>`. It moves itself into the
 * tab list (it sets `slot="tab"` if you did not).
 *
 * @slot - The tab's label.
 */
@customElement('ui-tab')
export class UiTab extends LitElement {
  static styles = css`
    :host {
      display: inline-flex; align-items: center;
      padding: 0.5rem 0.9rem; cursor: pointer; user-select: none;
      color: var(--ui-color-text-muted, #5b6270);
      border-block-end: 2px solid transparent;
      margin-block-end: -1px; /* sit on the tab list's border */
    }
    :host([selected]) {
      color: var(--ui-color-text, #16181d);
      border-block-end-color: var(--ui-color-accent, #2563eb);
      font-weight: 560;
    }
    :host(:hover) { color: var(--ui-color-text, #16181d); }
    :host(:focus-visible) {
      outline: 2px solid var(--ui-color-focus, #2563eb); outline-offset: -2px;
      border-radius: var(--ui-radius-sm, 6px);
    }
    @media (forced-colors: active) {
      :host([selected]) { border-block-end-color: Highlight; }
      :host(:focus-visible) { outline-color: Highlight; }
    }
  `;

  /** Set by `<ui-tabs>`. Reflected for styling. Change the selection on `<ui-tabs>`, not here. */
  @property({ type: Boolean, reflect: true }) selected = false;

  /** Returned in `ui-tab-change`. Defaults to the tab's index. */
  @property() value?: string;

  connectedCallback() {
    super.connectedCallback();
    // Attributes, not ElementInternals ARIA. Browsers read both, but test
    // tools (Testing Library, Playwright's getByRole, axe) read only
    // attributes, and consumers must be able to find tabs in their tests.
    if (!this.hasAttribute('role')) this.setAttribute('role', 'tab');
    if (!this.slot) this.slot = 'tab';
  }

  protected updated() {
    this.setAttribute('aria-selected', String(this.selected));
  }

  render() {
    return html`<slot></slot>`;
  }
}

/**
 * The content for one tab. Place it inside `<ui-tabs>`, in the same order
 * as the tabs.
 *
 * @slot - The panel content.
 */
@customElement('ui-tab-panel')
export class UiTabPanel extends LitElement {
  static styles = css`
    :host { display: block; padding-block: var(--ui-space-3, 1.25rem); }
    :host([hidden]) { display: none; }
    :host(:focus-visible) {
      outline: 2px solid var(--ui-color-focus, #2563eb); outline-offset: 2px;
      border-radius: var(--ui-radius-sm, 6px);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    // An attribute, for the same reason as on <ui-tab>.
    if (!this.hasAttribute('role')) this.setAttribute('role', 'tabpanel');
    // In the tab order, so Tab moves from the tab list into the panel even
    // when the panel has nothing focusable (WAI-ARIA APG).
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
  }

  render() {
    return html`<slot></slot>`;
  }
}

/**
 * Tabs: one panel visible at a time. Follows the WAI-ARIA tabs pattern with
 * manual activation: arrow keys move focus, Enter or Space selects.
 *
 * Tabs and panels are light-DOM children, not rendered in a shadow root.
 * That is on purpose: `aria-controls` and `aria-labelledby` are ID
 * references, and those only work inside one DOM tree.
 *
 * ```html
 * <ui-tabs label="Views">
 *   <ui-tab>Today</ui-tab> <ui-tab>Week</ui-tab>
 *   <ui-tab-panel>…</ui-tab-panel> <ui-tab-panel>…</ui-tab-panel>
 * </ui-tabs>
 * ```
 *
 * @slot tab - The `<ui-tab>` elements. They assign themselves to it.
 * @slot - The `<ui-tab-panel>` elements, in the same order as the tabs.
 *
 * @fires {UiTabChangeEvent} ui-tab-change - The user selected a different tab.
 *   `detail.index` and `detail.value`. Not fired when `selectedIndex` is set in code.
 *
 * @csspart tablist - The row of tabs.
 */
@customElement('ui-tabs')
export class UiTabs extends LitElement {
  static styles = css`
    :host { display: block; }
    [part='tablist'] {
      display: flex; gap: var(--ui-space-1, 0.35rem);
      border-block-end: 1px solid var(--ui-color-border, #e5e7eb);
    }
  `;

  /** Accessible name of the tab list. Required: there may be several tab sets on a page. */
  @property() label = '';

  /** Index of the selected tab. Reflected. Out of range falls back to 0. */
  @property({ type: Number, reflect: true, attribute: 'selected-index' }) selectedIndex = 0;

  private get tabs(): UiTab[] {
    return [...this.querySelectorAll<UiTab>(':scope > ui-tab')];
  }

  private get panels(): UiTabPanel[] {
    return [...this.querySelectorAll<UiTabPanel>(':scope > ui-tab-panel')];
  }

  /** Wire ids, selection, visibility and tabindex. Runs on every render and slot change. */
  private sync() {
    const { tabs, panels } = this;
    if (DEV && tabs.length !== panels.length) {
      console.warn(`<ui-tabs> has ${tabs.length} tabs but ${panels.length} panel(s). They pair up by order.`, this);
    }
    const selected = this.selectedIndex >= 0 && this.selectedIndex < tabs.length ? this.selectedIndex : 0;

    tabs.forEach((tab, i) => {
      const panel = panels[i];
      const tabId = ensureId(tab, 'ui-tab');
      tab.selected = i === selected;
      tab.tabIndex = i === selected ? 0 : -1;
      if (panel) {
        tab.setAttribute('aria-controls', ensureId(panel, 'ui-tab-panel'));
        panel.setAttribute('aria-labelledby', tabId);
        panel.hidden = i !== selected;
      }
    });
  }

  private select(index: number) {
    if (index === this.selectedIndex) return;
    this.selectedIndex = index;
    const tab = this.tabs[index];
    this.dispatchEvent(new CustomEvent('ui-tab-change', {
      detail: { index, value: tab.value ?? String(index) },
      bubbles: true,
    }));
  }

  /** Move focus (only) and carry the single tabindex=0 with it. */
  private focusTab(index: number) {
    const { tabs } = this;
    tabs.forEach((t, i) => (t.tabIndex = i === index ? 0 : -1));
    tabs[index].focus();
  }

  private onClick(e: Event) {
    const index = this.tabs.indexOf((e.target as Element).closest('ui-tab') as UiTab);
    if (index >= 0) this.select(index);
  }

  private onKeydown(e: KeyboardEvent) {
    const { tabs } = this;
    const current = tabs.indexOf(e.target as UiTab);
    if (current < 0) return;
    const last = tabs.length - 1;
    const next = ({
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    } as Record<string, number>)[e.key];

    if (next !== undefined) {
      e.preventDefault(); // Home/End would scroll the page
      this.focusTab(next);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Space would scroll the page
      this.select(current);
    }
  }

  private onFocusout(e: FocusEvent) {
    // Leaving the tab list: put the tab stop back on the selected tab, so
    // coming back lands there, not on the tab that last had focus.
    if (!this.tabs.includes(e.relatedTarget as UiTab)) this.sync();
  }

  protected firstUpdated() {
    if (DEV && !this.label) {
      console.warn('<ui-tabs> has no label, so its tab list has no accessible name.', this);
    }
  }

  protected updated() {
    this.sync();
  }

  render() {
    return html`
      <div part="tablist" role="tablist" aria-label=${this.label}
           @click=${this.onClick} @keydown=${this.onKeydown} @focusout=${this.onFocusout}>
        <slot name="tab" @slotchange=${this.sync}></slot>
      </div>
      <slot @slotchange=${this.sync}></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-tabs': UiTabs;
    'ui-tab': UiTab;
    'ui-tab-panel': UiTabPanel;
  }
  interface HTMLElementEventMap { 'ui-tab-change': UiTabChangeEvent }
}
