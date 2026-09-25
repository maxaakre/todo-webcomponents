import { render, type TemplateResult } from 'lit';
import { afterEach } from 'vitest';

const mounted: HTMLElement[] = [];

/** Render a template into the page, wait for Lit, return the first element. */
export async function fixture<T extends Element>(template: TemplateResult): Promise<T> {
  const host = document.createElement('div');
  document.body.append(host);
  mounted.push(host);
  render(template, host);
  const el = host.firstElementChild as T;
  await (el as unknown as { updateComplete?: Promise<unknown> }).updateComplete;
  return el;
}

afterEach(() => {
  for (const host of mounted.splice(0)) host.remove();
});
