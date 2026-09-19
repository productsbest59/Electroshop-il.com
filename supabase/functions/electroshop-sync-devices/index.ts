import {catalogue,device} from './parser.mjs';
const cors={'Access-Control-Allow-Origin':'https://electroshop-il.com','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
Deno.serve(async req=>{
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 const auth=req.headers.get('authorization');if(!auth)return reply({error:'נדרשת כניסת מנהל'},401);
 const headers={Authorization:auth,apikey:Deno.env.get('SUPABASE_ANON_KEY')!,'Content-Type':'application/json'};
 const rpc=async(name:string,body:unknown)=>{const r=await fetch(Deno.env.get('SUPABASE_URL')+'/rest/v1/rpc/'+name,{method:'POST',headers,body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.message||'שגיאת שמירה');return data};
 try{
  if(await rpc('is_electroshop_admin',{})!==true)return reply({error:'אין הרשאת מנהל'},403);
  const body=await req.json();const rows=await catalogue();
  if(body.action==='list')return reply({devices:rows.map(r=>({id:r.objId,name:r.name})),total:rows.length});
  if(!Array.isArray(body.ids)||body.ids.length<1||body.ids.length>3)return reply({error:'יש לבחור עד שלושה מכשירים בכל מנה'},400);
  const results=[];
  for(const id of body.ids){const row=rows.find(r=>r.objId===id);if(!row){results.push({id,error:'המכשיר לא נמצא במקור'});continue}try{const p=await device(row);const result=await rpc('electroshop_import_device',{p});results.push({id,name:row.name,...result})}catch(e){results.push({id,name:row.name,error:e.message})}}
  return reply({results});
 }catch(e){return reply({error:e.message||'העדכון נכשל. הנתונים הקודמים נשמרו.'},400)}
});
