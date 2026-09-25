// tsc only emits JS and .d.ts for .ts files. Copy what it does not handle
// next to it: the CSS tokens and the generated React types.
import { cpSync, globSync } from 'node:fs';

for (const file of [...globSync('src/**/*.css'), 'src/react.d.ts']) {
  cpSync(file, file.replace(/^src/, 'dist'));
}
