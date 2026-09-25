import { defineConfig, defaultClientConditions } from 'vite';
import react from '@vitejs/plugin-react';

// Same source condition as apps/daily-todo: use the library's TypeScript
// directly, so there is no library build step in dev.
export default defineConfig({
  plugins: [react()],
  resolve: { conditions: ['@maxaakre/source', ...defaultClientConditions] },
});
