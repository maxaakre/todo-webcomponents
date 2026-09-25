// Open every story in the *built* Storybook and check that each ui-* tag
// on the page is a defined custom element. Catches what unit tests cannot:
// a production bundle that tree-shook a component away (see sideEffects).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { serve } from './static-server.js';

// SMOKE_URL checks a deployed Storybook instead of the local build.
const root = 'storybook-static';
const server = process.env.SMOKE_URL ? null : await serve(root);
const base = process.env.SMOKE_URL ?? server.url;

const { entries } = process.env.SMOKE_URL
  ? await (await fetch(`${base}/index.json`)).json()
  : JSON.parse(readFileSync(join(root, 'index.json'), 'utf8'));
const stories = Object.values(entries).filter((e) => e.type === 'story');

const browser = await chromium.launch();
const page = await browser.newPage();
const failures = [];
for (const { id } of stories) {
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`);
  await page.waitForLoadState('networkidle');
  const undefinedTags = await page.evaluate(() =>
    [...new Set([...document.querySelectorAll('#storybook-root *')]
      .map((el) => el.localName).filter((t) => t.startsWith('ui-') && !customElements.get(t)))]);
  if (undefinedTags.length) failures.push(`${id}: ${undefinedTags.join(', ')} not defined`);
}
await browser.close();
server?.close();

if (failures.length) {
  console.error(`Undefined elements in ${failures.length} stories:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log(`✓ ${stories.length} stories, every ui-* element defined`);
