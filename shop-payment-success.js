import {request} from './shop-api.js?v=multi-category-1';
const english=localStorage.getItem('electroshop_store_language')==='en';
if(english){document.documentElement.lang='en';document.documentElement.dir='ltr';document.title='Thank you | Electroshop';document.querySelector('h1').textContent='Thank you for choosing Electroshop';document.querySelector('main a').textContent='Back to store';}
const status=document.getElementById('paymentStatus');
try{
 const order=JSON.parse(sessionStorage.getItem('electroshop_paid_order')||'null');
 if(!order?.id){status.textContent=(english?'You can return to the store using the button below.':'אפשר לחזור לחנות באמצעות הכפתור למטה.');}
 else{
 const result=await request('/functions/v1/electroshop-paypal',{method:'POST',body:{action:'status',order_id:order.id}});
 status.textContent=result.payment_status==='paid'?(english?'Payment received. Thank you for your order!':'התשלום התקבל בהצלחה. תודה על הזמנתכם!'):(english?'Payment confirmation is pending. Do not pay again.':'אישור התשלום עדיין בבדיקה. אין לבצע תשלום נוסף.');
 document.getElementById('orderNumber').textContent=(english?'Order number: ':'מספר הזמנה: ')+result.order_number;
 }
}catch{status.textContent=(english?'Unable to check the order now. Do not pay again; please contact the store.':'לא ניתן לבדוק כרגע את מצב ההזמנה. אין לבצע תשלום נוסף; אפשר לפנות לחנות.');}
