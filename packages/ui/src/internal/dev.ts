/**
 * True unless the consumer's bundler says this is a production build.
 *
 * Two ways a bundler can say so:
 * - Vite: `import.meta.env.DEV`. Undefined elsewhere, so read with `?.`.
 * - webpack, Rollup and others: `process.env.NODE_ENV`, but only when
 *   written literally like that, because they replace the text at build
 *   time. `globalThis.process?.env` would never be replaced. In a plain
 *   browser, `process` does not exist and the read throws.
 *
 * Neither available means dev: a warning too many beats a silent a11y bug.
 */
export function resolveDev(viteDev: boolean | undefined, readNodeEnv: () => string | undefined): boolean {
  if (viteDev !== undefined) return viteDev;
  try {
    const env = readNodeEnv();
    return env === undefined ? true : env !== 'production';
  } catch {
    return true;
  }
}

declare const process: { env: { NODE_ENV?: string } };

export const DEV: boolean = resolveDev(
  (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV,
  () => process.env.NODE_ENV,
);
