---
"@maxaakre/ui": patch
---

`ui-dialog` no longer closes when a click inside it bubbles past an ancestor that has `data-dialog-close`. All elements now skip registration, with a dev warning, when their tag is already defined, so two copies of the library on one page no longer crash it.
