import {readFile,writeFile} from 'node:fs/promises';
import {config} from '../shop-config.js';
import {renderNewsCards} from '../shop-news-render.js';

export function renderNewsPage(source,articles,pages){
 const imageUrl=path=>/^https?:\/\//i.test(path)?path:`${config.supabaseUrl}/storage/v1/object/public/electroshop-article-images/${path}`;
 const cards=renderNewsCards(articles,pages,imageUrl);
 const status=cards?'':'כתבות חדשות יפורסמו כאן בקרוב.';
 const block=`<!-- NEWS_LIST_START --><div id="articlesGrid" class="articles-grid" aria-live="polite" data-prerendered="true">${cards}</div><p id="articlesStatus" role="status">${status}</p><!-- NEWS_LIST_END -->`;
 const marker=/<!-- NEWS_LIST_START -->[\s\S]*?<!-- NEWS_LIST_END -->/;
 const original=/<div id="articlesGrid" class="articles-grid" aria-live="polite"><\/div><p id="articlesStatus" role="status"><\/p>/;
 if(marker.test(source))return source.replace(marker,()=>block);
 if(original.test(source))return source.replace(original,()=>block);
 throw new Error('News list insertion point not found; refusing to overwrite the page.');
}
export async function generateNewsPage(articles,pages){
 const source=await readFile('shop-news.html','utf8');
 await writeFile('shop-news.html',renderNewsPage(source,articles,pages),'utf8');
 console.log(`Prebuilt news list with ${Object.keys(pages).length} published articles.`);
}
