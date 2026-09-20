import {getSession,isAdmin,SUPABASE_URL,PUBLISHABLE_KEY} from './shop-api.js?v=multi-category-1';
if(!location.pathname.endsWith('/shop-product-editor.html')&&!new URLSearchParams(location.search).has('edit')&&!new URLSearchParams(location.search).has('new')){
 const session=await getSession();
 if(session&&await isAdmin(session)){
  const button=document.createElement('button');button.type='button';button.className='button secondary';button.textContent='עדכון מכשירים';
  document.querySelector('.head-actions').append(button);
  const output=document.createElement('div');output.className='device-sync-status';output.setAttribute('role','status');document.querySelector('#list').before(output);
  button.onclick=async()=>{
   button.disabled=true;output.textContent='קורא את קטלוג פלאפון…';let added=0,updated=0,done=0;const failures=[];
   const call=async body=>{const current=await getSession();if(!current)throw Error('יש להתחבר מחדש');const r=await fetch(SUPABASE_URL+'/functions/v1/electroshop-sync-devices',{method:'POST',headers:{apikey:PUBLISHABLE_KEY,Authorization:'Bearer '+current.accessToken,'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok||data.error)throw Error(data.error||'העדכון נכשל');return data};
   try{const {devices}=await call({action:'list'});for(let i=0;i<devices.length;i+=3){const batch=devices.slice(i,i+3);try{const {results}=await call({ids:batch.map(d=>d.id)});for(const result of results){if(result.error)failures.push(result.name+': '+result.error);else if(result.status==='added')added++;else updated++}}catch(e){failures.push(...batch.map(d=>d.name+': '+e.message))}done+=batch.length;output.textContent=`עודכנו ${done} מתוך ${devices.length} מכשירים…`}
    output.textContent=`העדכון הסתיים: ${added} נוספו, ${updated} עודכנו, ${failures.length} נכשלו.`;
    if(failures.length){const details=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p');summary.textContent='פירוט מכשירים שלא עודכנו';text.style.whiteSpace='pre-line';text.textContent=failures.join('\n');details.append(summary,text);output.append(details)}
    localStorage.setItem('electroshop_products_updated',crypto.randomUUID());document.dispatchEvent(new Event('electroshop-devices-updated'));
   }catch(e){output.textContent=e.message}finally{button.disabled=false}
  };
 }
}
