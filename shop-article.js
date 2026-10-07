import {getArticleBySlug,articleImageUrl} from './shop-api.js?v=media-webp-1';
import {improveInlineImages} from './shop-image-alt.js';
import {renderArticleShell} from './shop-articles-shell.js?v=media-webp-1';
import {publishedArticlePages,articleHref} from './shop-article-url.js';

renderArticleShell();

const slug=document.body.dataset.articleSlug||new URLSearchParams(location.search).get('article')||'';
let canonical=document.querySelector('link[rel=canonical]');
if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.append(canonical)}
if(!document.body.dataset.articleSlug)canonical.href=`https://electroshop-il.com/shop-article.html?article=${encodeURIComponent(slug)}`;
const view=document.querySelector('#articleView');
const lang=localStorage.getItem('electroshop_language')==='en'?'en':'he';
const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const normalizeArticleHtml=(value,fallbackAlt)=>{const source=String(value||'').trim();if(!source)return'';const probe=document.createElement('div');probe.innerHTML=source;const visible=probe.textContent.trim(),html=/^<(?:p|h[1-6]|table|ul|ol|blockquote|div|figure|img)\b/i.test(visible)?visible:source;return improveInlineImages(html,fallbackAlt,lang)};

try{
 const article=await getArticleBySlug(slug);
 if(!article)throw new Error();
 const title=article[`title_${lang}`]||article.title_he;
 const content=normalizeArticleHtml(article[`content_${lang}`]||article.content_he||'',title);
 const description=article[`seo_description_${lang}`]||article[`excerpt_${lang}`]||article.excerpt_he;
 const seoTitle=article[`seo_title_${lang}`]||`${title} | אלקטרושופ`;
 const pages=await publishedArticlePages();
 const url=document.body.dataset.articleSlug?`https://electroshop-il.com${location.pathname}`:`https://electroshop-il.com/${articleHref(article.slug,pages)}`;
 const copyrightNotice=lang==='en'
  ? '© All rights reserved by Electroshop. The article, any part of it, and its images may not be copied, reproduced, published, distributed or used without prior written permission.'
  : '© כל הזכויות שמורות לאלקטרושופ. אין להעתיק, לשכפל, לפרסם, להפיץ או לעשות שימוש בכתבה, בחלקים ממנה או בתמונות שבה ללא אישור מראש ובכתב.';

 document.title=seoTitle;
 document.querySelector('meta[name=description]').content=description;
 document.querySelector('link[rel=canonical]').href=url;
 document.querySelector('#crumbTitle').textContent=title;
 view.innerHTML=`<header class="article-head">${article.cover_path?`<img class="article-cover" fetchpriority="high" decoding="async" src="${esc(articleImageUrl(article.cover_path))}" alt="${esc(article[`cover_alt_${lang}`]||title)}">`:''}<h1>${esc(title)}</h1>${article.published_at?`<p class="article-date">${new Intl.DateTimeFormat(lang==='he'?'he-IL':'en-US',{dateStyle:'long'}).format(new Date(article.published_at))}</p>`:''}</header><div class="article-content">${content}</div>${content.includes(copyrightNotice)?'':`<p class="article-copyright">${esc(copyrightNotice)}</p>`}<a class="article-back-link" href="shop-news.html">${lang==='en'?'← Back to News & Guides':'→ חזרה לחדשות ומדריכים'}</a>`;

 const schema=document.querySelector('#articleSchema')||document.createElement('script');
 schema.id='articleSchema';
 schema.type='application/ld+json';
 schema.textContent=JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:title,description,url,datePublished:article.published_at,dateModified:article.updated_at,image:article.cover_path?articleImageUrl(article.cover_path):undefined,publisher:{'@type':'Organization',name:'Electroshop',url:'https://electroshop-il.com'}});
 document.head.append(schema);
}catch{
 if(document.body.dataset.prerendered==='true'){
  console.warn('Live article unavailable; keeping the published article.');
 }else{
 view.innerHTML='<h1>הכתבה לא נמצאה</h1><p><a href="shop-news.html">חזרה לכל הכתבות</a></p>';
 document.title='הכתבה לא נמצאה | אלקטרושופ';
 const robots=document.querySelector('meta[name=robots]');if(robots)robots.content='noindex,follow';
 }
}
