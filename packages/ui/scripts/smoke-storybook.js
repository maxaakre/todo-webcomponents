// Open every story in the *built* Storybook and check that each ui-* tag
// on the page is a defined custom element. Catches what unit tests cannot:
// a production bundle that tree-shook a component away (see sideEffects).
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const root = 'storybook-static';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = createServer((req, res) => {
  const path = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const file = existsSync(path) && !path.endsWith('/') ? path : join(path, 'index.html');
  if (!existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const { entries } = JSON.parse(readFileSync(join(root, 'index.json'), 'utf8'));
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
server.close();

if (failures.length) {
  console.error(`Undefined elements in ${failures.length} stories:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log(`✓ ${stories.length} stories, every ui-* element defined`);
