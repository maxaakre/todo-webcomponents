import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// Real Chromium, not happy-dom: focus, <dialog> and ElementInternals
// behave differently (or not at all) in a simulated DOM.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
