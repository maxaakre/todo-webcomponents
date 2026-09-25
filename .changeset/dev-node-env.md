---
"@maxaakre/ui": patch
---

Dev-only warnings are now silent in webpack and Rollup production builds too: `process.env.NODE_ENV` is read (literally, so bundlers can replace it) when `import.meta.env` is not available.
