import {readdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

const origin='https://electroshop-il.com';
const supabase='https://ejzwceuoxzwtpkoovoma.supabase.co';
const apiKey='sb_publishable_Kry0TasR3z09TPvXzeI3dA_xryw8shH';
const fixedCategoryPages=new Map([
  ['mobile','shop-mobile.html'],['pro-audio','shop-pro-audio.html'],['car-mounts','shop-car-mounts.html'],
  ['chargers-cables','shop-chargers-cables.html'],['guitars','shop-guitars.html'],['earphones','shop-earphones.html'],
  ['speakers','shop-speakers.html'],['batteries','shop-batteries.html'],['signs','shop-signs.html']
]);
const excluded=new Set(['shop-admin.html','shop-articles-admin.html','shop-product-editor.html','shop-orders.html','shop-login.html','shop-account-setup.html','shop-checkout.html','shop-payment-success.html','bit-payment.html','shop-category.html','shop-article.html','shop-article-preview.html']);
const headers={apikey:apiKey,Authorization:`Bearer ${apiKey}`};
const staticSeo=new Map([
  ['imei-check.html',{changefreq:'weekly',priority:'0.8'}]
]);
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const date=value=>value?new Date(value).toISOString().slice(0,10):'';
const entry=({loc,lastmod,changefreq,priority})=>`  <url><loc>${xml(loc)}</loc>${lastmod?`<lastmod>${lastmod}</lastmod>`:''}${changefreq?`<changefreq>${changefreq}</changefreq>`:''}${priority?`<priority>${priority}</priority>`:''}</url>`;

async function rows(table,query){const response=await fetch(`${supabase}/rest/v1/${table}?${query}`,{headers});if(!response.ok)throw new Error(`${table}: ${response.status} ${await response.text()}`);return response.json()}
function gitDate(file){try{return execFileSync('git',['log','-1','--format=%cs','--',file],{encoding:'utf8'}).trim()}catch{return ''}}

const htmlFiles=(await readdir('.')).filter(name=>name.endsWith('.html')&&!excluded.has(name));
const staticUrls=htmlFiles.map(file=>{const seo=staticSeo.get(file);return{loc:file==='index.html'?`${origin}/`:`${origin}/${file}`,lastmod:gitDate(file),changefreq:seo?.changefreq||(file==='index.html'?'weekly':'monthly'),priority:seo?.priority||(file==='index.html'?'1.0':file==='shop.html'?'0.9':'0.6')}});
const [categories,articles]=await Promise.all([
  rows('electroshop_categories','select=*&active=eq.true&order=sort_order.asc'),
  rows('electroshop_articles','select=slug,updated_at,published_at&status=eq.published&order=sort_order.asc,published_at.desc.nullslast')
]);
const categoryUrls=categories.map(category=>({loc:fixedCategoryPages.has(category.slug)?`${origin}/${fixedCategoryPages.get(category.slug)}`:`${origin}/shop-category.html?category=${encodeURIComponent(category.slug)}`,lastmod:date(category.updated_at),changefreq:'weekly',priority:'0.8'}));
const articleUrls=articles.map(article=>({loc:`${origin}/shop-article.html?article=${encodeURIComponent(article.slug)}`,lastmod:date(article.updated_at||article.published_at),changefreq:'monthly',priority:'0.7'}));
const unique=new Map();for(const item of [...staticUrls,...categoryUrls,{loc:`${origin}/shop-news.html`,changefreq:'weekly',priority:'0.8'},...articleUrls])unique.set(item.loc,item);
const output=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...unique.values()].sort((a,b)=>a.loc.localeCompare(b.loc)).map(entry).join('\n')}\n</urlset>\n`;
await writeFile('sitemap.xml',output,'utf8');
console.log(`Generated sitemap.xml with ${unique.size} URLs: ${staticUrls.length} static, ${categoryUrls.length} categories, ${articleUrls.length} articles.`);
