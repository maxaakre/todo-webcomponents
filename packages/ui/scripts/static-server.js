// A tiny static file server for local checks. Bound to 127.0.0.1, and it
// refuses any path outside its root folder.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

/** Serve `dir` on a free port. Resolves to { url, close }. */
export async function serve(dir) {
  const root = resolve(dir);
  const server = createServer((req, res) => {
    let path;
    try {
      path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    } catch {
      return res.writeHead(400).end(); // malformed %-encoding
    }
    // URL parsing removes a plain ../ but not an encoded one (..%2f), which
    // decodeURIComponent turns back into ../. Refuse anything outside root.
    if (path !== root && !path.startsWith(root + sep)) return res.writeHead(403).end();
    const file = existsSync(path) && statSync(path).isFile() ? path : join(path, 'index.html');
    if (!existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); // this machine only
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => server.close(),
  };
}
