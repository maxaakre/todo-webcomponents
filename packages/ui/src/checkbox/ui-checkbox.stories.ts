import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './ui-checkbox.js';
import type { UiCheckbox } from './ui-checkbox.js';

type Args = Pick<UiCheckbox, 'checked' | 'indeterminate' | 'disabled'> & { text: string };

const meta: Meta<Args> = {
  title: 'Components/Checkbox',
  component: 'ui-checkbox',
  args: { text: 'Buy oat milk', checked: false, indeterminate: false, disabled: false },
  render: (a) => html`
    <ui-checkbox ?checked=${a.checked} .indeterminate=${a.indeterminate} ?disabled=${a.disabled}>${a.text}</ui-checkbox>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};
export const Checked: Story = { args: { checked: true } };
export const Indeterminate: Story = { args: { text: 'All tasks', indeterminate: true } };
export const Disabled: Story = { args: { disabled: true } };

export const Group: Story = {
  name: 'Group in a fieldset',
  render: () => html`
    <fieldset style="display:grid; gap:8px; border:1px solid var(--ui-color-border); border-radius:10px">
      <legend>Tags</legend>
      <ui-checkbox name="tag" value="work">Work</ui-checkbox>
      <ui-checkbox name="tag" value="home" checked>Home</ui-checkbox>
      <ui-checkbox name="tag" value="errand">Errand</ui-checkbox>
    </fieldset>`,
};
