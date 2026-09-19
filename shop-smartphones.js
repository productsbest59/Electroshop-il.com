if(new URLSearchParams(location.search).get('category')==='smartphones'){
 const intro=document.querySelector('.shop-intro'),heading=intro.querySelector('h1');
 const brand=document.createElement('div');brand.className='devices-brand';
 const logo=document.createElement('span');logo.className='pelephone-dealer-logo';logo.setAttribute('role','img');logo.setAttribute('aria-label','פלאפון');
 const words=document.createElement('div'),label=document.createElement('strong');label.textContent='משווק רשמי של פלאפון';heading.textContent='מכשירים';heading.before(brand);words.append(heading,label);brand.append(logo,words);
 const style=document.createElement('style');style.textContent='.devices-brand{display:flex;justify-content:center;align-items:center;gap:18px}.devices-brand h1{margin:0!important}.pelephone-dealer-logo{display:block;flex:0 0 96px;width:96px;height:96px;background:url(images/authorized-dealers.png) left center/auto 96px no-repeat}.devices-brand strong{color:#111}@media(max-width:600px){.pelephone-dealer-logo{flex-basis:72px;width:72px;height:72px;background-size:auto 72px}.devices-brand h1{font-size:2rem!important}}';document.head.append(style);
 document.title='מכשירים — משווק רשמי פלאפון | אלקטרושופ';
 const url='https://electroshop-il.com/shop-category.html?category=smartphones';document.querySelector('link[rel=canonical]').href=url;
 for(const [selector,content] of [['meta[property="og:url"]',url],['meta[property="og:title"]',document.title],['meta[name="description"]','מכשירי פלאפון באלקטרושופ, משווק רשמי. בחירת נפח אחסון וצבע עם מחירי פלאפון.']])document.querySelector(selector)?.setAttribute('content',content);
}
