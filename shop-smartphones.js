if(new URLSearchParams(location.search).get('category')==='smartphones'){
 document.documentElement.classList.add('devices-page');
 const intro=document.querySelector('.shop-intro'),heading=intro.querySelector('h1');
 heading.textContent='מכשירים — פלאפון בעיר';heading.hidden=true;intro.querySelector('p').hidden=true;
 const banner=document.createElement('img');banner.className='devices-banner';banner.src='images/pelephone-city-banner.png';banner.alt='חנות פלאפון בעיר — מוצרים מתקדמים במחירים משתלמים';banner.width=3416;banner.height=882;banner.fetchPriority='high';intro.prepend(banner);
 document.title='מכשירים — משווק רשמי פלאפון | אלקטרושופ';
 const url='https://electroshop-il.com/shop-category.html?category=smartphones';document.querySelector('link[rel=canonical]').href=url;
 for(const [selector,content] of [['meta[property="og:url"]',url],['meta[property="og:title"]',document.title],['meta[name="description"]','מכשירי פלאפון באלקטרושופ, משווק רשמי. בחירת נפח אחסון וצבע עם מחירי פלאפון.']])document.querySelector(selector)?.setAttribute('content',content);
}
