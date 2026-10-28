import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, relative } from 'node:path';

const root = resolve('.output/public');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
let workerVersion = 1;
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/__test/new-worker' && request.method === 'POST') { workerVersion++; response.writeHead(204).end(); return; }
    const target = resolve(root, '.' + pathname);
    if (relative(root, target).startsWith('..')) { response.writeHead(403).end(); return; }
    let file = target;
    let body;
    try { body = await readFile(file); }
    catch {
      if (extname(pathname)) { response.writeHead(404).end(); return; }
      file = resolve(root, 'index.html'); body = await readFile(file);
    }
    if (pathname === '/sw.js') body = Buffer.concat([body, Buffer.from(`\n// test build ${workerVersion}\n`)]);
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(body);
  } catch { response.writeHead(500).end(); }
}).listen(4173, '127.0.0.1');
