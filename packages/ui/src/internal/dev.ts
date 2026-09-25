/**
 * True unless the consumer's bundler says this is a production build.
 *
 * `import.meta.env` is a Vite feature. In webpack, Rollup or a plain
 * browser it is undefined, so reading `.DEV` directly would throw.
 * Unknown means dev: a warning too many beats a silent a11y bug.
 */
export const DEV: boolean =
  (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV ?? true;
