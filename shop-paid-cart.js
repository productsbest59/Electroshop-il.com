import {request} from './shop-api.js?v=media-webp-1';
const CART='electroshop_new_store_cart_v2',PENDING='electroshop_payment_carts_v1';
const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}};
export function rememberPaymentCart(id,provider,snapshot){const pending=read(PENDING);pending[id]??={provider,snapshot};localStorage.setItem(PENDING,JSON.stringify(pending));}
export function cartSnapshot(){return read(CART);}
export function subtractPurchased(cart,snapshot){
 const next=structuredClone(cart);
 for(const [key,bought] of Object.entries(snapshot)){
  const current=next[key];if(!current||current.productId!==bought.productId)continue;
  const qty=Number(bought.qty);if(!Number.isSafeInteger(qty)||qty<1)continue;
  current.qty=Math.max(0,Number(current.qty)-qty);if(!current.qty)delete next[key];
 }
 return next;
}
let checking=false;
export async function reconcilePaidCart(){
 if(checking)return;checking=true;
 try{
  for(const [id,entry] of Object.entries(read(PENDING))){
   if(!['tranzila','paypal'].includes(entry.provider))continue;
   let result;try{result=await request('/functions/v1/electroshop-'+entry.provider,{method:'POST',body:{action:'status',order_id:id}});}catch{continue;}
   if(result.payment_status!=='paid')continue;
   const clean=()=>{
    const pending=read(PENDING);if(!pending[id])return;
    const updated=subtractPurchased(read(CART),pending[id].snapshot);
    // Persist cart + completed state under one cross-tab lock.
    localStorage.setItem(CART,JSON.stringify(updated));delete pending[id];localStorage.setItem(PENDING,JSON.stringify(pending));
    window.dispatchEvent(new StorageEvent('storage',{key:CART,newValue:JSON.stringify(updated)}));
    document.dispatchEvent(new CustomEvent('electroshop-cart-paid'));
    if(location.pathname.endsWith('/shop-checkout.html'))location.reload();
   };
   if(navigator.locks)await navigator.locks.request('electroshop-paid-cart',clean);else clean();
  }
 }finally{checking=false;}
}
window.addEventListener('pageshow',reconcilePaidCart);
window.addEventListener('focus',reconcilePaidCart);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)reconcilePaidCart();});
reconcilePaidCart();
