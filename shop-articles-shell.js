export function renderArticleShell(){
 document.head.insertAdjacentHTML('beforeend','<style>@media(max-width:700px){#articleSiteTop>.electroshop-header{display:none!important}}</style>');
 const top=document.querySelector('#articleSiteTop'),bottom=document.querySelector('#articleSiteBottom');
 if(top)top.innerHTML=`<a class="mobile-brand" href="index.html" aria-label="אלקטרושופ - דף הבית"><img src="images/logo.webp" alt="אלקטרושופ" width="64" height="64" decoding="async"></a><div class="site-topbar"><div class="topbar-left-controls"><div class="language-picker"><button class="lang-toggle" id="langToggle" type="button" aria-label="בחירת שפה" aria-expanded="false">🌐</button><div class="language-menu" id="languageMenu" hidden><button type="button" data-language="he">עברית</button><button type="button" data-language="en">English</button></div></div></div><button class="menu-toggle" id="menuToggle" type="button" aria-label="פתח תפריט" aria-expanded="false" aria-controls="mainMenu">☰</button></div><div class="menu-backdrop" id="menuBackdrop"></div><aside class="main-menu" id="mainMenu" aria-hidden="true"><div class="main-menu-header"><div class="main-menu-title" data-he="תפריט" data-en="Menu">תפריט</div><button class="main-menu-close" id="menuClose" type="button" aria-label="סגור תפריט">×</button></div><nav class="main-menu-links"><a href="index.html" data-he="דף הבית" data-en="Home"><span>דף הבית</span></a><a href="shop.html" data-he="החנות שלנו" data-en="Our store"><span>החנות שלנו</span></a><a href="shop-news.html" data-he="חדשות ומדריכים" data-en="News & Guides"><span>חדשות ומדריכים</span></a><a href="imei-check.html" data-he="בדיקת IMEI" data-en="IMEI Check"><span>בדיקת IMEI</span></a><a href="index.html#services" data-he="שירותי המעבדה" data-en="Repair services"><span>שירותי המעבדה</span></a><a href="index.html#contact" data-he="צור קשר" data-en="Contact"><span>צור קשר</span></a><a href="terms.html" data-he="תקנון" data-en="Terms"><span>תקנון</span></a><a href="privacy.html" data-he="פרטיות" data-en="Privacy"><span>פרטיות</span></a><a href="#" id="articleAccessibilityLink" data-he="נגישות" data-en="Accessibility"><span>נגישות</span></a></nav></aside><header class="electroshop-header electroshop-header-with-controls"><a class="electroshop-header-brand" href="index.html" aria-label="אלקטרושופ - דף הבית"><img src="images/logo.webp" alt="לוגו אלקטרושופ" width="96" height="96" decoding="async"><span><strong data-he="אלקטרושופ" data-en="Electroshop">אלקטרושופ</strong><span data-he="מעבדת סלולר ואביזרים" data-en="Phone repairs and accessories">מעבדת סלולר ואביזרים</span></span></a><nav class="electroshop-header-links" aria-label="ניווט ראשי"><a href="index.html" data-he="דף הבית" data-en="Home">דף הבית</a><a href="shop.html" data-he="החנות שלנו" data-en="Our store">החנות שלנו</a><a href="shop-news.html" data-he="חדשות ומדריכים" data-en="News & Guides">חדשות ומדריכים</a><a href="imei-check.html" data-he="בדיקת IMEI" data-en="IMEI Check">בדיקת IMEI</a><a href="index.html#services" data-he="שירותים" data-en="Services">שירותים</a><a href="index.html#contact" data-he="צור קשר" data-en="Contact">צור קשר</a></nav></header>`;
 if(bottom)bottom.innerHTML=`<a class="float-whatsapp" href="https://wa.me/972559299899" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a><footer class="footer home-footer"><nav class="home-footer-links" aria-label="קישורי מידע ושירות"><a href="shop.html" data-he="החנות" data-en="Store">החנות</a><a href="shop-news.html" data-he="חדשות ומדריכים" data-en="News & Guides">חדשות ומדריכים</a><a href="imei-check.html" data-he="בדיקת IMEI" data-en="IMEI Check">בדיקת IMEI</a><a href="index.html#services" data-he="שירותים" data-en="Services">שירותים</a><a href="index.html#contact" data-he="צור קשר" data-en="Contact">צור קשר</a><a href="privacy.html" data-he="מדיניות פרטיות" data-en="Privacy">מדיניות פרטיות</a><a href="terms.html" data-he="תקנון" data-en="Terms">תקנון</a><a href="proaudio-accessibility.html" data-he="נגישות" data-en="Accessibility">נגישות</a></nav><p class="home-footer-copyright" data-he="© כל הזכויות שמורות לאלקטרושופ" data-en="© All rights reserved - Electroshop">© כל הזכויות שמורות לאלקטרושופ</p><p class="site-credit"><span data-he="נבנה על ידי " data-en="Built by ">נבנה על ידי </span><a href="https://www.digital247now.com" target="_blank" rel="noopener">Digital247now.com</a></p></footer>`;
 const menu=document.querySelector('#mainMenu'),backdrop=document.querySelector('#menuBackdrop'),toggle=document.querySelector('#menuToggle');
 const close=()=>{menu?.classList.remove('open');backdrop?.classList.remove('open');menu?.setAttribute('aria-hidden','true');toggle?.setAttribute('aria-expanded','false');document.body.classList.remove('main-menu-is-open')};
 toggle?.addEventListener('click',()=>{menu?.classList.add('open');backdrop?.classList.add('open');menu?.setAttribute('aria-hidden','false');toggle.setAttribute('aria-expanded','true');document.body.classList.add('main-menu-is-open')});document.querySelector('#menuClose')?.addEventListener('click',close);backdrop?.addEventListener('click',close);document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 const applyLanguage=lang=>{localStorage.setItem('electroshop_language',lang);document.documentElement.lang=lang;document.documentElement.dir=lang==='he'?'rtl':'ltr';document.querySelectorAll('[data-he]').forEach(el=>{const value=el.dataset[lang]||el.dataset.he;if(el.matches('a')&&el.firstElementChild?.matches('span')&&el.children.length===1)el.firstElementChild.textContent=value;else el.textContent=value})};applyLanguage(localStorage.getItem('electroshop_language')||'he');document.querySelector('#langToggle')?.addEventListener('click',()=>{const m=document.querySelector('#languageMenu');m.hidden=!m.hidden});document.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>{applyLanguage(b.dataset.language);location.reload()}));
 const accessibilityReady=loadFullAccessibility(bottom);
 hydrateSharedNavigation(accessibilityReady);
}

