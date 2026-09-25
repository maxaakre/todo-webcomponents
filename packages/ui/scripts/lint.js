// lit-analyzer has no exclude option. Lint shipped components and stories,
// not tests: its bundled TypeScript cannot see that a vi.fn() is callable.
import { globSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const files = globSync('src/**/ui-*.ts').filter((f) => !f.endsWith('.test.ts'));
// no-invalid-css is off: its property list is from before accent-color
// (Baseline since 2022) and flags valid CSS.
// --strict goes last: placed first, it takes the next file as its value.
try {
  execFileSync('lit-analyzer', [...files, '--rules.no-invalid-css', 'off', '--strict'], { stdio: 'inherit' });
} catch {
  process.exit(1); // lit-analyzer already printed the problems
}
