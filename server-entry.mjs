import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const root = path.resolve(process.cwd(), 'dist');
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '0.0.0.0';
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent((request.url || '/').split('?')[0]);
  const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const filePath = path.resolve(root, relativePath);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'content-type': 'text/plain; charset=utf-8' });
      response.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }
    response.writeHead(200, { 'content-type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    response.end(data);
  });
});

server.listen(port, host, () => console.log(`PixelCrate server listening on ${host}:${port}`));
