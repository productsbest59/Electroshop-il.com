import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {guidePages,updateGuidePage} from './generate-category-guides.mjs';
import {categoryGuides,renderCategoryGuide} from '../shop-category-guides.js';

for(const [file,slug] of Object.entries(guidePages)){
 const source=await readFile(file,'utf8');
 const guide=source.match(/<!-- CATEGORY_GUIDE_START -->([\s\S]*?)<!-- CATEGORY_GUIDE_END -->/)?.[1];
 assert(guide?.includes(renderCategoryGuide(slug)),`Missing initial content: ${file}`);
 assert(source.indexOf(guide)<source.indexOf('</main>'),`Guide must stay inside main: ${file}`);
 assert.equal((source.match(/data-category-guide=/g)||[]).length,1);
 assert.equal(updateGuidePage(source,slug),source,'Generation must be idempotent');
 assert(source.includes('shop-category-guides.css?v=1')&&source.includes('shop-category-guide-ui.js?v=1'));
 assert(!/href="https?:/.test(guide),'Buying guides must only link inside the site');
 assert(source.includes('shop-categories.js?v=media-webp-1'),'Keep the live category editor');
}
for(const slug of Object.keys(categoryGuides))for(const language of ['he','en']){
 const guide=renderCategoryGuide(slug,language);
 assert(guide.includes('<h2>')&&guide.includes('<h3>')&&!guide.includes('undefined'));
}
assert.equal(renderCategoryGuide('<script>'),renderCategoryGuide('general'),'Future categories get safe generic guidance');
assert(!renderCategoryGuide('pc-and-gaming').includes('מכירת מחשבים'));
const ui=(await readFile('shop-category-guide-ui.js','utf8')).replace(/^import[^\n]+\n/,'');
const events={},guide={dataset:{categoryGuide:'general'},innerHTML:''};
const document={documentElement:{lang:'he'},querySelector:()=>guide,addEventListener:(name,fn)=>events[name]=fn};
runInNewContext(ui,{document,location:{search:'?category=smartphones'},URLSearchParams,renderCategoryGuide});
assert(guide.innerHTML.includes('בחירת סמארטפון'));
document.documentElement.lang='en';events['electroshop-language-change']();
assert(guide.innerHTML.includes('Choosing a smartphone'));
for(const file of ['privacy.html','proaudio-privacy.html','carholderprivacy.html']){
 const source=await readFile(file,'utf8');
 const payment=source.match(/<section id="payment">([\s\S]*?)<\/section>/)?.[1];
 for(const provider of ['טרנזילה','Tranzila','PayPal','ביט','Bit'])assert(payment?.includes(provider),`${file}: missing ${provider}`);
 assert(source.includes('id="advertising"')&&source.includes('href="#advertising"'));
 assert(source.includes('myadcenter.google.com')&&source.includes('optout.aboutads.info'));
 assert(source.includes('11 באוקטובר 2026'));
 assert(source.includes('shop-legal-language.js'));
 if(file==='privacy.html')assert(source.includes('shop-accessibility.js'));
 assert.equal((source.match(/id="advertising"/g)||[]).length,1);
}
console.log('PASS: 10 initial category guides, internal links, unchanged category editor, idempotency, dynamic categories, language switching and all 3 privacy/payment disclosures.');
