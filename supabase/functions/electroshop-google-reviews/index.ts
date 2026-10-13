const env = (key: string) => Deno.env.get(key) || "";
const base = env("SUPABASE_URL");
const service = env("SUPABASE_SERVICE_ROLE_KEY") || env("SUPABASE_SECRET_KEY");
const resource = "accounts/104330754982105813812/locations/1798521663345115833";
const cors = {"Access-Control-Allow-Origin":"https://electroshop-il.com","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"};
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), {status, headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
async function db(path: string, init: RequestInit = {}, auth = service) {
 const r = await fetch(base + "/rest/v1/" + path, {...init, headers:{apikey:service,Authorization:"Bearer "+auth,"Content-Type":"application/json",...(init.headers || {})},signal:AbortSignal.timeout(15000)});
 if(!r.ok) throw new Error("Database request failed");
 return r.status === 204 ? null : r.json();
}
let cache: {expires:number,reviews:any[]} | null = null;
let pending: Promise<any[]> | null = null;
async function loadReviews() {
 if(cache && cache.expires > Date.now()) return cache.reviews;
 if(pending) return pending;
 pending = (async () => {
  const client_id=env("ELECTROSHOP_GOOGLE_CLIENT_ID"),client_secret=env("ELECTROSHOP_GOOGLE_CLIENT_SECRET"),refresh_token=env("ELECTROSHOP_GOOGLE_REFRESH_TOKEN");
  if(!client_id || !client_secret || !refresh_token) throw Error("Google connection secrets are missing");
  const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",body:new URLSearchParams({client_id,client_secret,refresh_token,grant_type:"refresh_token"}),signal:AbortSignal.timeout(15000)});
  const token=await r.json();
  if(!r.ok || !token.access_token) throw Error("Google authorization failed: "+(["invalid_client","invalid_grant","unauthorized_client"].includes(token.error)?token.error:"token_error"));
  const reviews:any[]=[];let next="";
  for(let page=0;page<100;page++){
   const u=new URL("https://mybusiness.googleapis.com/v4/"+resource+"/reviews");u.searchParams.set("pageSize","50");if(next)u.searchParams.set("pageToken",next);
   const result=await fetch(u,{headers:{Authorization:"Bearer "+token.access_token},signal:AbortSignal.timeout(15000)});
   const data=await result.json();if(!result.ok)throw Error("Google reviews request failed ("+result.status+")");
   for(const review of data.reviews||[])reviews.push({id:review.reviewId,author:review.reviewer?.displayName||"Google user",photo:review.reviewer?.profilePhotoUrl||"",rating:({ONE:1,TWO:2,THREE:3,FOUR:4,FIVE:5} as Record<string,number>)[review.starRating]||0,text:review.comment||"",date:review.createTime});
   next=data.nextPageToken||"";if(!next)break;
  }
  if(next)throw Error("Review list exceeds supported size");
  cache={expires:Date.now()+600000,reviews};return reviews;
 })();
 try{return await pending}finally{pending=null}
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{headers:cors});
 try{
  if(!["GET","POST"].includes(req.method))return reply({error:"Method not allowed"},405);
  if(req.method==="POST"){
   const auth=req.headers.get("Authorization")||"";
   if(!auth.startsWith("Bearer "))return reply({error:"יש להתחבר לניהול"},401);
   let admin=false;
   try{admin=(await db("rpc/is_electroshop_admin",{method:"POST",body:"{}"},auth.slice(7)))===true}catch{}
   if(!admin)return reply({error:"נדרשת הרשאת מנהל אלקטרושופ"},403);
   const body=await req.json();
   if(body.action==="save"){
    if(!Array.isArray(body.ids)||body.ids.some((id:unknown)=>typeof id!=="string"))return reply({error:"רשימת ביקורות לא תקינה"},400);
    const reviews=await loadReviews(),allowed=new Set(reviews.map(r=>r.id));
    if(body.ids.some((id:string)=>!allowed.has(id)))return reply({error:"יש לרענן את רשימת הביקורות"},400);
    await db("electroshop_review_selection?id=eq.true",{method:"PATCH",body:JSON.stringify({review_ids:[...new Set(body.ids)],updated_at:new Date().toISOString()})});
    return reply({saved:true});
   }
   if(body.action!=="list")return reply({error:"Unknown action"},400);
   const [reviews,rows]=await Promise.all([loadReviews(),db("electroshop_review_selection?select=review_ids&id=eq.true")]);
   return reply({reviews,selected:rows[0]?.review_ids||[]});
  }
  const [reviews,rows]=await Promise.all([loadReviews(),db("electroshop_review_selection?select=review_ids&id=eq.true")]);
  const ids=rows[0]?.review_ids||[];
  return reply({reviews:ids.map((id:string)=>reviews.find(r=>r.id===id)).filter(Boolean)});
 }catch(error){return reply({error:error instanceof Error?error.message:"Reviews unavailable"},503)}
});

