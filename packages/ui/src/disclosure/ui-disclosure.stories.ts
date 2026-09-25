import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './ui-disclosure.js';

type Args = { open: boolean; summary: string };

const meta: Meta<Args> = {
  title: 'Components/Disclosure',
  component: 'ui-disclosure',
  args: { open: false, summary: 'Unfinished (2)' },
  render: (a) => html`
    <ui-disclosure ?open=${a.open} @ui-toggle=${(e: CustomEvent) => console.log('ui-toggle', e.detail)}>
      <span slot="summary">${a.summary}</span>
      <ul style="margin:0">
        <li>Fix the bike</li>
        <li>Write the ADR for tabs</li>
      </ul>
    </ui-disclosure>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Closed: Story = {};
export const Open: Story = { args: { open: true } };

export const Stack: Story = {
  name: 'A stack (each one independent)',
  render: () => html`
    <div style="display:grid; gap:12px; max-width:360px">
      ${['Morning', 'Afternoon', 'Evening'].map((part, i) => html`
        <ui-disclosure ?open=${i === 0}>
          <span slot="summary">${part}</span>
          <p style="margin:0">Tasks for the ${part.toLowerCase()}.</p>
        </ui-disclosure>`)}
    </div>`,
};
