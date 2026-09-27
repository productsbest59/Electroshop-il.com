import {verifyReport} from './verification.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const TERMINAL = Deno.env.get('ELECTROSHOP_TRANZILA_TERMINAL') || '';
const APP_KEY = Deno.env.get('ELECTROSHOP_TRANZILA_APP_KEY') || '';
const APP_SECRET = Deno.env.get('ELECTROSHOP_TRANZILA_APP_SECRET') || '';
const NOTIFY_SECRET = Deno.env.get('ELECTROSHOP_TRANZILA_NOTIFY_SECRET') || '';
const ENABLED = Deno.env.get('ELECTROSHOP_TRANZILA_PAYMENTS_ENABLED') === 'true';
const STORE_PUBLIC_URL = (Deno.env.get('ELECTROSHOP_STORE_PUBLIC_URL') || 'https://electroshop-il.com').replace(/\/$/, '');

function serviceKey() {
  return Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}

async function db(path: string, options: RequestInit = {}) {
  if(!/^(electroshop_orders\?|rpc\/create_electroshop_tranzila_order$)/.test(path))throw Error('Database scope violation');
  const key = serviceKey();
  if (!key) throw new Error('Supabase secret key is unavailable');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${data?.message || data?.error || 'request failed'}`);
  return data;
}

async function input(request: Request) {
  if ((request.headers.get('content-type') || '').includes('application/json')) return await request.json();
  return Object.fromEntries((await request.formData()).entries());
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Access-Control-Allow-Origin': '*' } });
const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');

function nonce() {
  const bytes = new Uint8Array(40);
  crypto.getRandomValues(bytes);
  return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
}

async function authHeaders() {
  const requestTime = String(Math.floor(Date.now() / 1000));
  const requestNonce = nonce();
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(`${APP_SECRET}${requestTime}${requestNonce}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(APP_KEY));
  return {
    'X-tranzila-api-app-key': APP_KEY,
    'X-tranzila-api-request-time': requestTime,
    'X-tranzila-api-nonce': requestNonce,
    'X-tranzila-api-access-token': hex(signature)
  };
}

function phoneParts(value: unknown) {
  const digits = String(value || '').replace(/\D/g, '').replace(/^972/, '0');
  const area = digits.slice(0, 3) || '050';
  return { phone_country_code: '972', phone_area_code: area, phone_number: digits.slice(area.length) };
}

function countryCode(value: unknown) {
  const country = String(value || '').trim();
  if (/^[a-z]{2}$/i.test(country)) return country.toUpperCase();
  const codes: Record<string, string> = {
    'ישראל': 'IL', 'israel': 'IL', 'united states': 'US', 'usa': 'US', 'united kingdom': 'GB', 'uk': 'GB',
    'canada': 'CA', 'australia': 'AU', 'new zealand': 'NZ', 'germany': 'DE', 'france': 'FR', 'italy': 'IT',
    'spain': 'ES', 'portugal': 'PT', 'netherlands': 'NL', 'belgium': 'BE', 'switzerland': 'CH', 'austria': 'AT',
    'ireland': 'IE', 'greece': 'GR', 'cyprus': 'CY', 'poland': 'PL', 'czech republic': 'CZ', 'romania': 'RO',
    'hungary': 'HU', 'sweden': 'SE', 'norway': 'NO', 'denmark': 'DK', 'finland': 'FI', 'thailand': 'TH',
    'japan': 'JP', 'singapore': 'SG', 'united arab emirates': 'AE', 'uae': 'AE', 'south africa': 'ZA',
    'brazil': 'BR', 'mexico': 'MX', 'argentina': 'AR'
  };
  return codes[country.toLowerCase()] || '';
}

