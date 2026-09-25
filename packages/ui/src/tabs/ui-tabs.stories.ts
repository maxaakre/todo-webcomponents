import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './ui-tabs.js';

type Args = { selectedIndex: number };

const meta: Meta<Args> = {
  title: 'Components/Tabs',
  component: 'ui-tabs',
  subcomponents: { Tab: 'ui-tab', TabPanel: 'ui-tab-panel' },
  args: { selectedIndex: 0 },
  argTypes: { selectedIndex: { control: { type: 'number', min: 0, max: 2 } } },
  render: (a) => html`
    <ui-tabs label="Task views" selected-index=${a.selectedIndex}
             @ui-tab-change=${(e: CustomEvent) => console.log('ui-tab-change', e.detail)}>
      <ui-tab value="today">Today</ui-tab>
      <ui-tab value="week">This week</ui-tab>
      <ui-tab value="later">Later</ui-tab>
      <ui-tab-panel>Buy oat milk · Renew passport</ui-tab-panel>
      <ui-tab-panel>Call the dentist · Fix the bike</ui-tab-panel>
      <ui-tab-panel>Learn the cello</ui-tab-panel>
    </ui-tabs>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};
export const SecondSelected: Story = { args: { selectedIndex: 1 } };

export const PanelWithControls: Story = {
  name: 'Panel with focusable content',
  render: () => html`
    <ui-tabs label="Settings">
      <ui-tab>General</ui-tab>
      <ui-tab>Advanced</ui-tab>
      <ui-tab-panel>
        <label>Name <input value="Daily Todo" /></label>
      </ui-tab-panel>
      <ui-tab-panel>
        <label><input type="checkbox" /> Sync across devices</label>
      </ui-tab-panel>
    </ui-tabs>`,
};
