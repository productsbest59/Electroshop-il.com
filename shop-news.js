import {publishedArticlePages} from './shop-article-url.js';
import {getArticles,articleImageUrl} from './shop-api.js?v=media-webp-1';
import {renderArticleShell} from './shop-articles-shell.js?v=media-webp-1';
import {refreshNewsList} from './shop-news-render.js?v=prerender-1';

renderArticleShell();
const lang=localStorage.getItem('electroshop_language')==='en'?'en':'he';
await refreshNewsList({
 getArticles,getPages:publishedArticlePages,imageUrl:articleImageUrl,lang,
 grid:document.querySelector('#articlesGrid'),status:document.querySelector('#articlesStatus')
});
