/**
 * JSX types for @maxaakre/ui in React 19.
 *
 * React 19 passes a prop as a *property* when the element has one (so
 * `checked={true}` and `selectedIndex={1}` work). Known React events like
 * `onClick` and `onChange` work as usual (tested: onChange fires once).
 * Custom events use `on` + the exact event name, e.g. `onui-toggle`.
 * TypeScript does not know any of that, so it is declared here.
 */
import type { DOMAttributes, HTMLAttributes, Ref } from 'react';
import type {
  UiButton, UiCheckbox, UiCloseEvent, UiDialog, UiDisclosure,
  UiTab, UiTabChangeEvent, UiTabPanel, UiTabs, UiTextField, UiToggleEvent,
} from '@maxaakre/ui';

/** Base props, plus the element's own properties K, plus a typed ref. */
type Props<T, K extends keyof T = never> =
  Omit<HTMLAttributes<T>, keyof DOMAttributes<T>> &
  Pick<DOMAttributes<T>, 'onClick' | 'onChange' | 'children'> &
  Partial<Pick<T, K>> & { ref?: Ref<T>; slot?: string; 'data-dialog-close'?: string };

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'ui-button': Props<UiButton, 'variant' | 'size' | 'disabled' | 'type' | 'label'>;
      'ui-text-field': Props<UiTextField, 'label' | 'hideLabel' | 'value' | 'name' | 'placeholder' | 'required' | 'hint' | 'error' | 'disabled'>;
      'ui-checkbox': Props<UiCheckbox, 'checked' | 'indeterminate' | 'name' | 'value' | 'disabled'>;
      'ui-disclosure': Props<UiDisclosure, 'open'> & { 'onui-toggle'?: (e: UiToggleEvent) => void };
      'ui-tabs': Props<UiTabs, 'label' | 'selectedIndex'> & { 'onui-tab-change'?: (e: UiTabChangeEvent) => void };
      'ui-tab': Props<UiTab, 'value'>;
      'ui-tab-panel': Props<UiTabPanel>;
      'ui-dialog': Props<UiDialog, 'open' | 'label' | 'closeOnBackdrop'> & { 'onui-close'?: (e: UiCloseEvent) => void };
    }
  }
}
