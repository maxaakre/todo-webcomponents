import type { StorybookConfig } from '@storybook/web-components-vite';
import remarkGfm from 'remark-gfm';

const config: StorybookConfig = {
  framework: '@storybook/web-components-vite',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.ts'],
  addons: [
    // MDX has no tables without GitHub-flavoured Markdown.
    { name: '@storybook/addon-docs', options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } } },
    '@storybook/addon-a11y',
  ],
  core: { disableTelemetry: true },
};

export default config;
