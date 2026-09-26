const URL_BASE = Deno.env.get('SUPABASE_URL') || '';
const CLIENT_ID = Deno.env.get('ELECTROSHOP_PAYPAL_CLIENT_ID') || '';
const SECRET = Deno.env.get('ELECTROSHOP_PAYPAL_CLIENT_SECRET') || '';
const ENV = Deno.env.get('ELECTROSHOP_PAYPAL_ENV');
const BASE = ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'GET, POST, OPTIONS'};
const json = (data: unknown, status = 200) => Response.json(data, {status,headers:cors});
const uuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
function cents(value: unknown) {
 const text=String(value); if(!/^\d+(?:\.\d{1,2})?$/.test(text))throw Error('Invalid amount');
 const [whole,fraction='']=text.split('.');const result=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(result))throw Error('Invalid amount');return result;
}
const amount=(value:unknown)=>(cents(value)/100).toFixed(2);
async function db(path: string, method='GET', body?: unknown) {
 if(!/^(electroshop_orders\?|rpc\/create_electroshop_paypal_order$)/.test(path))throw Error('Database scope violation');
 const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
 const response=await fetch(`${URL_BASE}/rest/v1/${path}`,{method,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await response.json().catch(()=>null);if(!response.ok)throw Error('לא ניתן לעדכן את ההזמנה');return data;
}
async function paypal(path: string, method='GET', body?: unknown, requestId?: string) {
 if(!CLIENT_ID||!SECRET||!['live','sandbox'].includes(ENV||''))throw Error('PayPal is not configured');
 const auth=await fetch(`${BASE}/v1/oauth2/token`,{method:'POST',headers:{Authorization:'Basic '+btoa(CLIENT_ID+':'+SECRET),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials'});
 const token=await auth.json();if(!auth.ok||!token.access_token)throw Error('PayPal authentication failed');
 const response=await fetch(BASE+path,{method,headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json',Prefer:'return=representation',...(requestId?{'PayPal-Request-Id':requestId}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await response.json();if(!response.ok)throw Error(data.details?.[0]?.issue || 'PayPal request failed');return data;
}
async function orderById(id: string) {
 if(!uuid(id))throw Error('Invalid order ID');
 const rows=await db(`electroshop_orders?id=eq.${id}&select=*&limit=1`);
 if(!rows?.[0]||rows[0].payment_provider!=='paypal')throw Error('Order not found');return rows[0];
}
async function start(body: any) {
 if(!uuid(String(body.request_id||'')))throw Error('Invalid request ID');
 const created=await db('rpc/create_electroshop_paypal_order','POST',{p_customer:body.customer,p_items:body.items,p_request_id:body.request_id});
 const order=await orderById(created.id);
 if(order.payment_status==='paid')throw Error('ההזמנה כבר שולמה. אין לשלם שוב.');
 if(cents(order.total)<=0||cents(order.total)!==cents(order.subtotal)+cents(order.shipping_amount))throw Error('Invalid order total');
 // Require the buyer to see and approve the authoritative total after any price change.
 if(cents(body.expected_total)!==cents(order.total))throw Error('המחיר התעדכן. יש לרענן את הדף לפני התשלום.');
 let result;
 if(order.payment_request_id){
  result=await paypal('/v2/checkout/orders/'+encodeURIComponent(order.payment_request_id));
  if(!['CREATED','SAVED','PAYER_ACTION_REQUIRED','APPROVED'].includes(result.status))throw Error('יש לבדוק את מצב ההזמנה לפני ניסיון תשלום נוסף.');
 } else {
  result=await paypal('/v2/checkout/orders','POST',{
   intent:'CAPTURE',purchase_units:[{reference_id:order.id,custom_id:order.id,invoice_id:order.order_number,
    amount:{currency_code:'ILS',value:amount(order.total),breakdown:{item_total:{currency_code:'ILS',value:amount(order.subtotal)},shipping:{currency_code:'ILS',value:amount(order.shipping_amount)}}}}],
   application_context:{brand_name:'Electroshop',user_action:'PAY_NOW',shipping_preference:'NO_SHIPPING'}
  },order.id);
  if(!result.id)throw Error('PayPal did not return an order');
  await db(`electroshop_orders?id=eq.${order.id}&payment_status=neq.paid`,'PATCH',{payment_request_id:result.id,payment_response_code:result.status});
 }
 return {paypal_order_id:result.id,order_id:order.id,order_number:order.order_number,total:amount(order.total),shipping:amount(order.shipping_amount)};
}
async function capture(body:any) {
 const order=await orderById(String(body.order_id||''));
 const id=String(body.paypal_order_id||'');
 if(!id||id!==order.payment_request_id)throw Error('PayPal order mismatch');
 if(order.payment_status==='paid')return {ok:true,paid:true,order_number:order.order_number};
 // A retry reads an existing capture instead of charging a second time.
 let result=await paypal('/v2/checkout/orders/'+encodeURIComponent(id));
 if(result.status==='APPROVED'){await paypal(`/v2/checkout/orders/${encodeURIComponent(id)}/capture`,'POST',{},'capture-'+order.id);result=await paypal('/v2/checkout/orders/'+encodeURIComponent(id));}
 const units=result.purchase_units||[];const unit=units[0];const captures=unit?.payments?.captures||[];const payment=captures[0];
 if(result.id!==id||units.length!==1||unit.custom_id!==order.id||unit.reference_id!==order.id||unit.amount?.currency_code!=='ILS'||cents(unit.amount.value)!==cents(order.total))throw Error('Payment verification failed');
 if(result.status!=='COMPLETED'||payment?.status!=='COMPLETED')return {ok:true,paid:false,pending:true};
 if(captures.length!==1||!payment.id||payment.amount?.currency_code!=='ILS'||cents(payment.amount.value)!==cents(order.total))throw Error('Payment amount mismatch');
 const now=new Date().toISOString();
 await db(`electroshop_orders?id=eq.${order.id}&payment_status=neq.paid`,'PATCH',{payment_status:'paid',payment_transaction_id:payment.id,payment_response_code:'COMPLETED',payment_method_details:result.payment_source?.card?'כרטיס אשראי דרך PayPal':'PayPal',payment_paid_at:now,paid_at:now,payment_callback_received_at:now});
 return {ok:true,paid:true,order_number:order.order_number};
}
Deno.serve(async(request:Request)=>{
 if(request.method==='OPTIONS')return new Response('ok',{headers:cors});
 try{
  const url=new URL(request.url);
  if(request.method==='GET'&&url.searchParams.get('action')==='config')return json({client_id:CLIENT_ID,currency:'ILS',enabled:!!CLIENT_ID&&!!SECRET&&ENV==='live'});
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  const body=await request.json();
  if(body.action==='start')return json(await start(body));
  if(body.action==='capture')return json(await capture(body));
  if(body.action==='status'){const order=await orderById(String(body.order_id||''));return json({payment_status:order.payment_status,order_number:order.order_number});}
  return json({error:'Unknown action'},400);
 }catch(error){console.error('Electroshop PayPal failed',error instanceof Error?error.message:'Unknown error');return json({error:error instanceof Error?error.message:'Payment request failed'},400);}
});

