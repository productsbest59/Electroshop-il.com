// Shared by the browser and the static article generator.
export function articlePage(slug){return `article-${encodeURIComponent(slug).replaceAll('%','_')}.html`}
export async function publishedArticlePages(){
 try{const response=await fetch('shop-article-pages.json',{cache:'no-cache'});if(!response.ok)return {};return await response.json()}catch{return {}}
}
export function articleHref(slug,pages){return pages[slug]||`shop-article.html?article=${encodeURIComponent(slug)}`}
