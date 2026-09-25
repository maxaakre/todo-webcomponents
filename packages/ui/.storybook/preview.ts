import type { Preview } from '@storybook/web-components-vite';
import { setCustomElementsManifest } from '@storybook/web-components-vite';
import manifest from '../custom-elements.json';
import '../src/tokens/tokens.css';

// API tables (props, events, slots, parts, CSS props) come from the
// manifest, which the analyzer builds from each component's JSDoc.
setCustomElementsManifest(manifest);

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Colour theme',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (story, { globals }) => {
      document.documentElement.dataset.theme = globals.theme;
      document.body.style.background = 'var(--ui-color-bg)';
      document.body.style.color = 'var(--ui-color-text)';
      document.body.style.fontFamily = 'var(--ui-font-family)';
      return story();
    },
  ],
  parameters: {
    // Fail the a11y panel loudly rather than just listing warnings.
    a11y: { test: 'error' },
  },
};

export default preview;
