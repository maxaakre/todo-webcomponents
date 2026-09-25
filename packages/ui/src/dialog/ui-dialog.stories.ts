import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './ui-dialog.js';
import '../button/ui-button.js';
import type { UiDialog } from './ui-dialog.js';

type Args = { label: string; closeOnBackdrop: boolean };

const openNext = (e: Event) => {
  const dialog = (e.currentTarget as Element).nextElementSibling as UiDialog;
  dialog.open = true;
};

const meta: Meta<Args> = {
  title: 'Components/Dialog',
  component: 'ui-dialog',
  args: { label: 'Erase “Buy oat milk”?', closeOnBackdrop: false },
  render: (a) => html`
    <ui-button variant="danger" @click=${openNext}>Erase…</ui-button>
    <ui-dialog label=${a.label} ?close-on-backdrop=${a.closeOnBackdrop}
               @ui-close=${(e: CustomEvent) => console.log('ui-close', e.detail)}>
      <p style="margin:0">It leaves your list. This cannot be undone.</p>
      <ui-button slot="footer" data-dialog-close="cancel">Cancel</ui-button>
      <ui-button slot="footer" variant="danger" data-dialog-close="erase">Erase</ui-button>
    </ui-dialog>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Confirm: Story = {};
export const CloseOnBackdrop: Story = { name: 'Closes on backdrop click', args: { closeOnBackdrop: true } };

export const Veto: Story = {
  name: 'Veto a close (preventDefault)',
  render: () => html`
    <ui-button @click=${openNext}>Open</ui-button>
    <ui-dialog label="Unsaved changes"
               @ui-close=${(e: CustomEvent<{ returnValue: string }>) => {
                 if (e.detail.returnValue !== 'discard') e.preventDefault();
               }}>
      <p style="margin:0">Escape does nothing here. Only “Discard” closes it.</p>
      <ui-button slot="footer" variant="danger" data-dialog-close="discard">Discard</ui-button>
    </ui-dialog>`,
};

export const Open: Story = {
  name: 'Open (for visual review)',
  render: () => html`
    <ui-dialog label="Erase “Buy oat milk”?" open>
      <p style="margin:0">It leaves your list. This cannot be undone.</p>
      <ui-button slot="footer" data-dialog-close="cancel">Cancel</ui-button>
      <ui-button slot="footer" variant="danger" data-dialog-close="erase">Erase</ui-button>
    </ui-dialog>`,
};
