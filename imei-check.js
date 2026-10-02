import {request} from './shop-api.js?v=option-images-2';
import {renderArticleShell} from './shop-articles-shell.js?v=imei-1';
renderArticleShell();

const endpoint='/functions/v1/electroshop-imei',form=document.querySelector('#imeiForm'),status=document.querySelector('#imeiStatus'),button=document.querySelector('#checkButton'),paidFields=document.querySelector('#paidFields'),result=document.querySelector('#imeiResult'),resultGrid=document.querySelector('#resultGrid'),resultHeading=document.querySelector('#resultHeading'),resultModel=document.querySelector('#resultModel'),resultDeviceImage=document.querySelector('#resultDeviceImage'),resultBadge=document.querySelector('#resultBadge'),notice=document.querySelector('#serviceNotice');
const overlay=document.querySelector('#imeiPayment'),frame=document.querySelector('#imeiPaymentFrame'),loading=document.querySelector('#imeiPaymentLoading');
let config={full_enabled:false,gsx_enabled:false,full_price_ils:10,gsx_price_ils:15},timer=0,current=null;
const savedCheckKey='electroshop_imei_check';
const labels={model:'דגם',model_name:'שם הדגם',model_description:'תיאור הדגם',description:'תיאור הדגם',brand:'מותג',manufacturer:'יצרן',imei_number:'IMEI',serial_number:'מספר סידורי',capacity:'נפח אחסון',colour:'צבע',color:'צבע',activation:'מצב הפעלה',activation_status:'מצב הפעלה',coverage:'כיסוי אחריות',coverage_status:'כיסוי אחריות',purchase_date:'תאריך רכישה',purchase_country:'מדינת רכישה',coverage_end_date:'סיום הכיסוי',technical_support:'תמיכה טכנית',support_expiry:'סיום התמיכה',repair_coverage:'כיסוי תיקונים',warranty_expiry:'סיום האחריות',warranty_expires_in:'זמן שנותר לאחריות',registered_device:'מכשיר רשום',active_apple_repair:'תיקון Apple פעיל',replaced_by_apple:'הוחלף על ידי Apple',replacement_device:'מכשיר חלופי',refurbished_device:'מכשיר מחודש',find_my_iphone:'Find My iPhone',fmi:'Find My iPhone',icloud_status:'מצב iCloud',sim_lock:'נעילת SIM',carrier:'מפעיל סלולרי',mdm_status:'מצב MDM',eid:'EID',us_block_status:'חסימה בארה״ב',purchase_country_code:'קוד מדינת רכישה',loaner_status:'מכשיר השאלה',demo_unit:'מכשיר תצוגה',part_number:'מספר חלק',unit_age:'גיל המכשיר',assembly_factory:'מפעל הרכבה',image:'תמונה',image_url:'תמונה',photo:'תמונה',result:'תוצאה'};
const humanKey=key=>labels[String(key).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')]||String(key).replaceAll('_',' ');
const valueText=value=>value==null||value===''?'לא נמסר':typeof value==='boolean'?(value?'כן':'לא'):typeof value==='object'?JSON.stringify(value):String(value);
function parseTextReport(value,out){
 const lines=String(value||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').split(/\n+/).map(line=>line.trim()).filter(Boolean);
 let parsed=false;
 for(const line of lines){const match=/^([^:]{2,60}):\s*(.+)$/.exec(line);if(!match)continue;const key=match[1].trim();out.push([humanKey(key),match[2].replace(/^<+|>+$/g,'').trim()]);parsed=true}
 return parsed;
}

function choose(plan){
 form.elements.plan.value=plan;document.querySelectorAll('.imei-plan').forEach(item=>{const active=item.dataset.plan===plan;item.classList.toggle('active',active);item.setAttribute('aria-selected',String(active))});
 const price=plan==='gsx'?(config.gsx_price_ils||15):(config.full_price_ils||10);paidFields.hidden=false;form.elements.name.required=true;form.elements.email.required=true;button.textContent=`מעבר לתשלום מאובטח - ${price} ₪`;status.textContent='';
}
document.querySelectorAll('.imei-plan').forEach(item=>item.addEventListener('click',()=>choose(item.dataset.plan)));
function lock(value){button.disabled=value;form.querySelectorAll('input').forEach(input=>input.disabled=value)}
function flatten(value,prefix='',out=[]){if(typeof value==='string'&&parseTextReport(value,out))return out;if(value&&typeof value==='object'&&!Array.isArray(value)){for(const [key,item] of Object.entries(value)){const name=prefix?`${prefix} - ${humanKey(key)}`:humanKey(key);if(item&&typeof item==='object')flatten(item,name,out);else if(typeof item==='string'&&parseTextReport(item,out))continue;else out.push([name,valueText(item)])}}else out.push([prefix||'תוצאה',valueText(value)]);return out}
function showReport(data){
 current=data;result.hidden=false;const entries=flatten(data.report||{});const modelEntry=entries.find(([name])=>/דגם|שם הדגם|תיאור הדגם/i.test(name));const imageEntry=entries.find(([name,value])=>/image|תמונה|photo/i.test(name)&&/^https?:\/\//i.test(value));resultModel.textContent=modelEntry?.[1]||'פרטי המכשיר';resultHeading.textContent=`IMEI מסתיים ב-${data.identifier_last4}`;resultBadge.textContent=data.type==='gsx'?'דוח GSX מלא':data.type==='full'?'Full Apple Details':'בדיקה בסיסית';resultDeviceImage.innerHTML='';if(imageEntry){const img=document.createElement('img');img.src=imageEntry[1];img.alt=`תמונת ${resultModel.textContent}`;img.referrerPolicy='no-referrer';img.addEventListener('error',()=>{resultDeviceImage.innerHTML='<i class="fa-solid fa-mobile-screen-button"></i>'});resultDeviceImage.append(img)}else resultDeviceImage.innerHTML='<i class="fa-solid fa-mobile-screen-button"></i>';resultGrid.innerHTML='';for(const [name,value] of entries){if((modelEntry&&name===modelEntry[0]&&value===modelEntry[1])||(imageEntry&&name===imageEntry[0]))continue;const box=document.createElement('dl');box.className='result-item';const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value;const normalized=String(value).trim().toLowerCase();if(/^(yes|active|activated|clean|on|כן|פעיל)$/.test(normalized))dd.dataset.state='good';else if(/^(no|expired|lost|blocked|off|לא|פג תוקף)$/.test(normalized))dd.dataset.state='bad';else if(/date|country|warranty|coverage|תאריך|מדינה|אחריות/i.test(name))dd.dataset.state='info';box.append(dt,dd);resultGrid.append(box)}result.scrollIntoView({behavior:'smooth',block:'start'});
}
function clearSensitiveView(){
 clearTimeout(timer);current=null;result.hidden=true;resultGrid.replaceChildren();resultModel.textContent='';resultHeading.textContent='';resultBadge.textContent='';resultDeviceImage.innerHTML='<i class="fa-solid fa-mobile-screen-button"></i>';status.textContent='';form.elements.identifier.value='';form.elements.name.value='';form.elements.email.value='';form.elements.consent.checked=false;sessionStorage.removeItem(savedCheckKey);
 for(let index=sessionStorage.length-1;index>=0;index--){const key=sessionStorage.key(index);if(key?.startsWith('electroshop_imei_request_'))sessionStorage.removeItem(key)}
}
function forgetCheck(){
 sessionStorage.removeItem(savedCheckKey);
 if(location.search)history.replaceState(null,'',`${location.pathname}${location.hash}`);
}
function rememberCheck(data){sessionStorage.setItem(savedCheckKey,JSON.stringify({check_id:data.check_id,token:data.token}))}
async function statusCheck(checkId,token,attempt=0){
 try{const data=await request(`${endpoint}?action=status&check_id=${encodeURIComponent(checkId)}&token=${encodeURIComponent(token)}`);if(data.status==='completed'){clearTimeout(timer);closePayment(false);forgetCheck();status.textContent='הבדיקה הסתיימה בהצלחה';showReport(data);return}if(data.status==='failed'){clearTimeout(timer);closePayment(false);forgetCheck();status.textContent=data.error||'הבדיקה נכשלה. לא תחויבו שוב בניסיון חוזר.';return}status.textContent=data.payment_status==='paid'?'התשלום התקבל. מכינים את הדוח...':'ממתינים לאישור התשלום...'}catch{}
 if(attempt<300)timer=setTimeout(()=>statusCheck(checkId,token,attempt+1),2000);
}
function openPayment(data){
 const url=new URL(data.iframe_url);if(url.origin!=='https://directng.tranzila.com'||!data.fields?.thtk)throw Error('חלון התשלום שהתקבל אינו תקין');current=data;rememberCheck(data);loading.hidden=false;frame.onload=()=>setTimeout(()=>loading.hidden=true,250);frame.src='about:blank';overlay.hidden=false;document.body.style.overflow='hidden';const paymentForm=document.createElement('form');paymentForm.method='POST';paymentForm.action=url.href;paymentForm.target=frame.name;for(const [name,value] of Object.entries(data.fields)){const input=document.createElement('input');input.type='hidden';input.name=name;input.value=String(value??'');paymentForm.append(input)}paymentForm.hidden=true;document.body.append(paymentForm);paymentForm.submit();paymentForm.remove();setTimeout(()=>loading.hidden=true,1800);statusCheck(data.check_id,data.token);
}
function closePayment(unlock=true){overlay.hidden=true;frame.src='about:blank';document.body.style.overflow='';clearTimeout(timer);if(unlock)lock(false)}
document.querySelector('#closeImeiPayment').addEventListener('click',()=>closePayment());overlay.addEventListener('click',event=>{if(event.target===overlay)closePayment()});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!overlay.hidden)closePayment()});

