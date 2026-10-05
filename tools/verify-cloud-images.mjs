import {readFile} from 'node:fs/promises';
import {getProducts,getArticles,articleImageUrl} from '../shop-api.js';
const report=JSON.parse(await readFile(process.argv[2],'utf8'));
const products=await getProducts(),articles=await getArticles(),urls=new Set();
for(const product of products)for(const image of product.images||[])if(typeof image==='string'&&image.includes('.optimized.webp'))urls.add(image);
for(const article of articles){if(article.cover_path?.includes('.optimized.webp'))urls.add(articleImageUrl(article.cover_path));for(const match of (article.content_he+' '+article.content_en).matchAll(/\bsrc=["']([^"']+\.optimized\.webp[^"']*)["']/g))urls.add(match[1].replace(/&amp;/g,'&'))}
for(const upload of report.uploads)urls.add(`https://ejzwceuoxzwtpkoovoma.supabase.co/storage/v1/object/public/${upload.bucket}/${upload.destination}`);
const failed=[];
for(const url of urls){let response;for(let retry=0;retry<4;retry++){response=await fetch(url,{method:'HEAD'});if(response.ok||![429,502,503,504].includes(response.status))break;await new Promise(resolve=>setTimeout(resolve,1000*2**retry))}if(!response.ok||!response.headers.get('content-type')?.includes('image/webp'))failed.push({url,status:response.status})}
console.log(JSON.stringify({products:products.length,articles:articles.length,verifiedCloudImages:urls.size,failed}));
if(failed.length)process.exitCode=1;
