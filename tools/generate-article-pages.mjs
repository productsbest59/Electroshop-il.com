import {readFile,writeFile,unlink} from 'node:fs/promises';
import {config} from '../shop-config.js';
import {articlePage} from '../shop-article-url.js';
import {improveInlineImages} from '../shop-image-alt.js';

const origin='https://electroshop-il.com';
const esc=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Only editor formatting is allowed in prerendered content, never executable markup.
export function articleHtml(value,title){
 let html=String(value||'');
 if(/^\s*&lt;(?:p|h[1-6]|table|ul|ol|blockquote|div|figure|img)\b/i.test(html))html=html.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
 html=html.replace(/<(script|style|iframe|object|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
 const allowed=new Set('p div span h1 h2 h3 h4 h5 h6 br hr strong b em i u s ul ol li blockquote table thead tbody tfoot tr td th a img figure figcaption pre code sub sup'.split(' '));
 html=html.replace(/<!--[\s\S]*?-->|<\/?([a-z][\w:-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi,(tag,name)=>{
  name=name?.toLowerCase();if(!allowed.has(name))return '';
  if(tag.startsWith('</'))return `</${name}>`;
  let attrs='';
  for(const match of tag.matchAll(/\s([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)){
   const key=match[1].toLowerCase(),value=match[2]??match[3]??match[4];
   if(!['class','style','title','alt','src','href','width','height','colspan','rowspan','dir'].includes(key))continue;
   if(['src','href'].includes(key)&&! /^(https?:\/\/|\/[^/]|[a-z0-9_.-]+(?:\/|\.html|\.webp|\.png|\.jpg)|#)/i.test(value))continue;
   if(key==='style'&&/url|expression|@|\\|&/i.test(value))continue;
   attrs+=` ${key}="${esc(value.replace(/&amp;/g,'&'))}"`;
  }
  return `<${name}${attrs}>`;
 });
 return improveInlineImages(html,title,'he');
}
export async function generateArticlePages(){
 const response=await fetch(`${config.supabaseUrl}/rest/v1/electroshop_articles?select=*&status=eq.published&order=slug.asc`,{headers:{apikey:config.publishableKey,Authorization:`Bearer ${config.publishableKey}`}});
 if(!response.ok)throw new Error(`Cannot generate articles: ${response.status}`);
 const articles=await response.json(),template=await readFile('shop-article.html','utf8'),pages={};
 let previous={};try{previous=JSON.parse(await readFile('shop-article-pages.json','utf8'))}catch{}
 for(const article of articles){
  const file=articlePage(article.slug),url=`${origin}/${file}`,title=article.title_he,description=article.seo_description_he||article.excerpt_he||title;
  const image=article.cover_path?(/^https?:/.test(article.cover_path)?article.cover_path:`${config.supabaseUrl}/storage/v1/object/public/electroshop-article-images/${article.cover_path}`):'';
  const schema={'@context':'https://schema.org','@type':'Article',headline:title,description,url,mainEntityOfPage:url,datePublished:article.published_at,dateModified:article.updated_at,publisher:{'@type':'Organization',name:'Electroshop',url:origin}};
  if(image)schema.image=image;
  let html=template.replace(/<title>.*?<\/title>/,`<title>${esc(article.seo_title_he||`${title} | אלקטרושופ`)}</title>`)
   .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${esc(description)}">`)
   .replace('<!-- ARTICLE_CANONICAL -->',`<link rel="canonical" href="${esc(url)}"><meta property="og:url" content="${esc(url)}"><meta property="og:title" content="${esc(title)}"><script id="articleSchema" type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`)
   .replace('<body ',`<body data-article-slug="${esc(article.slug)}" data-prerendered="true" `)
   .replace('<span id="crumbTitle">כתבה</span>',`<span id="crumbTitle">${esc(title)}</span>`)
   .replace('<p>טוען את הכתבה...</p>',`<header class="article-head">${image?`<img class="article-cover" src="${esc(image)}" alt="${esc(article.cover_alt_he||title)}" fetchpriority="high" decoding="async">`:''}<h1>${esc(title)}</h1></header><div class="article-content">${articleHtml(article.content_he,title)}</div><a class="article-back-link" href="shop-news.html">→ חזרה לחדשות ומדריכים</a>`);
  await writeFile(file,html,'utf8');pages[article.slug]=file;
 }
 // Remove only files previously created by this generator when an article is withdrawn.
 for(const [slug,file] of Object.entries(previous))if(!pages[slug]&&file===articlePage(slug)&&/^article-[^/\\]+\.html$/.test(file)){
  const html=await readFile(file,'utf8').catch(()=> '');if(html.includes('data-prerendered="true"'))await unlink(file);
 }
 await writeFile('shop-article-pages.json',JSON.stringify(pages,null,2)+'\n');
 console.log(`Generated ${articles.length} published article pages.`);
 return articles;
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/generate-article-pages.mjs'))await generateArticlePages();
