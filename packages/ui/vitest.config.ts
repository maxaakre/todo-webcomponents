import { defineConfig } from 'vitest/config';
import { chromium } from '../../vitest.browser.js';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    browser: chromium,
  },
});
