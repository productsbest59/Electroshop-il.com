function verifyReport(transaction:Record<string,unknown>,total:unknown,expectedIndex:string){
 const parts=/^(\d+)(?:\.(\d{1,2}))?$/.exec(String(total??'').trim());
 const expectedMinor=parts?Number(parts[1])*100+Number((parts[2]||'').padEnd(2,'0')):NaN;
 const amountText=String(transaction.amount??'').trim(),amountMinor=/^\d+$/.test(amountText)?Number(amountText):NaN;
 const amountMatches=Number.isSafeInteger(expectedMinor)&&expectedMinor>0&&Number.isSafeInteger(amountMinor)&&amountMinor===expectedMinor;
 const responseCode=String(transaction.processor_response_code??transaction.response_code??''),currency=String(transaction.currency??transaction.currency_code??''),reportedIndex=String(transaction.index??transaction.transaction_index??'');
 const indexMatches=/^\d+$/.test(expectedIndex)&&reportedIndex===expectedIndex,currencyMatches=currency==='1'||currency.toUpperCase()==='ILS',chargeMatches=transaction.tranmode==='A'&&transaction.txn_type==='DEBIT'&&!transaction.cancelfdid;
 return {approved:responseCode==='000'&&amountMatches&&currencyMatches&&indexMatches&&chargeMatches,responseCode,currency,reportedIndex,amountMinor,expectedMinor,amountMatches,currencyMatches,indexMatches,chargeMatches};
}

