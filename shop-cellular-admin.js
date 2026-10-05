import {renderArticleShell} from './shop-articles-shell.js?v=cellular-2';
import {getSession,isAdmin,request} from './shop-api.js?v=cellular-1';
import {cellularConfig} from './cellular-config.js?v=2';
import {renderPlans} from './cellular-render.mjs?v=2';
renderArticleShell();
const status=document.querySelector('#adminStatus'),sync=document.querySelector('#syncCatalogue'),publish=document.querySelector('#publishCatalogue'),review=document.querySelector('#review'),choice=document.querySelector('#providerChoice');
let session,proposal,busy=false;
try {
  session=await getSession();
  if(!session || await isAdmin(session)!==true) throw Error('נדרשת כניסת מנהל. היכנס דרך מסך ניהול המוצרים וחזור לכאן.');
  if(!cellularConfig.syncEnabled) throw Error('הסנכרון מוכן בקוד אך עדיין לא הופעל בשרת. אין כפתור פעיל עד להשלמת ההתקנה; הקטלוג השמור לא משתנה.');
  sync.disabled=false;status.textContent='בחר חברה ולחץ סנכרון. שום שינוי לא יפורסם עד שתאשר.';
}catch(error){status.textContent=error.message;}
function discard(){proposal=null;review.hidden=true;publish.disabled=true;}
choice.addEventListener('change',discard);
document.querySelector('#cancelReview').onclick=()=>{discard();status.textContent='בוטל. הקטלוג הקיים לא השתנה.';};
sync.onclick=async()=>{
 if(busy)return;busy=true;sync.disabled=true;choice.disabled=true;discard();status.textContent='קורא ומאמת את כל החבילות ותנאי המחיר…';
 try{
  session=await getSession();if(!session)throw Error('החיבור פג. היכנס מחדש.');
  const result=await request('/functions/v1/electroshop-sync-cellular',{method:'POST',token:session.accessToken,body:{action:'sync',provider:choice.value}});
  proposal=result.proposal;
  let previous=result.previous;
  if(!previous.length){const snapshots=await fetch('cellular-data.json').then(r=>r.json());previous=snapshots.find(s=>s.provider===choice.value)?.plans||[];}
  const before=new Map(previous.map(p=>[p.id,p])),after=new Map(proposal.plans.map(p=>[p.id,p]));
  const added=proposal.plans.filter(p=>!before.has(p.id)),removed=previous.filter(p=>!after.has(p.id)),changed=proposal.plans.filter(p=>before.has(p.id)&&JSON.stringify(before.get(p.id))!==JSON.stringify(p));
  document.querySelector('#changeSummary').textContent=`${proposal.plans.length} חבילות נבדקו.\nחדשות: ${added.length} · השתנו: ${changed.length} · הוסרו: ${removed.length}\n${removed.length?'הוסרו מהמקור: '+removed.map(p=>p.name).join(', '):''}`;
  document.querySelector('#reviewGrid').innerHTML=renderPlans(proposal.plans);
  document.querySelector('.cellular-shell').className=`cellular-shell provider-${choice.value}`;
  review.hidden=false;publish.disabled=false;status.textContent='התצוגה המקדימה מוכנה. בדוק את כל התנאים לפני אישור.';
 }catch(error){status.textContent=error.message+' הקטלוג הקיים לא השתנה.';}
 finally{busy=false;sync.disabled=false;choice.disabled=false;}
};
publish.onclick=async()=>{
 if(!proposal||busy)return;
 if(!confirm('בדקת את המחירים, מספר הקווים ותקופות המבצע? האישור יפרסם את הקטלוג של החברה הנבחרת.'))return;
 busy=true;publish.disabled=true;sync.disabled=true;choice.disabled=true;
 try{session=await getSession();if(!session)throw Error('החיבור פג');const result=await request('/rest/v1/rpc/electroshop_publish_cellular',{method:'POST',body:{p_id:proposal.id},token:session.accessToken});discard();status.textContent=`פורסמו ${result.count} חבילות בהצלחה. ניתן לפתוח את דף החברה לבדיקה.`;}
 catch(error){status.textContent=error.message;publish.disabled=false;}
 finally{busy=false;sync.disabled=false;choice.disabled=false;}
};
