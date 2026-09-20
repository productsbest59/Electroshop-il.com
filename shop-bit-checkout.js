import {getProducts,createBitOrder} from './shop-api.js?v=multi-category-1';
const BIT_URL='https://www.bitpay.co.il/app/me/54E3CA02-7B91-2A87-B0E5-9C89BB3228770630';
const form=document.getElementById('checkoutForm'),message=document.getElementById('message'),button=form.querySelector('[value="bit"]');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>`${Number(n).toLocaleString('he-IL',{maximumFractionDigits:2})} ₪`;
let lines=[],shipping=0;
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
 shipping=lines.some(l=>(l.product.categoryKeys||l.product.categories||[l.product.category]).includes('smartphones')||l.product.sku?.startsWith('PELEPHONE-'))?50:0;
 const total=lines.reduce((n,l)=>n+l.quantity*l.price,0)+shipping;
 document.getElementById('summaryLines').innerHTML=lines.map(l=>`<div class="summary-line"><img src="${esc(l.product.images?.[0]||'')}" alt=""><div><strong>${esc(l.product.nameHe)}</strong><small>${esc(Object.values(l.options).filter(Boolean).join(' | '))}</small><span>${l.quantity} × ${money(l.price)}</span></div></div>`).join('')||'<p>העגלה ריקה</p>';
 document.getElementById('summaryTotal').innerHTML=`<small>${shipping?`משלוח מכשירים: ${money(shipping)}`:'משלוח חינם'}</small><span>סה״כ לתשלום</span><strong>${money(total)}</strong>`;
 button.disabled=!lines.length;
}catch(error){message.textContent=error.message;message.className='status show error';}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(button.disabled||!lines.length)return;
 button.disabled=true;button.querySelector('.bit-button-label').textContent='שומר הזמנה...';
 try{
   const customer=Object.fromEntries(new FormData(form));delete customer.paymentProvider;
   const items=lines.map(l=>({productId:l.product.id,quantity:l.quantity,...l.options}));
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({customer,items})));
   const signature=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
   const key='electroshop_bit_request_'+signature;
   let requestId=sessionStorage.getItem(key);if(!requestId){requestId=crypto.randomUUID();sessionStorage.setItem(key,requestId);}
   const order=await createBitOrder(customer,items,requestId);
   form.hidden=true;
   message.className='status show ok';
   if(order.payment_status==='paid'){message.textContent='הזמנה '+order.order_number+' כבר שולמה. אין צורך להעביר תשלום נוסף.';return;}
   message.innerHTML=`<h2>הזמנה ${esc(order.order_number)}</h2><p>ההזמנה נשמרה וממתינה לתשלום בביט.</p><p>הסכום להעברה: <strong>${money(order.total_ils)}</strong> · ${Number(order.shipping_ils)>0?`כולל משלוח ${money(order.shipping_ils)}`:'משלוח חינם'}</p><p>העתיקו את הסכום, פתחו את ביט והזינו אותו שם. ציינו בהערת התשלום את מספר ההזמנה.</p><div style="display:flex;gap:12px;flex-wrap:wrap"><button type="button" class="button" id="copyBitAmount">העתקת הסכום</button><a class="button" href="${BIT_URL}" target="_blank" rel="noopener">פתיחת ביט לתשלום</a></div><p id="bitCopyStatus" role="status"></p><p>ההזמנה תסומן כשולמה רק לאחר בדיקת קבלת הכסף בחנות. פתיחת ביט אינה אישור תשלום.</p>`;
   document.getElementById('copyBitAmount').onclick=async()=>{const status=document.getElementById('bitCopyStatus');try{await navigator.clipboard.writeText(Number(order.total_ils).toFixed(2));status.textContent='הסכום הועתק';}catch{status.textContent='לא ניתן להעתיק אוטומטית. הסכום להעברה: '+money(order.total_ils);}};
   // Keep the basket until payment is verified; never claim success or clear it on link opening.
 }catch(error){message.className='status show error';message.textContent=error.message||'לא ניתן לשמור את ההזמנה. נסו שוב.';button.disabled=false;button.querySelector('.bit-button-label').textContent='לתשלום בביט';}
});
