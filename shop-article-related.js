import {articleHref} from './shop-article-url.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Shared by static generation and live refresh; never include drafts or self-links.
export function renderRelatedArticles(articles,currentSlug,pages={},lang='he'){
 const seen=new Set(),items=articles.filter(article=>{
  if(article.status!=='published'||!article.slug||article.slug===currentSlug||seen.has(article.slug))return false;
  seen.add(article.slug);return true;
 });
 if(!items.length)return '';
 return `<nav class="article-related" aria-labelledby="relatedArticlesTitle"><h2 id="relatedArticlesTitle">${lang==='en'?'More articles':'כתבות נוספות'}</h2><ul>${items.map(article=>`<li><a href="${esc(articleHref(article.slug,pages))}">${esc(article[`title_${lang}`]||article.title_he||article.slug)}</a></li>`).join('')}</ul></nav>`;
}

export async function refreshRelatedArticles(view,currentSlug,lang,loadArticles,loadPages){
 try{
  const [articles,pages]=await Promise.all([loadArticles(),loadPages()]);
  const html=renderRelatedArticles(articles,currentSlug,pages,lang),existing=view.querySelector('.article-related');
  if(existing){if(html)existing.outerHTML=html;else existing.remove()}
  else if(html){const back=view.querySelector('.article-back-link');if(back)back.insertAdjacentHTML('beforebegin',html);else view.insertAdjacentHTML('beforeend',html)}
 }catch{ /* Keep prerendered links when the live list is unavailable. */ }
}
