import { html } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { fixture } from '../test/fixture.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import './ui-tabs.js';
import type { UiTab, UiTabPanel, UiTabs } from './ui-tabs.js';

const make = (selected = 0) => fixture<UiTabs>(html`
  <ui-tabs label="Views" selected-index=${selected}>
    <ui-tab value="today">Today</ui-tab>
    <ui-tab value="week">Week</ui-tab>
    <ui-tab value="later">Later</ui-tab>
    <ui-tab-panel>Today's tasks</ui-tab-panel>
    <ui-tab-panel>This week</ui-tab-panel>
    <ui-tab-panel>Someday</ui-tab-panel>
  </ui-tabs>`);

const tabs = (el: UiTabs) => [...el.querySelectorAll<UiTab>('ui-tab')];
const panels = (el: UiTabs) => [...el.querySelectorAll<UiTabPanel>('ui-tab-panel')];
const settle = async (el: UiTabs) => {
  await el.updateComplete;
  await Promise.all([...tabs(el), ...panels(el)].map((c) => c.updateComplete));
};
const selectedIndex = (el: UiTabs) => tabs(el).findIndex((t) => t.selected);

describe('ui-tabs: ARIA wiring', () => {
  it('gives the tab list, tabs and panels their roles', async () => {
    const el = await make();
    await settle(el);
    const list = el.shadowRoot!.querySelector('[part=tablist]')!;
    expect(list.getAttribute('role')).toBe('tablist');
    expect(list.getAttribute('aria-label')).toBe('Views');
    // Found by role the way a consumer's own tests would find them.
    expect(page.getByRole('tab').elements()).toEqual(tabs(el));
    // Hidden panels leave the accessibility tree; only the selected one is left.
    expect(page.getByRole('tabpanel').elements()).toEqual([panels(el)[0]]);
  });

  it('links each tab to its panel both ways, by id, in the same tree', async () => {
    const el = await make();
    await settle(el);
    tabs(el).forEach((tab, i) => {
      const panel = panels(el)[i];
      expect(tab.id).not.toBe('');
      expect(panel.id).not.toBe('');
      expect(tab.getAttribute('aria-controls')).toBe(panel.id);
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
      expect(document.getElementById(tab.getAttribute('aria-controls')!)).toBe(panel);
    });
  });

  it('keeps a role the consumer set', async () => {
    const el = await fixture<UiTabs>(html`
      <ui-tabs label="X"><ui-tab role="presentation">A</ui-tab><ui-tab-panel>a</ui-tab-panel></ui-tabs>`);
    await settle(el);
    expect(tabs(el)[0].getAttribute('role')).toBe('presentation');
  });

  it('keeps ids the consumer set', async () => {
    const el = await fixture<UiTabs>(html`
      <ui-tabs label="X"><ui-tab id="mine">A</ui-tab><ui-tab-panel id="my-panel">a</ui-tab-panel></ui-tabs>`);
    await settle(el);
    expect(tabs(el)[0].id).toBe('mine');
    expect(tabs(el)[0].getAttribute('aria-controls')).toBe('my-panel');
  });

  it('marks exactly one tab selected, and shows only its panel', async () => {
    const el = await make(1);
    await settle(el);
    expect(tabs(el).map((t) => t.selected)).toEqual([false, true, false]);
    expect(page.getByRole('tab', { selected: true }).elements()).toEqual([tabs(el)[1]]);
    expect(page.getByRole('tabpanel', { name: 'Week' }).element()).toBe(panels(el)[1]);
    expect(panels(el).map((p) => p.hidden)).toEqual([true, false, true]);
  });

  it('links a panel added later (default slot slotchange)', async () => {
    const el = await fixture<UiTabs>(html`
      <ui-tabs label="X"><ui-tab>A</ui-tab><ui-tab>B</ui-tab><ui-tab-panel>a</ui-tab-panel></ui-tabs>`);
    await settle(el);
    const panel = document.createElement('ui-tab-panel');
    el.append(panel);
    await new Promise((r) => setTimeout(r, 0));
    expect(tabs(el)[1].getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.hidden).toBe(true);
  });

  it('links a tab added later (tab slot slotchange)', async () => {
    const el = await fixture<UiTabs>(html`
      <ui-tabs label="X"><ui-tab>A</ui-tab><ui-tab-panel>a</ui-tab-panel><ui-tab-panel>b</ui-tab-panel></ui-tabs>`);
    await settle(el);
    // slot="tab" set up front, as a consumer may write it. Without it the
    // tab would pass through the default slot first and hide this case.
    const tab = document.createElement('ui-tab');
    tab.slot = 'tab';
    tab.textContent = 'B';
    tabs(el)[0].after(tab);
    await new Promise((r) => setTimeout(r, 0));
    expect(tab.getAttribute('aria-controls')).toBe(panels(el)[1].id);
  });

  it('warns in dev when tabs and panels do not pair up', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = await fixture<UiTabs>(html`
      <ui-tabs label="X"><ui-tab>A</ui-tab><ui-tab>B</ui-tab><ui-tab-panel>a</ui-tab-panel></ui-tabs>`);
    await settle(el);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('2 tabs but 1 panel'), expect.anything());
    warn.mockRestore();
  });
});

