import {rememberPaymentCart,cartSnapshot,reconcilePaidCart} from './shop-paid-cart.js?v=1';
import {checkoutData,refreshDelivery} from './shop-bit-checkout.js?v=delivery-minimum-1';
import {request} from './shop-api.js?v=media-webp-1';
const form=document.getElementById('checkoutForm'),status=document.getElementById('paypalStatus'),retry=document.getElementById('paypalRetry');
const english=localStorage.getItem('electroshop_store_language')==='en';
if(english){document.documentElement.lang='en';document.documentElement.dir='ltr';document.querySelector('.checkout-shell h1').textContent='Customer and shipping details';document.querySelector('.checkout-shell section > .notice').textContent='Pay in ILS with PayPal or Bit. Bit payments are confirmed manually. Smartphone shipping: ILS 50 per order. Other products: free shipping unless stated otherwise. For pickup-only products, please arrange your visit with the store.';const labels=['Full name','Email','Phone','Country','City','Street and number','Postal code','Order notes'];document.querySelectorAll('#checkoutForm > label.field > span').forEach((el,i)=>el.textContent=labels[i]);document.querySelector('#checkoutForm small').textContent='Shipping within Israel';document.querySelector('.order-summary h2').textContent='Order summary';document.getElementById('paypalRetry').textContent='Check payment again';}
const endpoint='/functions/v1/electroshop-paypal';
if(english){document.querySelector('.checkout-shell section > .notice').textContent='Free delivery on purchases of ILS 100 or more, unless otherwise stated. Phone delivery: ILS 50 per order. Guitars and products marked pickup only must be collected from the store by prior arrangement. Store pickup has no minimum or delivery charge. Bit payments are confirmed manually.';form.querySelectorAll('.delivery-options [data-en]').forEach(el=>el.textContent=el.dataset.en);}
const call=body=>request(endpoint,{method:'POST',body});
let current=null,inFlight=false;
function lock(value){inFlight=value;form.querySelectorAll('input,textarea,button[value="bit"],#tranzilaButton').forEach(el=>el.disabled=value);if(!value)refreshDelivery();}
function remember(order){sessionStorage.setItem('electroshop_paypal_pending',JSON.stringify(order));}
async function finish(order){
 const result=await call({action:'capture',order_id:order.order_id,paypal_order_id:order.paypal_order_id});
 if(!result.paid){status.textContent=(english?"PayPal is still checking the payment. Do not pay again. You can check the status again.":"PayPal עדיין בודק את התשלום. אין לשלם שוב. אפשר לבדוק את המצב מחדש.");retry.hidden=false;return;}
 sessionStorage.setItem('electroshop_paid_order',JSON.stringify({id:order.order_id,number:result.order_number}));
 await reconcilePaidCart();sessionStorage.removeItem('electroshop_paypal_pending');
 location.assign('shop-payment-success.html');
}
retry.addEventListener('click',async()=>{retry.disabled=true;try{const order=current||JSON.parse(sessionStorage.getItem('electroshop_paypal_pending')||'null');if(!order)throw Error('אין הזמנה לבדיקה');await finish(order);}catch{status.textContent=(english?"Payment status could not be checked. Do not pay again; retry the check or contact the store.":"לא הצלחנו לבדוק את התשלום. אין לשלם שוב; נסו בדיקה מחדש או פנו לחנות.");}finally{retry.disabled=false;}});
try{
 checkoutData({validateDelivery:false});
 const pending=JSON.parse(sessionStorage.getItem('electroshop_paypal_pending')||'null');
 if(pending?.approved){current=pending;lock(true);retry.hidden=false;status.textContent=(english?"Checking your previous payment before placing another order.":"בודקים את התשלום הקודם לפני ביצוע הזמנה נוספת.");await finish(pending);}
 else{
 const config=await request(endpoint+'?action=config');
 if(!config.enabled||!config.client_id||config.currency!=='ILS')throw Error('התשלום ב-PayPal אינו זמין כרגע');
 await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://www.paypal.com/sdk/js?'+new URLSearchParams({'client-id':config.client_id,currency:'ILS',intent:'capture',components:'buttons','enable-funding':'card','disable-funding':'paylater',locale:english?'en_IL':'he_IL'});script.onload=resolve;script.onerror=()=>reject(Error('לא ניתן לטעון את PayPal. אפשר לרענן או לבחור בביט.'));document.head.appendChild(script);});
 const container=document.getElementById('paypalButtons');container.hidden=false;
 const buttons=window.paypal.Buttons({
  style:{shape:'rect',layout:'vertical',color:'gold',label:'paypal',height:48},
  onClick(data,actions){if(inFlight||!form.reportValidity())return actions.reject();try{checkoutData();return actions.resolve();}catch(error){status.textContent=error.message;return actions.reject();}},
  async createOrder(){
   if(!form.reportValidity())throw Error('יש להשלים את פרטי ההזמנה');
   const {items,total}=checkoutData(),customer=Object.fromEntries(new FormData(form));
   const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({customer,items,total})));
   const key='electroshop_paypal_request_'+Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
   let requestId=sessionStorage.getItem(key);if(!requestId){requestId=crypto.randomUUID();sessionStorage.setItem(key,requestId);}
   const purchasedCart=cartSnapshot();lock(true);status.textContent=(english?"Opening secure payment...":"פותחים תשלום מאובטח...");
   try{current=await call({action:'start',customer,items,expected_total:total.toFixed(2),request_id:requestId});rememberPaymentCart(current.order_id,'paypal',purchasedCart);remember(current);return current.paypal_order_id;}
   catch(error){lock(false);status.textContent=error.message;throw error;}
  },
  async onApprove(data,actions){
   current={...current,approved:true};remember(current);status.textContent=(english?"Verifying your payment...":"מאמתים את התשלום...");
   try{if(data.orderID!==current.paypal_order_id)throw Error('Order mismatch');await finish(current);}
   catch(error){if(/INSTRUMENT_DECLINED/.test(error.message)){current.approved=false;remember(current);lock(false);return actions.restart();}status.textContent=(english?"Payment could not be verified yet. Do not pay again. Select Check payment again.":"לא הצלחנו לאמת כרגע את התשלום. אין לשלם שוב. לחצו על בדיקת התשלום מחדש.");retry.hidden=false;}
  },
  onCancel(){lock(false);status.textContent=(english?"Payment cancelled. You can select a payment method again.":"התשלום בוטל. אפשר לבחור שוב אמצעי תשלום.");},
  onError(){if(current?.approved){retry.hidden=false;status.textContent=(english?"Check payment status before trying again.":"יש לבדוק את מצב התשלום לפני ניסיון נוסף.");}else{lock(false);if(!status.textContent||status.textContent===(english?"Opening secure payment...":"פותחים תשלום מאובטח..."))status.textContent=(english?"Payment could not be opened. Please try again.":"לא ניתן לפתוח תשלום כרגע. אפשר לנסות שוב.");}}
 });
 if(!buttons.isEligible())throw Error('PayPal אינו זמין בדפדפן זה');
 status.textContent='';buttons.render(container).catch(()=>{status.textContent=english?"PayPal could not load":"לא ניתן לטעון את PayPal";});
 }
}catch(error){status.textContent=error.message||'לא ניתן לטעון את אפשרויות התשלום';}


