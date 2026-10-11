import {articleHref} from './shop-article-url.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const timestamp=value=>value?Date.parse(value)||0:0;
// Excerpts sometimes contain pasted editorial labels after the public summary.
// Match explicit labels only, not ordinary advice containing words like "recommended".
export function cleanNewsExcerpt(value){
 const text=String(value??'');
 const editorial=/(?:^|\s)(?:#{1,6}\s*)?(?:H[1-6]\s+(?:מומלץ|מומלצת|מוצע|מוצעת)|(?:Recommended|Suggested)\s+H[1-6]|(?:כותרת|תיאור)\s+(?:SEO\s+)?(?:מומלץ|מומלצת|מוצע|מוצעת)|(?:SEO|Meta)\s+(?:title|description)|הוראות\s+עריכה|הערות\s+לעורך|Editorial\s+notes|Editor\s+instructions)\s*[:：]/i;
 const marker=editorial.exec(text);
 return (marker?text.slice(0,marker.index):text).trim();
}
export function publishedNewsArticles(articles){
 return articles.filter(a=>a.status==='published').slice().sort((a,b)=>
  (Number(a.sort_order)||0)-(Number(b.sort_order)||0)||
  timestamp(b.published_at)-timestamp(a.published_at)||
  timestamp(b.created_at)-timestamp(a.created_at)||String(a.slug).localeCompare(String(b.slug)));
}
export function renderNewsCards(articles,pages,imageUrl,lang='he'){
 return publishedNewsArticles(articles).map(a=>{
  const title=a[`title_${lang}`]||a.title_he,excerpt=cleanNewsExcerpt(a[`excerpt_${lang}`]||a.excerpt_he);
  return `<a class="article-card${a.cover_path?'':' no-cover'}" href="${esc(articleHref(a.slug,pages))}">${a.cover_path?`<img src="${esc(imageUrl(a.cover_path))}" alt="${esc(a[`cover_alt_${lang}`]||title)}" loading="lazy" decoding="async">`:''}<div class="article-card-body"><h2>${esc(title)}</h2><p>${esc(excerpt)}</p><strong>${lang==='en'?'Read article →':'לקריאת הכתבה ←'}</strong></div></a>`;
 }).join('');
}
export async function refreshNewsList({getArticles,getPages,imageUrl,grid,status,lang='he'}){
 try{
  const [articles,pages]=await Promise.all([getArticles(),getPages()]);
  const cards=renderNewsCards(articles,pages,imageUrl,lang);
  grid.innerHTML=cards;
  status.textContent=cards?'':lang==='en'?'Articles will be published here soon.':'כתבות חדשות יפורסמו כאן בקרוב.';
 }catch{
  // A failed live refresh must never hide the usable, prebuilt article list.
  status.textContent=grid.querySelector('a.article-card')?'':lang==='en'?'Articles could not be loaded right now.':'לא ניתן לטעון כרגע את הכתבות.';
 }
}