describe('ui-tabs: keyboard (manual activation)', () => {
  it('Tab lands on the selected tab, not the first', async () => {
    const el = await make(1);
    await settle(el);
    await userEvent.tab();
    expect(document.activeElement).toBe(tabs(el)[1]);
  });

  it('→ and ← move focus, wrapping at both ends, without selecting', async () => {
    const el = await make();
    await settle(el);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabs(el)[1]);
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(document.activeElement).toBe(tabs(el)[0]); // wrapped
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(tabs(el)[2]); // wrapped back
    expect(selectedIndex(el)).toBe(0); // focus only
  });

  it('in right-to-left layouts, ← moves to the next tab and → to the previous', async () => {
    const root = await fixture<HTMLDivElement>(html`
      <div dir="rtl"><ui-tabs label="X">
        <ui-tab>A</ui-tab><ui-tab>B</ui-tab><ui-tab>C</ui-tab>
        <ui-tab-panel>a</ui-tab-panel><ui-tab-panel>b</ui-tab-panel><ui-tab-panel>c</ui-tab-panel>
      </ui-tabs></div>`);
    const el = root.querySelector('ui-tabs')!;
    await settle(el);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(tabs(el)[1]);
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabs(el)[0]);
  });

  it('Home and End jump to the ends', async () => {
    const el = await make(1);
    await settle(el);
    await userEvent.tab();
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(tabs(el)[2]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(tabs(el)[0]);
  });

  it('Enter and Space select the focused tab', async () => {
    const el = await make();
    await settle(el);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}{Enter}');
    await settle(el);
    expect(selectedIndex(el)).toBe(1);
    await userEvent.keyboard('{ArrowRight} ');
    await settle(el);
    expect(selectedIndex(el)).toBe(2);
    expect(panels(el)[2].hidden).toBe(false);
  });

  it('Home and End do not scroll the page', async () => {
    const el = await fixture<HTMLDivElement>(html`
      <div style="height:300vh"><ui-tabs label="X">
        <ui-tab>A</ui-tab><ui-tab>B</ui-tab><ui-tab-panel>a</ui-tab-panel><ui-tab-panel>b</ui-tab-panel>
      </ui-tabs></div>`);
    await settle(el.querySelector('ui-tabs')!);
    await userEvent.tab();
    await userEvent.keyboard('{End}');
    await new Promise((r) => setTimeout(r, 100)); // scrolling is async
    expect(window.scrollY).toBe(0);
  });

  it('only one tab is in the tab order at a time (roving tabindex)', async () => {
    const el = await make();
    await settle(el);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(tabs(el).map((t) => t.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('Tab from any focused tab goes to the panel', async () => {
    const el = await make();
    await settle(el);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}'); // focus tab 1, tab 0 still selected
    await userEvent.tab();
    expect(document.activeElement).toBe(panels(el)[0]);
  });

  it('after leaving, coming back lands on the selected tab again', async () => {
    const el = await fixture<HTMLDivElement>(html`
      <div>
        <ui-tabs label="Views">
          <ui-tab>A</ui-tab><ui-tab>B</ui-tab>
          <ui-tab-panel>a</ui-tab-panel><ui-tab-panel>b</ui-tab-panel>
        </ui-tabs>
        <button>after</button>
      </div>`);
    const t = el.querySelector('ui-tabs')!;
    await settle(t);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}'); // focus B, A still selected
    await userEvent.tab(); // panel a
    await userEvent.tab({ shift: true }); // back into the tab list
    expect(document.activeElement).toBe(tabs(t)[0]);
  });
});

describe('ui-tabs: pointer and events', () => {
  it('clicking a tab selects it', async () => {
    const el = await make();
    await settle(el);
    await userEvent.click(tabs(el)[2]);
    await settle(el);
    expect(selectedIndex(el)).toBe(2);
    expect(el.selectedIndex).toBe(2);
    expect(el.getAttribute('selected-index')).toBe('2');
  });

  it('fires ui-tab-change with index and value on user selection', async () => {
    const el = await make();
    await settle(el);
    const seen: unknown[] = [];
    el.addEventListener('ui-tab-change', (e) => seen.push(e.detail));
    await userEvent.click(tabs(el)[1]); // focus is now on tab 1
    await userEvent.keyboard('{ArrowRight}{Enter}');
    await settle(el);
    expect(seen).toEqual([{ index: 1, value: 'week' }, { index: 2, value: 'later' }]);
  });

  it('does not fire when selecting the tab that is already selected', async () => {
    const el = await make();
    await settle(el);
    const onChange = vi.fn();
    el.addEventListener('ui-tab-change', onChange);
    await userEvent.click(tabs(el)[0]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('fires nothing when selectedIndex is set in code', async () => {
    const el = await make();
    await settle(el);
    const onChange = vi.fn();
    el.addEventListener('ui-tab-change', onChange);
    el.selectedIndex = 2;
    await settle(el);
    expect(selectedIndex(el)).toBe(2);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clamps an out-of-range selectedIndex to the first tab', async () => {
    const el = await make(9);
    await settle(el);
    expect(selectedIndex(el)).toBe(0);
  });
});

describe('ui-tabs: axe', () => {
  it('has no violations', async () => {
    const el = await make(1);
    await settle(el);
    await expectNoA11yViolations(el);
  });
});