async function createPayment(orderId: string,language='he') {
  if (!ENABLED) throw new Error('Tranzila payments are safely disabled until setup is complete');
  if (!TERMINAL || !APP_KEY || !APP_SECRET) throw new Error('Tranzila API credentials are missing');
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) throw new Error('Invalid order ID');

  const rows = await db(`electroshop_orders?id=eq.${encodeURIComponent(orderId)}&select=*,order_items:electroshop_order_items(*)&limit=1`);
  const order = rows?.[0];
  if (!order||order.payment_provider!=='tranzila') throw new Error('Order not found');
  if (order.payment_status === 'paid') throw new Error('Order is already paid');
  if (order.payment_link && order.payment_request_id) {
    return { ok: true, pr_id: order.payment_request_id, pr_link: order.payment_link, reused: true };
  }

  const claim=await db('electroshop_orders?id=eq.'+order.id+'&payment_response_code=is.null',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({payment_response_code:'creating'})});
  if(!claim?.length)throw Error('בקשת תשלום כבר בטיפול. יש לפנות לחנות אם הקישור לא התקבל.');
  const items = (order.order_items || []).map((item: any, index: number) => ({
    id: index + 1, code: item.sku, name: item.product_name_he, type: 'I',
    unit_price: Number(item.unit_price), unit_type: 1, units_number: Number(item.quantity),
    price_type: 'G', currency_code: 'ILS', vat_percent: 18
  }));

  if(Number(order.shipping_amount)>0)items.push({id:items.length+1,code:'SHIPPING',name:'משלוח',type:'I',unit_price:Number(order.shipping_amount),unit_type:1,units_number:1,price_type:'G',currency_code:'ILS',vat_percent:18});
  const expected=items.reduce((sum,item)=>sum+Math.round(item.unit_price*100)*item.units_number,0);
  if(expected!==Math.round(Number(order.total)*100)||expected<=0)throw Error('Invalid order total');
  const clientCountryCode = countryCode(order.country);
  const body = {
    terminal_name: TERMINAL, created_by_user: 'electroshop-store', created_by_system: 'electroshop-supabase',
    created_via: 'TRAPI', action_type: 1, request_date: new Date().toISOString().slice(0, 10),
    request_language: language==='en'?'english':'hebrew', response_language: language==='en'?'english':'hebrew', request_currency: 'ILS',
    currency_code: 'ILS', request_vat: 18, payments_number: 1, payment_plans: [1],
    payment_methods: [1],
    send_email: { sender_name: 'אלקטרושופ', sender_email: 'electroshopisraelo@gmail.com' },
    client: {
      external_id: order.id, name: order.customer_name, contact_person: order.customer_name,
      email: order.customer_email, address_line_1: order.address, city: order.city,
      ...(clientCountryCode ? { country_code: clientCountryCode } : {}),
      zip: order.postal_code || '', ...phoneParts(order.customer_phone)
    },
    items
  };

  const response = await fetch('https://api.tranzila.com/v1/pr/create', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) }, body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || Number(data?.error_code) !== 0 || !data?.pr_link) {
    const code=Number(data?.error_code);
    // Only explicit provider rejections are safe to retry. Unknown outcomes stay locked.
    if(response.ok && Number.isInteger(code) && code>0 && !data?.pr_id && !data?.pr_link){
      await db('electroshop_orders?id=eq.'+order.id+'&payment_response_code=eq.creating&payment_status=eq.pending',{method:'PATCH',body:JSON.stringify({payment_response_code:null})});
    }
    console.error('Tranzila create rejected',{http_status:response.status,error_code:Number.isInteger(code)?code:null});
    throw new Error('לא ניתן ליצור קישור תשלום באשראי (קוד '+(Number.isInteger(code)?code:response.status)+'). נסו שוב או פנו לחנות.');
  }

  if(new URL(data.pr_link).origin!=='https://pay.tranzila.com')throw Error('Invalid payment link');
  await db(`electroshop_orders?id=eq.${encodeURIComponent(order.id)}&payment_status=neq.paid`, {
    method: 'PATCH', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ payment_provider: 'tranzila', payment_request_id: String(data.pr_id), payment_link: data.pr_link, payment_response_code: 'pending' })
  });
  return { ok: true, pr_id: String(data.pr_id), pr_link: data.pr_link };
}

function firstValue(body: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    const value = body[name];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return '';
}

