import {renderCategoryGuide} from './shop-category-guides.js?v=1';
const guide=document.querySelector('[data-category-guide]');
if(guide){
 const slug=new URLSearchParams(location.search).get('category')||guide.dataset.categoryGuide;
 const render=()=>{guide.innerHTML=renderCategoryGuide(slug,document.documentElement.lang==='en'?'en':'he');};
 render();
 document.addEventListener('electroshop-language-change',render);
}
