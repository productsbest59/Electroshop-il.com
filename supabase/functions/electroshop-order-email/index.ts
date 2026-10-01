const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || '';
const STORE_EMAIL = Deno.env.get('ELECTROSHOP_STORE_EMAIL') || 'electroshopisraelo@gmail.com';
const cors = {'Access-Control-Allow-Origin':'https://electroshop-il.com','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status,headers:{...cors,'Content-Type':'application/json'}});

async function isAdmin(authorization: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_electroshop_admin`, {method:'POST',headers:{Authorization:authorization,apikey:ANON_KEY,'Content-Type':'application/json'},body:'{}'});
  return response.ok && await response.json() === true;
}
async function loadOrder(orderId: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/electroshop_orders?id=eq.${encodeURIComponent(orderId)}&select=*&limit=1`, {headers:{Authorization:`Bearer ${SERVICE_KEY}`,apikey:SERVICE_KEY}});
  if (!response.ok) throw new Error('לא ניתן לטעון את ההזמנה');
  return (await response.json())[0];
}
async function sendShipmentEmail(order: any) {
  if (!BREVO_API_KEY) throw new Error('שירות המייל אינו מוגדר');
  if (!order?.customer_email) throw new Error('לא הוזנה כתובת אימייל ללקוח');
  const tracking = String(order.tracking_number || '').trim();
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#222"><h1>אלקטרושופ</h1><h2>ההזמנה שלך נשלחה</h2><p>שלום ${escape(order.customer_name)},</p><p>הזמנה <strong>${escape(order.order_number)}</strong> יצאה למשלוח.</p>${tracking ? `<p>מספר המעקב: <strong>${escape(tracking)}</strong></p>` : ''}<p>לשאלות אפשר להשיב למייל זה.</p><p><a href="https://electroshop-il.com">חזרה לאתר אלקטרושופ</a></p></div>`;
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {method:'POST',headers:{'api-key':BREVO_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({sender:{name:'אלקטרושופ',email:STORE_EMAIL},replyTo:{name:'אלקטרושופ',email:STORE_EMAIL},to:[{email:order.customer_email,name:order.customer_name || undefined}],subject:`הזמנה ${order.order_number} נשלחה | אלקטרושופ`,htmlContent:html}),signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error(`שליחת המייל נדחתה (${response.status})`);
  return await response.json();
}
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', {headers:cors});
  if (request.method !== 'POST') return reply({error:'Method not allowed'},405);
  try {
    const authorization = request.headers.get('authorization') || '';
    if (!authorization || !await isAdmin(authorization)) return reply({error:'אין הרשאת מנהל'},403);
    const body = await request.json();
    if (body.action !== 'shipped' || !/^[0-9a-f-]{36}$/i.test(String(body.order_id || ''))) return reply({error:'בקשה לא תקינה'},400);
    const order = await loadOrder(String(body.order_id));
    if (!order) return reply({error:'ההזמנה לא נמצאה'},404);
    if (order.fulfillment_status !== 'shipped') return reply({error:'ההזמנה אינה מסומנת כנשלחה'},409);
    const result = await sendShipmentEmail(order);
    return reply({ok:true,message_id:result.messageId || null});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שליחת המייל נכשלה';
    console.error('Electroshop shipment email:', message);
    return reply({error:message},500);
  }
});
