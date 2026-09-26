import {getProducts} from './shop-api.js?v=multi-category-1';
let busy=false;
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-buy-sku]');if(!button)return;
 event.preventDefault();if(busy)return;busy=true;button.setAttribute('aria-busy','true');
 const english=document.documentElement.lang==='en';
 try{
  const product=(await getProducts()).find(p=>p.sku===button.dataset.buySku&&p.active);
  if(!product)throw Error(english?'This product is unavailable.':'המוצר אינו זמין כרגע.');
  if([product.colors,product.sizes,product.styles].some(options=>options?.length))throw Error(english?'Please choose product options in the store before checkout.':'יש לבחור אפשרויות מוצר בחנות לפני התשלום.');
  const key='electroshop_new_store_cart_v2',cart=JSON.parse(localStorage.getItem(key)||'{}');
  const item=cart[product.id]||{productId:product.id,qty:0,color:'',size:'',style:''};
  cart[product.id]={...item,qty:Math.min(20,Number(item.qty)+1),price:product.price,image:product.images[0]||''};
  localStorage.setItem(key,JSON.stringify(cart));localStorage.setItem('electroshop_store_language',english?'en':'he');
  location.assign('shop-checkout.html');
 }catch(error){alert(error.message);}finally{busy=false;button.removeAttribute('aria-busy');}
});
