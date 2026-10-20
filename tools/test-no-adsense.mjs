import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
const files=(await readdir('.')).filter(name=>/\.(html|js|mjs|json|txt)$/.test(name));
files.push('tools/build-cellular-pages.mjs');
for(const file of files){
  const source=await readFile(file,'utf8');
  assert(!/google-adsense-account|adsbygoogle|pub-1309654214103822|pagead2\.googlesyndication|<section id="advertising">|myadcenter\.google\.com|optout\.aboutads\.info/i.test(source),`Unexpected AdSense code/disclosure in ${file}`);
}
await assert.rejects(access('ads.txt'));
assert((await readFile('index.html','utf8')).includes("gtag('config', 'G-9FPHS99LPV')"),'Preserve homepage inline Analytics');
for(const file of ['cellular-plans.html','cellular-019.html','cellular-partner.html','cellular-pelephone.html'])assert((await readFile(file,'utf8')).includes('shop-ga4.js'),`${file}: preserve Analytics`);
console.log('PASS: no AdSense account tags, ad loader, seller authorization or advertising disclosures; Analytics retained.');
