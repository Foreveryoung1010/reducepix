import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const output = path.join(root, 'dist');
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
fs.cpSync(path.join(root, '.openai'), path.join(output, '.openai'), { recursive: true });
console.log(`PixelCrate static build ready: ${publicFiles.length} files`);
