import { playwright } from '@vitest/browser-playwright';

/**
 * Real headless Chromium, shared by every package's browser tests.
 *
 * Not happy-dom: focus, <dialog>, ElementInternals and form association
 * behave differently, or not at all, in a simulated DOM.
 */
export const chromium = {
  enabled: true,
  provider: playwright(),
  headless: true,
  instances: [{ browser: 'chromium' as const }],
};
