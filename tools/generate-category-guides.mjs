import {readFile,writeFile} from 'node:fs/promises';
import {renderCategoryGuide} from '../shop-category-guides.js';

export const guidePages={
 'shop-mobile.html':'mobile','shop-chargers-cables.html':'chargers-cables',
 'shop-car-mounts.html':'car-mounts','shop-guitars.html':'guitars',
 'shop-pro-audio.html':'pro-audio','shop-earphones.html':'earphones',
 'shop-signs.html':'signs','shop-batteries.html':'batteries',
 'shop-speakers.html':'speakers','shop-category.html':'general'
};
export function updateGuidePage(source,slug){
 const block=`<!-- CATEGORY_GUIDE_START --><section class="category-guide" data-category-guide="${slug}" aria-label="מדריך לבחירת מוצרים">${renderCategoryGuide(slug)}</section><!-- CATEGORY_GUIDE_END -->`;
 const marker=/<!-- CATEGORY_GUIDE_START -->[\s\S]*?<!-- CATEGORY_GUIDE_END -->/;
 if(marker.test(source))source=source.replace(marker,()=>block);
 else if(source.includes('</main>'))source=source.replace('</main>',()=>block+'</main>');
 else throw new Error('Category main element not found; refusing to overwrite.');
 if(!source.includes('href="shop-category-guides.css?v=1"'))source=source.replace('</head>','<link rel="stylesheet" href="shop-category-guides.css?v=1"></head>');
 if(!source.includes('src="shop-category-guide-ui.js?v=1"'))source=source.replace('</body>','<script type="module" src="shop-category-guide-ui.js?v=1"></script></body>');
 return source;
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/generate-category-guides.mjs')){
 for(const [file,slug] of Object.entries(guidePages))await writeFile(file,updateGuidePage(await readFile(file,'utf8'),slug));
 console.log(`Generated static buying guides for ${Object.keys(guidePages).length} category pages.`);
}
