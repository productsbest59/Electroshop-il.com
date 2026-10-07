import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {articleHtml} from './generate-article-pages.mjs';
import {articlePage,articleHref} from '../shop-article-url.js';

const pages=JSON.parse(await readFile('shop-article-pages.json','utf8'));
const sitemap=await readFile('sitemap.xml','utf8');
assert(Object.keys(pages).length>0);
for(const [slug,file] of Object.entries(pages)){
 const html=await readFile(file,'utf8'),url=`https://electroshop-il.com/${file}`;
 assert.equal(file,articlePage(slug));
 assert.equal((html.match(/rel="canonical"/g)||[]).length,1,file);
 assert(html.includes(`rel="canonical" href="${url}"`),file);
 assert(html.includes(`data-article-slug="${slug}"`),file);
 assert(html.includes('<div class="article-content">')&&!html.includes('טוען את הכתבה'),file);
 assert(html.includes('<h1>'),file);
 assert(html.includes('shop-article.js?v=canonical-2'),file);
 assert(html.includes('favicon.ico')&&html.includes('og:image'),file);
 const schema=JSON.parse(html.match(/id="articleSchema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema.url,url);assert.equal(schema.mainEntityOfPage,url);
 assert(sitemap.includes(`<loc>${url}</loc>`),file);
 assert.equal(articleHref(slug,pages),file);
}
assert(!sitemap.includes('shop-article.html?article='));
assert(!(await readFile('shop-article.html','utf8')).includes('rel="canonical" href="https://electroshop-il.com/shop-article.html"'));
assert.equal(articleHref('future-article',pages),'shop-article.html?article=future-article');
assert.equal(articleHtml('&lt;p&gt;שלום&lt;/p&gt;','test'),'<p>שלום</p>');
assert.equal(articleHtml('<p style="text-align: center">שלום <strong>עולם</strong></p>','test'),'<p style="text-align: center">שלום <strong>עולם</strong></p>');
const malicious=articleHtml('<script>alert(1)</script><img src="javascript:alert(1)" onerror="alert(2)"><a href="&#106;avascript:alert(1)">x</a>','test');
assert(!/script|onerror|javascript|&#106;/i.test(malicious));
assert(!articlePage('../escape').includes('/'));
console.log(`PASS: ${Object.keys(pages).length} unique article pages, sitemap, branding, legacy/future links and safe formatting.`);
