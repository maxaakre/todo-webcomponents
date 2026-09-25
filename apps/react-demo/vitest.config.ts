import { defineConfig, mergeConfig } from 'vitest/config';
import { chromium } from '../../vitest.browser.js';
import viteConfig from './vite.config.js';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    include: ['src/**/*.test.tsx'],
    browser: chromium,
  },
}));