async function transactionReport(transactionIndex: string) {
  const response = await fetch('https://report.tranzila.com/v1/transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ terminal_name: TERMINAL, transaction_index: Number(transactionIndex), detailed: 'Y' })
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Tranzila report ${response.status}: ${data?.message || 'request failed'}`);
  const transaction = data?.transactions?.[0];
  if (!transaction) throw new Error('Transaction was not found in Tranzila reports');
  return transaction;
}

async function handleNotify(body: Record<string, unknown>, authenticated = false) {
  if (!TERMINAL || !APP_KEY || !APP_SECRET) throw new Error('Tranzila API credentials are missing');
  const paymentRequestId = firstValue(body, ['pr_id', 'payment_request_id']);
  const transactionIndex = firstValue(body, ['transaction_index', 'index', 'transaction_id']);
  if (!paymentRequestId) throw new Error('Missing Tranzila payment request ID');
  if (!/^\d+$/.test(transactionIndex)) throw new Error('Missing or invalid Tranzila transaction index');

  const rows = await db(`electroshop_orders?payment_provider=eq.tranzila&payment_request_id=eq.${encodeURIComponent(paymentRequestId)}&select=*&limit=1`);
  const order = rows?.[0];
  if (!order) throw new Error('Order for this payment request was not found');
  if (order.payment_status === 'paid') return { ok: true, already_processed: true };

  const transaction = await transactionReport(transactionIndex);
  const legacyBound=Array.isArray(transaction.items)&&transaction.items.some((item:any)=>String(item.item_name||'').startsWith('ES:'+order.id+' '));
  if(!authenticated&&!legacyBound)throw Error('Authenticated Tranzila notification required for order matching');
  const verification=verifyReport(transaction,order.total,transactionIndex);
  const {approved,responseCode,reportedIndex}=verification;
  await db(`electroshop_orders?id=eq.${encodeURIComponent(order.id)}&payment_status=neq.paid`, {
    method: 'PATCH', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      payment_status: approved ? 'paid' : 'failed',
      payment_provider: 'tranzila',
      payment_transaction_id: reportedIndex,
      payment_response_code: responseCode || 'verification_failed',
      payment_paid_at: approved ? new Date().toISOString() : null,
      payment_callback_received_at: new Date().toISOString()
    })
  });

  if (!approved) {
    console.error('Payment verification failed', verification);
    return { ok: false, verified: false };
  }

  return { ok: true, verified: true };
}

function paymentRedirect(action: string) {
  const page = action === 'success' ? 'shop-payment-success.html' : 'shop-checkout.html';
  return Response.redirect(`${STORE_PUBLIC_URL}/${page}`, 303);
}

async function paymentStatus(orderId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) throw new Error('Invalid order ID');
  const rows = await db(`electroshop_orders?id=eq.${encodeURIComponent(orderId)}&select=payment_status,order_number&limit=1`);
  return { payment_status: rows?.[0]?.payment_status || 'unknown',order_number:rows?.[0]?.order_number };
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type' } });
  try {
    if(request.method==='GET'&&new URL(request.url).searchParams.get('action')==='config')return json({enabled:ENABLED&&!!APP_KEY&&!!APP_SECRET});
    const body = request.method==='GET'?Object.fromEntries(new URL(request.url).searchParams):await input(request);
    const action = String(body.action || new URL(request.url).searchParams.get('action') || 'start');
    if (action === 'start') {
      if(!ENABLED)throw Error('התשלום בטרנזילה עדיין אינו זמין');
      const created=await db('rpc/create_electroshop_tranzila_order',{method:'POST',body:JSON.stringify({p_customer:body.customer,p_items:body.items,p_request_id:body.request_id})});
      if(Math.round(Number(created.total_ils)*100)!==Math.round(Number(body.expected_total)*100))throw Error('המחיר השתנה. יש לרענן את הקופה');
      return json({...await createPayment(created.id,body.language),order_id:created.id,order_number:created.order_number});
    }
    if (action === 'status') return json(await paymentStatus(String(body.order_id || '')));
    if (action === 'notify') {
      const token=new URL(request.url).searchParams.get('notify_key')||'';
      const authenticated=NOTIFY_SECRET.length>=64&&token===NOTIFY_SECRET;
      return json(await handleNotify(body,authenticated));
    }
    if (action === 'success' || action === 'fail') return paymentRedirect(action);
    return json({ ok: false, error: 'Unknown payment action' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('electroshop-tranzila failed:', message);
    return json({ ok: false, error: message }, 500);
  }
});
