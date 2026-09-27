import {request,getSession,isAdmin} from './shop-api.js?v=option-images-2';
const en=()=>document.documentElement.lang==='en';
const fixed=['mobile','pro-audio','car-mounts','guitars','chargers-cables','earphones','signs','batteries','speakers'];
const categoryUrl=slug=>fixed.includes(slug)?`shop-${slug}.html`:`shop-category.html?category=${encodeURIComponent(slug)}`;
const link=(url,he,english)=>{const a=document.createElement('a');a.href=url;a.dataset.he=he;a.dataset.en=english;a.textContent=en()?english:he;const accent={'index.html':'#ffe066','shop.html':'#79e6a2','index.html#services':'#76cfff','index.html#contact':'#ffad80'}[url];if(accent){a.classList.add('menu-accent');a.style.setProperty('--menu-accent',accent)}return a;};
let menu=document.querySelector('#mainMenu'),standalone=!menu;
if(standalone){
 menu=document.createElement('aside');menu.id='mainMenu';menu.className='main-menu unified-standalone';menu.setAttribute('aria-hidden','true');
 menu.innerHTML='<div class="main-menu-header"><strong data-he="תפריט" data-en="Menu">תפריט</strong><button type="button" class="main-menu-close" aria-label="סגירת תפריט">×</button></div><nav class="main-menu-links" aria-label="ניווט ראשי"></nav>';
 const toggle=document.createElement('button');toggle.type='button';toggle.className='unified-menu-toggle';toggle.textContent='☰';toggle.setAttribute('aria-label','פתיחת תפריט');toggle.setAttribute('aria-controls','mainMenu');toggle.setAttribute('aria-expanded','false');
 const backdrop=document.createElement('div');backdrop.className='unified-menu-backdrop';
 const close=()=>{menu.classList.remove('open');backdrop.hidden=true;menu.setAttribute('aria-hidden','true');toggle.setAttribute('aria-expanded','false');document.body.classList.remove('main-menu-is-open');};
 backdrop.hidden=true;toggle.onclick=()=>{menu.classList.add('open');backdrop.hidden=false;menu.setAttribute('aria-hidden','false');toggle.setAttribute('aria-expanded','true');document.body.classList.add('main-menu-is-open');};
 backdrop.onclick=close;menu.querySelector('button').onclick=close;document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 document.body.append(backdrop,menu,toggle);
}
const nav=menu.querySelector('.main-menu-links');
const admin=nav.querySelector('#adminMenuLinks');
nav.replaceChildren();
nav.append(link('index.html','דף הבית','Home'));
const shop=document.createElement('details');shop.className='unified-shop';
const summary=document.createElement('summary');summary.innerHTML='<span data-he="חנות" data-en="Store">חנות</span><svg class="unified-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v16M5 13l7 7 7-7"/></svg>';
const categories=document.createElement('div');categories.className='unified-categories';shop.append(summary,categories);nav.append(shop);
nav.append(link('index.html#services','שירותי המעבדה','Repair services'),link('index.html#contact','צור קשר','Contact'),link('terms.html','תקנון','Terms'),link('privacy.html','פרטיות','Privacy'));
const accessibility=link('proaudio-accessibility.html','נגישות','Accessibility');nav.append(accessibility);
if(admin)nav.append(admin);
else{
 const box=document.createElement('div');box.className='admin-menu-links';box.id='adminMenuLinks';box.hidden=true;
 for(const [url,he,english] of [['shop-admin.html','ניהול מוצרים','Manage products'],['shop-orders.html','מעקב הזמנות','Order tracking']]){const a=link(url,he,english);a.target='_blank';a.rel='noopener';box.append(a);}
 nav.append(box);
 async function auth(){box.hidden=true;try{const s=await getSession();box.hidden=!(s&&await isAdmin(s)===true);}catch{}}
 auth();window.addEventListener('pageshow',auth);window.addEventListener('storage',auth);
}
let rows=[];
function render(){
 categories.replaceChildren(link('shop.html','כל הקטגוריות','All categories'));
 const palette=['#80d8ff','#e4a1ff','#ffbb80','#ff94bc','#8fe3bf','#b7b0ff','#ffe088','#81e4e4','#e7b892','#b6e78a','#b2caff','#ffa69e'];
 for(const [index,c] of rows.entries()){
  const slug=(c.aliases||[]).find(s=>fixed.includes(s)||s==='smartphones')||c.slug;
  const a=link(categoryUrl(slug),c.name_he,c.name_en||c.name_he);
  const known=['smartphones',...fixed].indexOf(slug);
  a.classList.add('menu-accent');a.style.setProperty('--menu-accent',palette[(known<0?index:known)%palette.length]);categories.append(a);
 }
 nav.querySelectorAll('[data-he]').forEach(el=>el.textContent=en()?el.dataset.en:el.dataset.he);
 nav.querySelectorAll('a').forEach(a=>{const u=new URL(a.href);if(u.pathname===location.pathname&&u.search===location.search&&!u.hash)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
}
render();
try{rows=await request('/rest/v1/electroshop_categories?select=slug,name_he,name_en,aliases&active=eq.true&order=sort_order.asc,slug.asc');render();}catch{const p=document.createElement('small');p.textContent='לא ניתן לטעון קטגוריות כרגע. כל הקטגוריות זמינות בדף החנות.';categories.append(p);}
document.addEventListener('electroshop-language-change',render);
nav.addEventListener('click',e=>{if(e.target.closest('a')){menu.querySelector('.main-menu-close')?.click();}});

document.addEventListener('electroshop-categories-updated',async()=>{rows=await request('/rest/v1/electroshop_categories?select=slug,name_he,name_en,aliases&active=eq.true&order=sort_order.asc,slug.asc');render();});