async function hydrateSharedNavigation(accessibilityReady){
 try{
  await import('./shop-unified-menu.js?v=cellular-1');
  await accessibilityReady;
  const accessibilityLink=[...document.querySelectorAll('#mainMenu a')].find(a=>a.getAttribute('href')==='proaudio-accessibility.html');
  accessibilityLink?.addEventListener('click',event=>{event.preventDefault();document.querySelector('#a11yFab')?.click()});
 }catch(error){console.error('Shared navigation could not be loaded',error)}
}

function enableArticleHeaderScroll(){
 const header=document.querySelector('#articleSiteTop>.electroshop-header');
 const shell=document.querySelector('#articleSiteTop');
 if(!header||!shell)return;
 const setHidden=hidden=>{header.classList.toggle('article-header-hidden',hidden);shell.classList.toggle('article-mobile-header-hidden',hidden)};
 let previous=Math.max(0,window.scrollY),distance=0,direction=0,queued=false;
 const update=()=>{
  queued=false;
  const y=Math.max(0,window.scrollY),delta=y-previous;
  previous=y;
  if(y<40||header.contains(document.activeElement)||document.querySelector('#mainMenu.open')){setHidden(false);distance=0;return}
  if(Math.abs(delta)<1)return;
  const nextDirection=Math.sign(delta);
  distance=nextDirection===direction?distance+Math.abs(delta):Math.abs(delta);
  direction=nextDirection;
  if(distance>=12){setHidden(direction>0&&y>header.offsetHeight+30);distance=0}
 };
 window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update)}},{passive:true});
 header.addEventListener('focusin',()=>setHidden(false));
}

async function loadFullAccessibility(bottom){
 try{
  const source=await fetch('shop-category.html').then(response=>response.text()),doc=new DOMParser().parseFromString(source,'text/html');
  for(const selector of ['#a11yBackdrop','#a11yFab','#a11yPanel']){const element=doc.querySelector(selector);if(element)bottom.prepend(element)}
  for(const src of ['shop-accessibility.js','shop-accessibility-dialog-fix.js'])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.body.append(script)});
  document.querySelector('#articleAccessibilityLink')?.addEventListener('click',event=>{event.preventDefault();document.querySelector('#a11yFab')?.click()});
 }catch(error){console.error('Accessibility controls could not be loaded',error)}
}
