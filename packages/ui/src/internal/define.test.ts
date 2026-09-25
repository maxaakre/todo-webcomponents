import { describe, expect, it, vi } from 'vitest';
import { customElement } from './define.js';

describe('customElement (guarded define)', () => {
  it('registers a new tag', () => {
    class Fresh extends HTMLElement {}
    customElement('ui-test-fresh')(Fresh);
    expect(customElements.get('ui-test-fresh')).toBe(Fresh);
  });

  it('does not throw when the tag is already taken, and keeps the first class', () => {
    // Two copies of the library on one page (micro-frontends, mismatched
    // versions) would otherwise crash on the second define().
    class First extends HTMLElement {}
    class Second extends HTMLElement {}
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    customElement('ui-test-twice')(First);
    expect(() => customElement('ui-test-twice')(Second)).not.toThrow();
    expect(customElements.get('ui-test-twice')).toBe(First);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ui-test-twice'));
    warn.mockRestore();
  });
});
