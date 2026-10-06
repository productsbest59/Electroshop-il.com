const imageForChoice=(product,choice={})=>{const sizes=product.sourceSizes||product.sizes||[],styles=product.sourceStyles||product.styles||[];let pairs=[];if(!sizes.length)pairs=styles.map(style=>({size:'',style,label:style}));else if(!styles.length)pairs=sizes.map(size=>({size,style:'',label:size}));else if(styles.length===1)pairs=sizes.map(size=>({size,style:styles[0],label:size+' - '+styles[0]}));else if(styles.length===sizes.length)pairs=sizes.map((size,i)=>({size,style:styles[i],label:size+' - '+styles[i]}));else pairs=sizes.flatMap(size=>styles.map(style=>({size,style,label:size+' - '+style})));const match=pairs.find(p=>p.label===choice.size),keys=[(choice.style||match?.style)?'@style:'+(choice.style||match.style):'',match?.size?'@size:'+match.size:'',choice.color].filter(Boolean);for(const key of keys){const index=(product.imageColors||[]).indexOf(key);if(index>=0&&product.images[index])return product.images[index]}return product.images[0]};
import {getProducts,createBitOrder} from './shop-api.js?v=media-webp-1';
import {deliveryState,deliveryError,isPickupOnly} from './shop-delivery-policy.js?v=1';
const isMobileBit=()=>navigator.userAgentData?.mobile===true||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const BIT_URL='https://www.bitpay.co.il/app/me/54E3CA02-7B91-2A87-B0E5-9C89BB3228770630';
function showPaymentResult(){requestAnimationFrame(()=>{message.tabIndex=-1;message.style.scrollMarginTop='140px';message.focus({preventScroll:true});message.scrollIntoView({block:'start',behavior:'instant'});});}
const form=document.getElementById('checkoutForm'),message=document.getElementById('message'),button=form.querySelector('[value="bit"]');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>`${Number(n).toLocaleString('he-IL',{maximumFractionDigits:2})} ₪`;
let lines=[],loaded=false;
const english=localStorage.getItem('electroshop_store_language')==='en';
const method=()=>form.querySelector('[name="fulfillmentMethod"]:checked')?.value;
const deliveryLabel=()=>method()==='pickup'?'איסוף עצמי מהחנות - ללא דמי משלוח':'משלוח חינם';
export function refreshDelivery(){
 const pickup=method()==='pickup';
 for(const name of ['city','address','postalCode']){const input=form.elements.namedItem(name);input.closest('label').hidden=pickup;input.disabled=pickup;input.required=!pickup&&name!=='postalCode';}
 const state=deliveryState(lines,method()),error=lines.length?deliveryError(state,method(),english):'';
 form.querySelector('[name="fulfillmentMethod"][value="shipping"]').disabled=state.pickupOnly;
 document.getElementById('deliveryNotice').textContent=!lines.length?'':error||(pickup?(state.pickupOnly?(english?'This cart includes a pickup-only product. Pickup at Hamerkava 31, Holon, by prior arrangement.':'העגלה כוללת מוצר באיסוף עצמי בלבד. איסוף מהמרכבה 31, חולון, בתיאום מראש.'):(english?'Pickup at Hamerkava 31, Holon, by prior arrangement.':'איסוף עצמי מהמרכבה 31, חולון, בתיאום מראש.')):'');
 document.getElementById('summaryTotal').innerHTML=`<small>${english?'Products':'סכום מוצרים'}: ${money(state.subtotal)}</small><small>${pickup?(english?'Store pickup — no delivery charge':deliveryLabel()):state.shipping?`${english?'Smartphone delivery':'משלוח מכשירים'}: ${money(state.shipping)}`:(english?'Free delivery':deliveryLabel())}</small><span>${english?'Total to pay':'סה״כ לתשלום'}</span><strong>${money(state.total)}</strong>`;
}
form.querySelectorAll('[name="fulfillmentMethod"]').forEach(input=>input.addEventListener('change',refreshDelivery));
function optionsFor(product,item){
 const sizes=product.sizes||[],styles=product.styles||[];
 let choices;
 if(!styles.length)choices=sizes.map(size=>({size,style:'',label:size}));
 else if(!sizes.length)choices=styles.map(style=>({size:'',style,label:style}));
 else if(styles.length===1)choices=sizes.map(size=>({size,style:styles[0],label:`${size} - ${styles[0]}`}));
 else if(styles.length===sizes.length)choices=sizes.map((size,i)=>({size,style:styles[i],label:`${size} - ${styles[i]}`}));
 else choices=sizes.flatMap(size=>styles.map(style=>({size,style,label:`${size} - ${style}`})));
 const selected=choices.find(c=>c.label===(item.size||''));
 if(choices.length&&!selected)throw Error('יש לבחור מחדש את אפשרויות המוצר בעגלה');
 const result={color:item.color||'',size:selected?.size||'',style:selected?.style||''};
 if((product.colors||[]).length&&!product.colors.includes(result.color))throw Error('יש לבחור מחדש צבע למוצר בעגלה');
 return result;
}
try{
 const products=await getProducts(),cart=JSON.parse(localStorage.getItem('electroshop_new_store_cart_v2')||'{}');
 lines=Object.values(cart).map(item=>{const product=products.find(p=>p.id===item.productId&&p.active);if(!product)throw Error('מוצר בעגלה אינו זמין. חזרו לעגלה ועדכנו אותה.');const quantity=Number(item.qty);if(!Number.isInteger(quantity)||quantity<1||quantity>20)throw Error('כמות המוצר אינה תקינה');const options=optionsFor(product,item);const variant=(product.variants||[]).find(v=>(v.color||'')===options.color&&(v.size||'')===options.size&&(v.style||'')===options.style);if(product.sku?.startsWith('PELEPHONE-')&&variant?.available!==true)throw Error('שילוב הצבע והנפח אינו זמין כרגע. חזרו לעגלה ובחרו מחדש.');const price=variant?.price!==''&&variant?.price!=null?Number(variant.price):Number(product.price);return {product,quantity,options,price};});
 loaded=true;
 if(lines.some(l=>isPickupOnly(l.product)))form.querySelector('[name="fulfillmentMethod"][value="pickup"]').checked=true;
 document.getElementById('summaryLines').innerHTML=lines.map(l=>`<div class="summary-line"><img src="${esc(imageForChoice(l.product,{...l.options,size:l.options.size&&l.options.style?l.options.size+' - '+l.options.style:l.options.size||l.options.style})||'')}" alt="${esc(l.product.nameHe)}" decoding="async"><div><strong>${esc(l.product.nameHe)}</strong>${l.product.pickupOnly?'<p class="pickup-notice">איסוף עצמי בלבד מהחנות - המרכבה 31, חולון, בתיאום מראש</p>':''}<small>${esc((l.product.optionLabelHe?l.product.optionLabelHe+': ':'')+Object.values(l.options).filter(Boolean).join(' | '))}</small><span>${l.quantity} × ${money(l.price)}</span></div></div>`).join('')||'<p>העגלה ריקה</p>';
 refreshDelivery();
 button.disabled=!lines.length;
}catch(error){message.textContent=error.message;message.className='status show error';}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(event.submitter?.value!=="bit")return;if(button.disabled||!lines.length)return;
 button.disabled=true;button.querySelector('.bit-button-label').textContent='שומר הזמנה...';
 try{
   checkoutData();
   const customer=Object.fromEntries(new FormData(form));delete customer.paymentProvider;
   const items=lines.map(l=>({productId:l.product.id,quantity:l.quantity,...l.options}));
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({customer,items})));
   const signature=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
   const key='electroshop_bit_request_'+signature;
   let requestId=sessionStorage.getItem(key);if(!requestId){requestId=crypto.randomUUID();sessionStorage.setItem(key,requestId);}
   const order=await createBitOrder(customer,items,requestId);
   form.hidden=true;
   message.className='status show ok';
   showPaymentResult();
   if(order.payment_status==='paid'){message.textContent='הזמנה '+order.order_number+' כבר שולמה. אין צורך להעביר תשלום נוסף.';return;}
   message.innerHTML=`<h2>הזמנה ${esc(order.order_number)}</h2><p>ההזמנה נשמרה וממתינה לתשלום בביט.</p><p>הסכום להעברה: <strong>${money(order.total_ils)}</strong> · ${Number(order.shipping_ils)>0?`כולל משלוח ${money(order.shipping_ils)}`:deliveryLabel()}</p><p>פתחו את ביט והקלידו בו את הסכום המופיע למעלה. ציינו בהערת התשלום את מספר ההזמנה.</p><div style="display:flex;gap:12px;flex-wrap:wrap">${isMobileBit()?`<a class="button" href="${BIT_URL}">פתיחת ביט בטלפון</a>`:`<div style="flex-basis:100%;text-align:center"><p>סרקו את הקוד בטלפון לפתיחת ביט. הקלידו את הסכום המופיע למעלה וציינו בהערה את מספר ההזמנה.</p><img draggable="false" src="images/BIT.webp" alt="קוד QR לתשלום בביט לאלקטרושופ" style="pointer-events:none;user-select:none;display:block;width:420px;max-width:100%;height:auto;object-fit:contain;margin:12px auto;border-radius:12px" decoding="async"></div>`}</div><p>ההזמנה תסומן כשולמה רק לאחר בדיקת קבלת הכסף בחנות. פתיחת ביט אינה אישור תשלום.</p>`;
   // Keep the basket until payment is verified; never claim success or clear it on link opening.
 }catch(error){message.className='status show error';message.textContent=error.message||'לא ניתן לשמור את ההזמנה. נסו שוב.';button.disabled=false;button.querySelector('.bit-button-label').textContent='לתשלום בביט';}
});

export function checkoutData({validateDelivery=true}={}){if(!loaded||!lines.length)throw Error('יש לבדוק את המוצרים בעגלה לפני התשלום');const state=deliveryState(lines,method()),error=deliveryError(state,method(),english);if(validateDelivery&&error)throw Error(error);return {items:lines.map(l=>({productId:l.product.id,quantity:l.quantity,...l.options})),total:state.total};}

