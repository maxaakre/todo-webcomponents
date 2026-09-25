// tsc only emits JS. Copy the plain CSS files (tokens) next to it.
import { cpSync, globSync } from 'node:fs';

for (const file of globSync('src/**/*.css')) {
  cpSync(file, file.replace(/^src/, 'dist'));
}
