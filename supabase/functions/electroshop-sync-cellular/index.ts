import {catalogue} from './parser.mjs';
const allowedOrigins = new Set(['https://electroshop-il.com','http://127.0.0.1:8765','http://localhost:8765']);
Deno.serve(async req => {
  const origin = req.headers.get('origin') || '';
  const cors = {'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://electroshop-il.com', 'Vary':'Origin', 'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status,headers:{...cors,'Content-Type':'application/json'}});
  if (origin && !allowedOrigins.has(origin)) return reply({error:'Origin not allowed'},403);
  if (req.method === 'OPTIONS') return new Response('ok',{headers:cors});
  if (req.method !== 'POST') return reply({error:'Method not allowed'},405);
  const authorization = req.headers.get('authorization');
  if (!authorization) return reply({error:'נדרשת כניסת מנהל'},401);
  const headers = {Authorization:authorization, apikey:Deno.env.get('SUPABASE_ANON_KEY')!, 'Content-Type':'application/json'};
  const rest = async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/${path}`, {...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(15000)});
    const data = await response.json();
    if (!response.ok) throw Error('לא ניתן לשמור את עדכון החבילות. הקטלוג הקודם נשמר.');
    return data;
  };
  try {
    if (await rest('rpc/is_electroshop_admin',{method:'POST',body:'{}'}) !== true) return reply({error:'אין הרשאת מנהל'},403);
    const body = await req.json();
    if (body.action !== 'sync' || !['pelephone','partner','019'].includes(body.provider)) return reply({error:'בקשה לא תקינה'},400);
    const recent = await rest(`electroshop_cellular_proposals?select=id&provider=eq.${body.provider}&created_at=gte.${encodeURIComponent(new Date(Date.now()-30000).toISOString())}&limit=1`);
    if (recent.length) return reply({error:'המתן חצי דקה לפני סנכרון נוסף'},429);
    const current = await rest(`electroshop_cellular_catalogues?select=updated_at,plans&provider=eq.${body.provider}`);
    const result = await catalogue(body.provider);
    if (current[0]?.plans.length && result.plans.length < current[0].plans.length / 2) throw Error('חלק גדול מהחבילות חסר במקור. העדכון נעצר והקטלוג הקיים נשמר.');
    const proposals = await rest('electroshop_cellular_proposals',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({...result,base_updated_at:current[0]?.updated_at || null})});
    return reply({proposal:proposals[0],previous:current[0]?.plans || []});
  } catch (error) {
    console.error('Cellular sync failed:', error instanceof Error ? error.message : 'unknown');
    return reply({error:error instanceof Error ? error.message : 'הסנכרון נכשל. הנתונים הקיימים נשמרו.'},400);
  }
});
