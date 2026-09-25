import { DEV } from './dev.js';

/**
 * Like Lit's `@customElement`, but safe to run twice for the same tag.
 *
 * `customElements.define` throws if a tag is taken, and the registry is
 * global to the page. Two copies of this library (micro-frontends, two
 * versions in one bundle) would crash the page on load. Here the first
 * definition wins and the second is skipped, with a warning in dev.
 *
 * Named `customElement` on purpose: the manifest analyzer finds tag names
 * by that decorator name.
 */
export const customElement = (tag: string) => (cls: CustomElementConstructor) => {
  if (customElements.get(tag)) {
    if (DEV) console.warn(`<${tag}> is already defined; skipping. Is @maxaakre/ui loaded twice?`);
    return;
  }
  customElements.define(tag, cls);
};
