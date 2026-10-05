// Mechanical reference / attribute updates, preserving all page layouts.
import fs from 'node:fs';
import {localImageMap} from '../shop-local-image-map.js';
const root=new URL('../',import.meta.url);
const scripts=['shop-admin.js','shop-api.js','shop-categories.js','shop-article.js','shop-news.js','shop-articles-shell.js','shop-articles-admin.js','shop-store.js','shop-theme.css'];
const altNames={
 'chargers-cables-banner.webp':'מטענים וכבלים לסלולר באלקטרושופ',
 'earphones-banner.webp':'אוזניות ואביזרי שמע באלקטרושופ',
 'mobile-accessories-banner.webp':'אביזרים לטלפונים סלולריים באלקטרושופ',
 'shop-categories-banner.webp':'בחירת קטגוריה בחנות אלקטרושופ',
 'problemheb.webp':'CarHold Pro – פתרון להחזקת הטלפון ברכב',
 'heb01.webp':'תושבת CarHold Pro לטלפון ברכב'
};
for(const file of fs.readdirSync(root).filter(f=>/\.(html|js)$/.test(f)&&f!=='shop-local-image-map.js')){
 const url=new URL(file,root),before=fs.readFileSync(url,'utf8');let source=before;
 if(file==='shop-categories.js')source=source.replace("esc(c['name_'+language])}\" loading=",'esc(categoryAlt(c,language))}" decoding="async" loading=').replace("img.alt=c['name_'+language];","img.alt=categoryAlt(c,language,true);img.decoding='async';");
 if(file==='shop-news.js')source=source.replace('alt="${esc(a[\'cover_alt_\'+lang]||a[\'title_\'+lang])}">','alt="${esc(a[\'cover_alt_\'+lang]||a[\'title_\'+lang]||a.title_he)}" loading="lazy" decoding="async">');
 if(file==='shop-article.js')source=source.replace('class="article-cover" src=', 'class="article-cover" fetchpriority="high" decoding="async" src=');
 if(file==='shop-carholder.html'){
   for(const [path,webp] of Object.entries(localImageMap).filter(([path])=>/^images\/(heb|en)\d+\.jpg$/.test(path)))source=source.replaceAll("'"+path.slice(7)+"'","'"+webp.slice(7)+"'");
   source=source.replace('alt="CarHold Pro ${i + 1}"','alt="${lang===\'he\'?\'תושבת CarHold Pro לטלפון ברכב\':\'CarHold Pro car phone mount\'}"');
 }
 if(file==='index.html'){
   source=source.replaceAll('alt="תמונה מהגלריה"','alt="${document.querySelector(\'.gallery img[src=\\\"\'+src+\'\\\"]\')?.alt||\'אלקטרושופ – החנות והמעבדה\'}"');
   // The later lightbox implementation uses a single-quoted string, not a template.
   source=source.replace("' + src + '\" alt=\"${document.querySelector('.gallery img[src=\\\"'+src+'\\\"]')?.alt||'אלקטרושופ – החנות והמעבדה'}\">'", "' + src + '\" alt=\"אלקטרושופ – החנות והמעבדה\">'");
 }
 source=source.replace(/<img(?=\s)[^>]*>/gi,tag=>{
   const path=tag.match(/\bsrc=["']([^"']+)["']/)?.[1],name=path?.split('/').pop();
   if(altNames[name])tag=tag.replace(/\balt=["'][^"']*["']/,'alt="'+altNames[name]+'"');
   if(!/\bdecoding=/.test(tag))tag=tag.replace(/\/?\s*>$/,' decoding="async">');
   return tag;
 });
 for(const script of scripts)source=source.replace(new RegExp(script.replaceAll('.','\\.')+'(?:\\?v=[^\\"\\\'<>\\s]*)?(?=[\\"\\\'<>\\s])','g'),script+'?v=media-webp-1');
 if(source!==before)fs.writeFileSync(url,source);
}
