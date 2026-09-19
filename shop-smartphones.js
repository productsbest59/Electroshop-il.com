if(new URLSearchParams(location.search).get('category')==='smartphones'){
 document.documentElement.classList.add('devices-page');
 const intro=document.querySelector('.shop-intro'),heading=intro.querySelector('h1');
 heading.textContent='מכשירים — פלאפון בעיר';heading.hidden=true;intro.querySelector('p').hidden=true;
 const banner=document.createElement('img');banner.className='devices-banner';banner.src='images/pelephone-city-banner.png';banner.alt='חנות פלאפון בעיר — מוצרים מתקדמים במחירים משתלמים';banner.width=3416;banner.height=882;banner.fetchPriority='high';intro.prepend(banner);
 const notice=document.createElement('p');notice.className='devices-price-notice';
 const updateNotice=()=>{notice.textContent=document.documentElement.lang==='en'?"* Electroshop is not responsible for the price list. Prices are set and updated by Pelephone and may change at its discretion. In case of a pricing error, please contact Pelephone. We recommend checking stock availability. Delivery costs an additional NIS 50, or collection from the store by prior arrangement.":"* אלקטרושופ אינה אחראית למחירון. המחירון נקבע ומתעדכן על ידי חברת פלאפון ועלול להשתנות על פי החלטתה. במקרה של טעות במחיר, יש לפנות לחברת פלאפון. מומלץ לבדוק זמינות במלאי. משלוח בתוספת 50 ש״ח או איסוף עצמי מהחנות בתיאום מראש."};updateNotice();document.addEventListener('electroshop-language-change',updateNotice);document.querySelector('#products').before(notice);
}