form.addEventListener('submit',async event=>{
 event.preventDefault();if(!form.reportValidity())return;result.hidden=true;lock(true);status.textContent=form.elements.plan.value==='full'?'פותחים תשלום מאובטח...':'מבצעים את הבדיקה...';
 try{const identifier=form.elements.identifier.value.trim(),plan=form.elements.plan.value,requestKey=`electroshop_imei_request_${plan}_${identifier}_${form.elements.email.value.trim().toLowerCase()}`;let requestId=sessionStorage.getItem(requestKey);if(!requestId){requestId=crypto.randomUUID();sessionStorage.setItem(requestKey,requestId)}const data=await request(endpoint,{method:'POST',body:{action:'start',plan,identifier,name:form.elements.name.value,email:form.elements.email.value,request_id:requestId}});openPayment(data);return}catch(error){status.textContent=error.message||'הבדיקה לא הושלמה. נסו שוב.'}finally{if(overlay.hidden)lock(false)}
});

try{config=await request(endpoint+'?action=config');const enabled=[config.full_enabled,config.gsx_enabled];if(enabled.some(value=>!value)){notice.hidden=false;notice.textContent=enabled.every(value=>!value)?'החיבור לשירות הבדיקות נמצא בהשלמה וייפתח בקרוב.':'חלק מסוגי הבדיקות אינם זמינים כרגע.'}document.querySelector('[data-plan=full]').disabled=!config.full_enabled;document.querySelector('[data-plan=gsx]').disabled=!config.gsx_enabled;if(config.full_enabled)choose('full');else if(config.gsx_enabled)choose('gsx');else button.disabled=true}catch{notice.hidden=false;notice.textContent='לא ניתן לטעון כרגע את שירות הבדיקות.';button.disabled=true}
const params=new URLSearchParams(location.search),saved=JSON.parse(sessionStorage.getItem(savedCheckKey)||'null'),check=params.get('check')||saved?.check_id,token=params.get('token')||saved?.token;if(check&&token){status.textContent=params.get('payment')==='fail'?'התשלום לא אושר.':'בודקים את מצב הבדיקה...';statusCheck(check,token)}
window.addEventListener('pagehide',clearSensitiveView);
window.addEventListener('pageshow',event=>{if(event.persisted)clearSensitiveView()});
