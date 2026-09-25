import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import './ui-text-field.js';
import '../button/ui-button.js';
import type { UiTextField } from './ui-text-field.js';

type Args = Pick<UiTextField, 'label' | 'hideLabel' | 'value' | 'placeholder' | 'hint' | 'error' | 'required' | 'disabled'>;

const meta: Meta<Args> = {
  title: 'Components/Text field',
  component: 'ui-text-field',
  args: { label: 'Task', hideLabel: false, value: '', placeholder: '', hint: '', error: '', required: false, disabled: false },
  render: (a) => html`
    <ui-text-field label=${a.label} ?hide-label=${a.hideLabel} value=${a.value}
                   placeholder=${ifDefined(a.placeholder || undefined)}
                   hint=${a.hint} error=${a.error}
                   ?required=${a.required} ?disabled=${a.disabled}></ui-text-field>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};
export const WithHint: Story = { args: { hint: 'One thing, small enough to finish today.' } };
export const WithError: Story = { args: { value: 'x', error: 'Give the task a longer name.' } };
export const Required: Story = { args: { required: true } };
export const Disabled: Story = { args: { value: 'Read only for now', disabled: true } };
export const HiddenLabel: Story = {
  name: 'Hidden label (still announced)',
  args: { label: 'New task', hideLabel: true, placeholder: 'Add a task for today' },
};

export const InAForm: Story = {
  name: 'In a form (Enter submits, validation)',
  render: () => html`
    <form style="display:grid; gap:12px; max-width:320px"
          @submit=${(e: SubmitEvent) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            alert(JSON.stringify(Object.fromEntries(new FormData(form))));
          }}>
      <ui-text-field label="Title" name="title" required></ui-text-field>
      <ui-text-field label="Note" name="note" hint="Optional"></ui-text-field>
      <ui-button type="submit" variant="primary">Save</ui-button>
    </form>`,
};