const SUPABASE_URL=Deno.env.get('SUPABASE_URL')||'';
const STORE_URL=(Deno.env.get('ELECTROSHOP_STORE_PUBLIC_URL')||'https://electroshop-il.com').replace(/\/$/,'');
const TERMINAL=Deno.env.get('ELECTROSHOP_TRANZILA_TERMINAL')||'';
const APP_KEY=Deno.env.get('ELECTROSHOP_TRANZILA_APP_KEY')||'';
const APP_SECRET=Deno.env.get('ELECTROSHOP_TRANZILA_APP_SECRET')||'';
const NOTIFY_SECRET=Deno.env.get('ELECTROSHOP_TRANZILA_NOTIFY_SECRET')||'';
const PAYMENT_ENABLED=Deno.env.get('ELECTROSHOP_TRANZILA_PAYMENTS_ENABLED')==='true';
const IFREE_URL=Deno.env.get('IFREEICLOUD_API_URL')||'https://api.ifreeicloud.co.uk';
const IFREE_KEY=Deno.env.get('IFREEICLOUD_API_KEY')||'';
const FULL_SERVICE=Deno.env.get('IFREEICLOUD_FULL_SERVICE_ID')||'281';
const GSX_SERVICE=Deno.env.get('IFREEICLOUD_GSX_SERVICE_ID')||'206';
const BREVO_KEY=Deno.env.get('BREVO_API_KEY')||'';
const STORE_EMAIL=Deno.env.get('ELECTROSHOP_STORE_EMAIL')||'electroshopisraelo@gmail.com';
const FULL_PRICE=10;
const GSX_PRICE=15;
const cors={'Access-Control-Allow-Origin':'https://electroshop-il.com','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
const serviceKey=()=>Deno.env.get('SUPABASE_SECRET_KEY')||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const escape=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

async function db(path:string,options:RequestInit={}){
 if(!/^electroshop_imei_checks(?:\?|$)/.test(path))throw Error('Database scope violation');
 const key=serviceKey();if(!key)throw Error('Supabase service key is unavailable');
 const response=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...(options.headers||{})}});
 const data=await response.json().catch(()=>null);if(!response.ok)throw Error(data?.message||`Database request failed (${response.status})`);return data;
}
function validIdentifier(value:unknown){const clean=String(value||'').trim().toUpperCase().replace(/[\s-]/g,'');if(/^\d{15}$/.test(clean)){let sum=0;for(let i=0;i<15;i++){let n=Number(clean[i]);if(i%2){n*=2;if(n>9)n-=9}sum+=n}if(sum%10!==0)throw Error('מספר ה-IMEI אינו תקין');return clean}if(/^[A-Z0-9]{8,18}$/.test(clean))return clean;throw Error('יש להזין IMEI בן 15 ספרות או מספר סידורי תקין')}
function email(value:unknown){const clean=String(value||'').trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean))throw Error('יש להזין כתובת אימייל תקינה');return clean}
function safeReport(value:any){
 if(value&&typeof value==='object')return value;
 const text=String(value||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&');
 const report:Record<string,string>={};
 for(const line of text.split(/\n+/).map(item=>item.trim()).filter(Boolean)){const match=/^([^:]{2,60}):\s*(.+)$/.exec(line);if(!match)continue;const key=match[1].trim().toLowerCase().replace(/[^a-z0-9]+/g,'_');report[key]=match[2].replace(/^<+|>+$/g,'').trim()}
 return Object.keys(report).length?report:{result:text.trim()||'לא התקבלה תשובה מפורטת'};
}

async function providerCheck(identifier:string,service:string){
 if(!IFREE_URL||!IFREE_KEY||!service)throw Error('שירות הבדיקה עדיין אינו מוגדר');
 const body=new URLSearchParams({service,imei:identifier,key:IFREE_KEY});
 const response=await fetch(IFREE_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json,text/plain,*/*'},body,signal:AbortSignal.timeout(45000)});
 const text=await response.text();if(!response.ok)throw Error(`ספק הבדיקה לא זמין כרגע (${response.status})`);
 let data:any;try{data=JSON.parse(text)}catch{data={result:text}}
 if(data?.error||data?.success===false)throw Error(String(data.error||data.message||'הבדיקה נכשלה אצל הספק'));
 return safeReport(data?.success===true&&data?.response!=null?data.response:data);
}
async function completeCheck(row:any){
 if(row.check_status==='completed')return row;
 const claim=await db(`electroshop_imei_checks?id=eq.${encodeURIComponent(row.id)}&check_status=in.(pending,failed)`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({check_status:'processing',error_message:null,updated_at:new Date().toISOString()})});
 if(!claim.length)return row;
 try{
  const service=row.check_type==='gsx'?GSX_SERVICE:FULL_SERVICE;
  const report=await providerCheck(row.identifier,service);
  const updated=(await db(`electroshop_imei_checks?id=eq.${encodeURIComponent(row.id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({check_status:'completed',report,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()})}))[0];
  if(row.customer_email)await sendReportEmail(updated).catch(error=>console.error('IMEI email:',error.message));
  return updated;
 }catch(error){const message=error instanceof Error?error.message:'הבדיקה נכשלה';await db(`electroshop_imei_checks?id=eq.${encodeURIComponent(row.id)}`,{method:'PATCH',body:JSON.stringify({check_status:'failed',error_message:message,updated_at:new Date().toISOString()})});throw Error(message)}
}
async function sendReportEmail(row:any){
 if(!BREVO_KEY||row.email_sent_at)return;
 const items=Object.entries(row.report||{}).map(([key,value])=>`<tr><th style="text-align:right;padding:8px;border:1px solid #ddd">${escape(key)}</th><td style="padding:8px;border:1px solid #ddd">${escape(typeof value==='object'?JSON.stringify(value):value)}</td></tr>`).join('');
 const html=`<div dir="rtl" style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#222"><h1>אלקטרושופ - תוצאות בדיקת מכשיר</h1><p>שלום ${escape(row.customer_name||'')},</p><p>הבדיקה עבור המזהה המסתיים ב-${escape(row.identifier_last4)} הסתיימה.</p><table style="width:100%;border-collapse:collapse">${items}</table><p style="margin-top:20px">המידע התקבל מספק מידע חיצוני ונכון למועד הבדיקה. אין בו התחייבות למצבו הפיזי של המכשיר.</p><p><a href="${STORE_URL}/imei-check.html">חזרה לאלקטרושופ</a></p></div>`;
 const response=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':BREVO_KEY,'Content-Type':'application/json'},body:JSON.stringify({sender:{name:'אלקטרושופ',email:STORE_EMAIL},replyTo:{name:'אלקטרושופ',email:STORE_EMAIL},to:[{email:row.customer_email,name:row.customer_name||undefined}],bcc:[{email:STORE_EMAIL,name:'אלקטרושופ'}],subject:'תוצאות בדיקת IMEI | אלקטרושופ',htmlContent:html}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error(`שליחת הדוח נדחתה (${response.status})`);await db(`electroshop_imei_checks?id=eq.${encodeURIComponent(row.id)}`,{method:'PATCH',body:JSON.stringify({email_sent_at:new Date().toISOString()})});
}
function nonce(){const bytes=new Uint8Array(40);crypto.getRandomValues(bytes);return [...bytes].map(v=>v.toString(16).padStart(2,'0')).join('')}
async function tranzilaHeaders(){const time=String(Math.floor(Date.now()/1000)),n=nonce(),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(`${APP_SECRET}${time}${n}`),{name:'HMAC',hash:'SHA-256'},false,['sign']),signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(APP_KEY));return {'X-tranzila-api-app-key':APP_KEY,'X-tranzila-api-request-time':time,'X-tranzila-api-nonce':n,'X-tranzila-api-access-token':[...new Uint8Array(signature)].map(v=>v.toString(16).padStart(2,'0')).join('')};}
async function startPayment(row:any){
 if(!PAYMENT_ENABLED||!TERMINAL||!APP_KEY||!APP_SECRET)throw Error('התשלום המאובטח אינו זמין כרגע');
 if(row.payment_request_id){return paymentPayload(row)}
 const amount=Number(row.amount_ils);
 const response=await fetch('https://api.tranzila.com/v2/handshake/create',{method:'POST',headers:{'Content-Type':'application/json',...(await tranzilaHeaders())},body:JSON.stringify({terminal_name:TERMINAL,sum:amount,request_params:{imei_check_id:row.id}})}),data=await response.json().catch(()=>null);
 if(!response.ok||Number(data?.error_code)!==0||!data?.thtk)throw Error('לא ניתן לפתוח תשלום כרגע');
 row=(await db(`electroshop_imei_checks?id=eq.${encodeURIComponent(row.id)}&payment_request_id=is.null`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({payment_request_id:String(data.thtk),updated_at:new Date().toISOString()})}))[0]||row;return paymentPayload(row);
}
function paymentPayload(row:any){
 const callback=`${SUPABASE_URL}/functions/v1/electroshop-imei`,notifyKey=NOTIFY_SECRET.length>=64?`&notify_key=${encodeURIComponent(NOTIFY_SECRET)}`:'';
 return {check_id:row.id,token:row.public_token,iframe_url:`https://directng.tranzila.com/${encodeURIComponent(TERMINAL)}/iframenew.php`,fields:{sum:String(Number(row.amount_ils)),currency:'1',thtk:String(row.payment_request_id),new_process:'1',tranmode:'A',contact:row.customer_name||'',company:row.customer_name||'',email:row.customer_email||'',pdesc:row.check_type==='gsx'?'Electroshop Full GSX report':'Electroshop Full Apple Details check',lang:'il',success_url_address:`${callback}?action=success&check=${row.id}&token=${row.public_token}`,fail_url_address:`${callback}?action=fail&check=${row.id}&token=${row.public_token}`,notify_url_address:`${callback}?action=notify${notifyKey}`}};
}
function first(body:Record<string,unknown>,keys:string[]){for(const key of keys)if(body[key]!=null&&String(body[key]).trim())return String(body[key]).trim();return''}
async function transaction(index:string){const response=await fetch('https://report.tranzila.com/v1/transaction',{method:'POST',headers:{'Content-Type':'application/json',...(await tranzilaHeaders())},body:JSON.stringify({terminal_name:TERMINAL,transaction_index:Number(index),detailed:'Y'})}),data=await response.json().catch(()=>null);if(!response.ok||!data?.transactions?.[0])throw Error('לא ניתן לאמת את העסקה');return data.transactions[0]}
async function notify(body:Record<string,unknown>,authenticated:boolean){
 let params:Record<string,unknown>={};if(typeof body.request_params==='object'&&body.request_params)params=body.request_params as Record<string,unknown>;else if(typeof body.request_params==='string')try{params=JSON.parse(body.request_params)}catch{}
 const checkId=first({...params,...body},['imei_check_id','check_id']),paymentId=first(body,['pr_id','payment_request_id','thtk']),index=first(body,['transaction_index','index','transaction_id']);if(!/^[-0-9a-f]{36}$/i.test(checkId)&&!paymentId)throw Error('אסמכתת בדיקה חסרה');if(!/^\d+$/.test(index))throw Error('מזהה עסקה אינו תקין');
 const rows=await db(/^[-0-9a-f]{36}$/i.test(checkId)?`electroshop_imei_checks?id=eq.${encodeURIComponent(checkId)}&limit=1`:`electroshop_imei_checks?payment_request_id=eq.${encodeURIComponent(paymentId)}&limit=1`),row=rows[0];if(!row)throw Error('הבדיקה לא נמצאה');if(row.payment_status==='paid'){await completeCheck(row);return{ok:true}}
 const report=await transaction(index),legacy=String(report?.request_params?.imei_check_id||'')===row.id;if(!authenticated&&!legacy)throw Error('התראת תשלום לא מאומתת');const verified=verifyReport(report,Number(row.amount_ils),index);
 row.payment_status=verified.approved?'paid':'failed';await db(`electroshop_imei_checks?id=eq.${encodeURIComponent(row.id)}`,{method:'PATCH',body:JSON.stringify({payment_status:row.payment_status,payment_transaction_id:verified.reportedIndex,payment_response_code:verified.responseCode||'verification_failed',paid_at:verified.approved?new Date().toISOString():null,updated_at:new Date().toISOString()})});if(verified.approved)await completeCheck(row);return{ok:verified.approved};
}
function publicRow(row:any){return {check_id:row.id,token:row.public_token,type:row.check_type,payment_status:row.payment_status,status:row.check_status,identifier_last4:row.identifier_last4,report:row.check_status==='completed'?row.report:null,error:row.check_status==='failed'?row.error_message:null,created_at:row.created_at,completed_at:row.completed_at}}

Deno.serve(async request=>{
 if(request.method==='OPTIONS')return new Response('ok',{headers:cors});
 try{
  const url=new URL(request.url),body=request.method==='POST'?await request.json().catch(()=>({})):Object.fromEntries(url.searchParams),action=String((body as any).action||url.searchParams.get('action')||'config');
  if(action==='config')return reply({basic_enabled:false,full_enabled:!!(IFREE_URL&&IFREE_KEY&&FULL_SERVICE&&PAYMENT_ENABLED&&TERMINAL&&APP_KEY&&APP_SECRET),gsx_enabled:!!(IFREE_URL&&IFREE_KEY&&GSX_SERVICE&&PAYMENT_ENABLED&&TERMINAL&&APP_KEY&&APP_SECRET),full_price_ils:FULL_PRICE,gsx_price_ils:GSX_PRICE});
  if(action==='basic')return reply({error:'הבדיקה החינמית אינה זמינה'},410);
  if(action==='start'){const identifier=validIdentifier((body as any).identifier),customerEmail=email((body as any).email),name=String((body as any).name||'').trim(),plan=String((body as any).plan||'full');if(!name)throw Error('יש להזין שם מלא');if(!['full','gsx'].includes(plan))throw Error('סוג הבדיקה אינו תקין');const requestId=String((body as any).request_id||'');if(!/^[-0-9a-f]{36}$/i.test(requestId))throw Error('מזהה בקשה אינו תקין');let row=(await db(`electroshop_imei_checks?request_id=eq.${requestId}&limit=1`))[0];if(!row)row=(await db('electroshop_imei_checks',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({request_id:requestId,identifier,identifier_last4:identifier.slice(-4),customer_name:name,customer_email:customerEmail,check_type:plan,amount_ils:plan==='gsx'?GSX_PRICE:FULL_PRICE,payment_status:'pending'})}))[0];return reply(await startPayment(row))}
  if(action==='status'){const id=String((body as any).check_id||''),token=String((body as any).token||'');if(!/^[-0-9a-f]{36}$/i.test(id)||!/^[-0-9a-f]{36}$/i.test(token))throw Error('קישור בדיקה אינו תקין');const row=(await db(`electroshop_imei_checks?id=eq.${id}&public_token=eq.${token}&limit=1`))[0];if(!row)return reply({error:'הבדיקה לא נמצאה'},404);return reply(publicRow(row))}
  if(action==='notify'){const authenticated=NOTIFY_SECRET.length>=64&&url.searchParams.get('notify_key')===NOTIFY_SECRET;return reply(await notify(body as Record<string,unknown>,authenticated))}
  if(action==='success'||action==='fail'){const id=url.searchParams.get('check')||'',token=url.searchParams.get('token')||'';return Response.redirect(`${STORE_URL}/imei-check.html?check=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}&payment=${action}`,303)}
  return reply({error:'פעולה לא מוכרת'},400);
 }catch(error){const message=error instanceof Error?error.message:'הבקשה נכשלה';console.error('electroshop-imei:',message);return reply({error:message},500)}
});
