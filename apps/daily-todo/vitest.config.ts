import { defineConfig, mergeConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import viteConfig from './vite.config.js';

// Two projects. Pure logic runs fast in happy-dom. The element tests need
// a real browser: happy-dom has no ElementInternals, and every form
// component from @maxaakre/ui is form-associated.
export default mergeConfig(viteConfig, defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          include: ['src/**/*.test.ts'],
          exclude: ['src/elements.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'elements',
          include: ['src/elements.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
}));
