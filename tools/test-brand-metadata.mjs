import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {applyBrandHead,shareImage} from './apply-brand-metadata.mjs';
const files=(await readdir('.')).filter(f=>f.endsWith('.html'));
for(const file of files){
 const html=await readFile(file,'utf8');
 assert.equal((html.match(/property="og:image"/g)||[]).length,1,file);
 assert.equal((html.match(/name="twitter:image"/g)||[]).length,1,file);
 assert.ok(html.includes(shareImage),file);
 assert.ok(html.includes('href="/favicon.ico?v=robot-20261005"'),file);
 assert.ok(html.includes('href="/apple-touch-icon.png?v=robot-20261005"'),file);
 assert.equal(applyBrandHead(html),html,`${file}: metadata must be idempotent`);
}
const future=applyBrandHead('<html><head><title>Future page</title></head><body>New content</body></html>');
assert.ok(future.includes(shareImage)&&future.includes('favicon-32x32.png'));
assert.ok(future.includes('<title>Future page</title>')&&future.includes('New content'));
console.log(`Passed robot icons and common share image checks for all ${files.length} pages and a future page.`);
