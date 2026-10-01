import {articleImageUrl} from './shop-api.js';
import {renderArticleShell} from './shop-articles-shell.js?v=5';
renderArticleShell();
const view=document.querySelector('#articleView'),lang=localStorage.getItem('electroshop_language')==='en'?'en':'he';
const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
try{
 const article=JSON.parse(localStorage.getItem('electroshop_article_preview')||'null');if(!article)throw new Error('missing preview');
 const title=article[`title_${lang}`]||article.title_he||'תצוגה מקדימה',content=article[`content_${lang}`]||article.content_he||'',cover=article.cover_path?articleImageUrl(article.cover_path):'';
 document.title=`${title} | תצוגה מקדימה`;
 view.innerHTML=`<div class="article-preview-badge">טיוטה - תצוגה מקדימה בלבד</div><header class="article-head">${cover?`<img class="article-cover" src="${esc(cover)}" alt="${esc(article[`cover_alt_${lang}`]||title)}">`:''}<h1>${esc(title)}</h1></header><div class="article-content">${content}</div>`;
}catch{view.innerHTML='<h1>אין טיוטה להצגה</h1><p><a href="shop-articles-admin.html">חזרה לעורך</a></p>'}
