import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import './ui-button.js';
import type { UiButton } from './ui-button.js';

type Args = Pick<UiButton, 'variant' | 'size' | 'disabled' | 'type' | 'label'> & { text: string };

const meta: Meta<Args> = {
  title: 'Components/Button',
  component: 'ui-button',
  args: { text: 'Save', variant: 'secondary', size: 'md', disabled: false, type: 'button' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    type: { control: 'inline-radio', options: ['button', 'submit'] },
  },
  render: (a) => html`
    <ui-button variant=${a.variant} size=${a.size} type=${a.type}
               label=${ifDefined(a.label)} ?disabled=${a.disabled}>${a.text}</ui-button>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => html`
    <div style="display:flex; gap:12px; flex-wrap:wrap">
      <ui-button variant="primary">Primary</ui-button>
      <ui-button variant="secondary">Secondary</ui-button>
      <ui-button variant="ghost">Ghost</ui-button>
      <ui-button variant="danger">Danger</ui-button>
    </div>`,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex; gap:12px; align-items:center">
      <ui-button size="sm">Small</ui-button>
      <ui-button size="md">Medium</ui-button>
    </div>`,
};

export const Disabled: Story = { args: { disabled: true } };

export const WithIcon: Story = {
  name: 'With prefix icon',
  render: () => html`
    <ui-button variant="primary">
      <svg slot="prefix" aria-hidden="true" width="14" height="14" viewBox="0 0 14 14">
        <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" />
      </svg>
      Add task
    </ui-button>`,
};

export const IconOnly: Story = {
  name: 'Icon only (uses label)',
  render: () => html`
    <ui-button variant="ghost" size="sm" label="Erase “Buy milk”">
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12">
        <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="2" />
      </svg>
    </ui-button>`,
};

export const SubmitsAForm: Story = {
  name: 'Submits a form',
  render: () => html`
    <form @submit=${(e: Event) => { e.preventDefault(); alert('submitted'); }}
          style="display:flex; gap:8px">
      <input name="q" aria-label="Search" />
      <ui-button type="submit" variant="primary">Search</ui-button>
    </form>`,
};

export const InDisabledFieldset: Story = {
  name: 'Inside a disabled fieldset',
  render: () => html`
    <fieldset disabled style="border:0; padding:0">
      <ui-button type="submit">Disabled by its fieldset</ui-button>
    </fieldset>`,
};