const tranzilaButton=document.getElementById('tranzilaButton'),tranzilaStatus=document.getElementById('tranzilaStatus');
const tranzilaOverlay=document.getElementById('tranzilaOverlay'),tranzilaFrame=document.getElementById('tranzilaFrame'),tranzilaLoading=document.getElementById('tranzilaLoading'),tranzilaClose=document.getElementById('closeTranzila');
let tranzilaTimer=0;
function closeTranzila(){tranzilaOverlay.hidden=true;document.body.classList.remove('payment-open');clearTimeout(tranzilaTimer);tranzilaFrame.src='about:blank';lock(false);}
tranzilaClose.addEventListener('click',closeTranzila);
tranzilaOverlay.addEventListener('click',event=>{if(event.target===tranzilaOverlay)closeTranzila();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!tranzilaOverlay.hidden)closeTranzila();});
async function watchTranzila(orderId,attempts=0){
 if(tranzilaOverlay.hidden)return;
 try{const result=await request('/functions/v1/electroshop-tranzila?action=status&order_id='+encodeURIComponent(orderId));if(result.payment_status==='paid'){sessionStorage.setItem('electroshop_paid_order',JSON.stringify({id:orderId,number:result.order_number,provider:'tranzila'}));location.assign('shop-payment-success.html');return;}if(result.payment_status==='failed'){tranzilaStatus.textContent=english?'The payment was not approved.':'התשלום לא אושר.';closeTranzila();return;}}catch{}
 if(attempts<300)tranzilaTimer=setTimeout(()=>watchTranzila(orderId,attempts+1),2000);
}
function openTranzila(payment,orderId){
 tranzilaLoading.hidden=false;let loaded=false;const finish=()=>{if(!loaded){loaded=true;tranzilaLoading.hidden=true;}};
 tranzilaFrame.onload=()=>setTimeout(finish,250);tranzilaFrame.src='about:blank';tranzilaOverlay.hidden=false;document.body.classList.add('payment-open');
 const paymentForm=document.createElement('form');paymentForm.method='POST';paymentForm.action=payment.iframe_url;paymentForm.target=tranzilaFrame.name;
 Object.entries(payment.fields||{}).forEach(([name,value])=>{const input=document.createElement('input');input.type='hidden';input.name=name;input.value=String(value??'');paymentForm.appendChild(input);});
 paymentForm.hidden=true;document.body.appendChild(paymentForm);paymentForm.submit();paymentForm.remove();setTimeout(finish,1800);watchTranzila(orderId);
}
try{const config=await request('/functions/v1/electroshop-tranzila?action=config');tranzilaButton.hidden=!config.enabled;tranzilaButton.textContent=english?'Secure card payment':'לתשלום מאובטח באשראי';}catch{tranzilaButton.hidden=true;}
tranzilaButton.addEventListener('click',async()=>{
 if(inFlight||!form.reportValidity())return;
 try{
  const {items,total}=checkoutData(),customer=Object.fromEntries(new FormData(form));
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({customer,items,total})));
  const key='electroshop_tranzila_'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  let requestId=sessionStorage.getItem(key);if(!requestId){requestId=crypto.randomUUID();sessionStorage.setItem(key,requestId);}
  const purchasedCart=cartSnapshot();lock(true);tranzilaStatus.textContent=english?'Opening secure payment...':'פותחים תשלום מאובטח...';
  const result=await request('/functions/v1/electroshop-tranzila',{method:'POST',body:{action:'start',customer,items,expected_total:total.toFixed(2),request_id:requestId,language:english?'en':'he'}});
  const link=new URL(result.iframe_url);if(link.origin!=='https://directng.tranzila.com'||!result.fields?.thtk)throw Error('Invalid payment window');
  rememberPaymentCart(result.order_id,'tranzila',purchasedCart);
  openTranzila({...result,iframe_url:link.href},result.order_id);
 }catch(error){lock(false);tranzilaStatus.textContent=error.message;}
});
