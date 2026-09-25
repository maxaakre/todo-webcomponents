import { defineConfig, defaultClientConditions } from 'vite';

// Resolve @maxaakre/ui to its TypeScript source, not dist/. No library
// build during dev, and edits to a component hot-reload in the app.
// Published consumers never set this condition, so they get dist/.
export default defineConfig({
  resolve: { conditions: ['@maxaakre/source', ...defaultClientConditions] },
});
