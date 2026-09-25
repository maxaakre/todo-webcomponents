import { describe, expect, it, vi } from 'vitest';
import { warnOnce } from './warn.js';

describe('warnOnce', () => {
  it('warns once per element and message', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const a = document.createElement('div');
    const b = document.createElement('div');
    warnOnce(a, 'no name');
    warnOnce(a, 'no name');
    warnOnce(a, 'no label');
    warnOnce(b, 'no name');
    expect(warn.mock.calls).toEqual([['no name', a], ['no label', a], ['no name', b]]);
    warn.mockRestore();
  });
});
