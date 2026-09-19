(() => {
 const key='electroshop_last_category_url';
 const fixed=['mobile','pro-audio','car-mounts','guitars','chargers-cables','earphones'];
 const file=location.pathname.split('/').pop();
 const category=document.querySelector('main[data-category],main[data-store-category]');
 const slug=category?.dataset.storeCategory||category?.dataset.category;
 let destination;
 if(file==='shop-carholder.html'||file==='carholder.html')destination='shop-car-mounts.html#products';
 else if(slug&&slug!=='unavailable')destination=fixed.includes(slug)?'shop-'+slug+'.html#products':'shop-category.html?category='+encodeURIComponent(slug)+'#products';
 if(destination){try{sessionStorage.setItem(key,destination)}catch{}}
 if(!destination){try{const saved=sessionStorage.getItem(key);if(saved&&/^shop-(?:mobile|pro-audio|car-mounts|guitars|chargers-cables)\.html#products$|^shop-category\.html\?category=[a-z0-9-]+#products$/.test(saved))destination=saved;}catch{}}
 destination ||= 'shop.html';
 document.querySelectorAll('[data-category-back]').forEach(link=>{link.href=destination;});
})();
