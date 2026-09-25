import { describe, expect, it } from 'vitest';
import { resolveDev } from './dev.js';

describe('resolveDev', () => {
  it('trusts Vite when it says', () => {
    expect(resolveDev(true, () => 'production')).toBe(true);
    expect(resolveDev(false, () => 'development')).toBe(false);
  });

  it('without Vite, follows NODE_ENV (webpack, Rollup with replace)', () => {
    expect(resolveDev(undefined, () => 'production')).toBe(false);
    expect(resolveDev(undefined, () => 'development')).toBe(true);
  });

  it('with neither (a plain browser, where `process` throws), assumes dev', () => {
    expect(resolveDev(undefined, () => { throw new ReferenceError('process is not defined'); })).toBe(true);
    expect(resolveDev(undefined, () => undefined)).toBe(true);
  });
});
