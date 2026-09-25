---
"@maxaakre/ui": patch
---

Tokens use `light-dark()`, so each semantic colour is written once; `data-theme` now just sets `color-scheme`. Components share one set of fallbacks, one focus ring and one Windows High Contrast rule. No visual change.
