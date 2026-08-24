import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const output = path.join(root, process.env.BUILD_OUT_DIR || 'dist');
const publicFiles = [
  'index.html',
  'privacy.html',
  'terms.html',
  '_headers',
  'favicon.svg',
  'robots.txt',
  'sitemap.xml'
];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const file of publicFiles) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}
fs.mkdirSync(path.join(output, '.openai'), { recursive: true });
fs.copyFileSync(path.join(root, '.openai', 'hosting.json'), path.join(output, '.openai', 'hosting.json'));
fs.mkdirSync(path.join(output, 'server'), { recursive: true });
fs.copyFileSync(path.join(root, 'server-entry.mjs'), path.join(output, 'server', 'index.js'));
console.log(`PixelCrate static build ready: ${publicFiles.length} files`);
