import {articleImageUrl} from './shop-api.js';
import {renderArticleShell} from './shop-articles-shell.js?v=5';
renderArticleShell();
const view=document.querySelector('#articleView'),lang=localStorage.getItem('electroshop_language')==='en'?'en':'he';
const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const normalizeArticleHtml=value=>{const source=String(value||'').trim();if(!source)return'';const probe=document.createElement('div');probe.innerHTML=source;const visible=probe.textContent.trim();return /^<(?:p|h[1-6]|table|ul|ol|blockquote|div|figure|img)\b/i.test(visible)?visible:source};
try{
 const article=JSON.parse(localStorage.getItem('electroshop_article_preview')||'null');if(!article)throw new Error('missing preview');
 const title=article[`title_${lang}`]||article.title_he||'תצוגה מקדימה',content=normalizeArticleHtml(article[`content_${lang}`]||article.content_he||''),cover=article.cover_path?articleImageUrl(article.cover_path):'';
 const copyrightNotice=lang==='en'
  ? '© All rights reserved by Electroshop. The article, any part of it, and its images may not be copied, reproduced, published, distributed or used without prior written permission.'
  : '© כל הזכויות שמורות לאלקטרושופ. אין להעתיק, לשכפל, לפרסם, להפיץ או לעשות שימוש בכתבה, בחלקים ממנה או בתמונות שבה ללא אישור מראש ובכתב.';
 document.title=`${title} | תצוגה מקדימה`;
 view.innerHTML=`<div class="article-preview-badge">טיוטה - תצוגה מקדימה בלבד</div><header class="article-head">${cover?`<img class="article-cover" src="${esc(cover)}" alt="${esc(article[`cover_alt_${lang}`]||title)}">`:''}<h1>${esc(title)}</h1></header><div class="article-content">${content}</div>${content.includes(copyrightNotice)?'':`<p class="article-copyright">${esc(copyrightNotice)}</p>`}<a class="article-back-link" href="shop-news.html">${lang==='en'?'← Back to News & Guides':'→ חזרה לחדשות ומדריכים'}</a>`;
}catch{view.innerHTML='<h1>אין טיוטה להצגה</h1><p><a href="shop-articles-admin.html">חזרה לעורך</a></p>'}
