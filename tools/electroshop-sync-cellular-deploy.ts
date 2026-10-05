// Generated single-file dashboard deployment. Do not edit; regenerate from the source.
// Public catalogues only. Never accept a URL, dealer code or customer identifier.
const sources = Object.freeze({
  pelephone: 'https://www.pelephone.co.il/digitalsite/heb/sub-brands/pelephone-in-the-city/peleciy-retail/packages/',
  partner: 'https://u.partner.co.il/umbraco/api/CmsApi/GetPageContent/?pageid=91228',
  '019': 'https://019mobile.co.il/%D7%97%D7%91%D7%99%D7%9C%D7%95%D7%AA-%D7%A1%D7%9C%D7%95%D7%9C%D7%A8/'
});
function text(html = '') {
  return String(html).replace(/<!--[^]*?-->|<script\b[^]*?<\/script>|<style\b[^]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ').replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n)))
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/https?:\/\/\S+/gi, '').replace(/[\u200b\u200e\u200f]/g, '').replace(/\s+/g, ' ').trim();
}
// Balanced elements, including the malformed self-closing divs in the public source.
function elementAt(html, start) {
  const tokens = /<\/?div\b[^>]*>/gi; tokens.lastIndex = start; let depth = 0, token;
  while ((token = tokens.exec(html))) {
    depth += /^<\//.test(token[0]) ? -1 : 1;
    if (depth === 0) return html.slice(start, tokens.lastIndex);
  }
  throw Error('מבנה דף המקור השתנה. הנתונים הקיימים נשמרו.');
}
function block(html, className) {
  const m = new RegExp(`<div\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, 'i').exec(html);
  return m ? elementAt(html, m.index) : '';
}
const span = (html, cls) => text(new RegExp(`<span[^>]*class=["']${cls}["'][^>]*>([^]*?)</span>`, 'i').exec(html)?.[1]);
function validate(plans) {
  if (!plans.length || plans.length > 60) throw Error('לא נמצא קטלוג מלא ותקין. הנתונים הקיימים נשמרו.');
  const ids = new Set();
  for (const p of plans) {
    if (!p.id || ids.has(p.id) || !p.name || !Number.isFinite(p.price) || p.price <= 0 || p.price > 1000 || !p.data || !p.priceTerms) throw Error('נתוני חבילה חסרים. נדרש לבדוק את המקור לפני פרסום.');
    ids.add(p.id);
  }
  return plans;
}
function parsePelephone(html) {
  const cards = [...html.matchAll(/<div\b[^>]*class="item item\d+"[^>]*id="(\d+)"[^>]*>/g)];
  const unique = new Map();
  for (const m of cards) {
    const card = elementAt(html, m.index), data = span(block(card, 'price_gb'), 'a1');
    const price = Number(span(block(card, 'price_line'), 'c'));
    const name = text(block(card, 'superlative'));
    const monthly = text(block(card, 'monthly'));
    const reg = text(block(card, 'reg_price'));
    const label = span(block(card, 'price_line'), 'e');
    const priceTerms = [label, monthly, reg].filter(Boolean).join(' · ');
    const features = [...new Set([...block(card, 'inc').matchAll(/<span(?:\s[^>]*)?>([^]*?)<\/span>/g)].map(x => text(x[1])).filter(Boolean))];
    const warnings = [];
    const p = {id: m[1], name: `${name || 'מסלול פלאפון'} · ${data}GB`, data: `${data}GB`, price, priceTerms, priceSummary: [monthly, label].filter(Boolean).join(' · '),
      features: features.slice(0, 10), terms: [], warnings};
    const previous = unique.get(p.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(p)) throw Error('החבילות בתצוגת המובייל והדסקטופ שונות. נדרשת בדיקה לפני פרסום.');
    unique.set(p.id, p);
  }
  return validate([...unique.values()]);
}
function parse019(html) {
  const cards = [...html.matchAll(/<div\b[^>]*class="[^\"]*\bitem_pack\b[^\"]*"[^>]*>/g)];
  if (cards.length < 4) throw Error('המקור אינו קטלוג 019 המלא. הנתונים הקיימים נשמרו.');
  return validate(cards.map((m, i) => {
    const card = elementAt(html, m.index);
    const name = text(/<h3[^>]*>([^]*?)<\/h3>/.exec(card)?.[1]);
    const price = Number(text(block(card, 'price')).replace(/[^\d.]/g, ''));
    const list = /<ul\b[^>]*class="blist"[^>]*>([^]*?)<\/ul>/.exec(card)?.[1] || '';
    const features = [...list.matchAll(/<li[^>]*>([^]*?)<\/li>/g)].map(x => text(x[1]));
    const data = features.join(' ').match(/\d+\s*(?:GB|MB)/)?.[0].replace(/\s/g,'');
    const terms = text(block(card, 'rules')).replace('טיוטת הסכם התקשרות', '').trim();
    const duration = features.find(s => /מחיר קבוע|ללא עליית מחיר/.test(s));
    const increase = terms.match(/לאחר מכן המחיר יעלה[^.]*\./)?.[0];
    const extra = terms.match(/מותנה בתשלום חודשי נוסף לנטפרי\./)?.[0];
    const priceTerms = ['לחודש למנוי', duration, increase, extra].filter(Boolean).join(' · ');
    const id = /data-packen="([^"]+)"/.exec(card)?.[1] || `plan-${i + 1}`;
    return {id, name, data, price, priceSummary: priceTerms, priceTerms, features, terms: [terms], warnings: []};
  }));
}
function parsePartner(raw) {
  const root = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const list = root[0]?.childrenAsList?.find(n => n.nodeTypeAlias === 'transverseProductsPlansList');
  // Only regular public cellular sales, not dealer-only or government plans.
  const plans = list?.childrenAsList?.filter(n => n.nodeTypeAlias === 'transverseProductsPlan' && (n.properties?.displayInProcesses || '').split(',').map(s => s.trim()).includes('מכר סלולר')) || [];
  return validate(plans.map(n => {
    const t = text(n.properties.firstComponentText);
    const priceTerms = t.slice(t.indexOf('מחיר התכנית'), t.indexOf('שיחות בישראל')).trim();
    const prices = [...priceTerms.matchAll(/(\d+(?:\.\d+)?)\s*₪/g)].map(m => Number(m[1]));
    const data = t.match(/גלישה סלולרית\s*[-–]\s*(\d+)GB/)?.[1];
    const features = (n.childrenAsList || []).filter(b => b.nodeTypeAlias === 'transverseProductsPlanBullet').map(b => text(b.properties.bulletText));
    const fee = t.match(/דמי חיבור\s*[-–]\s*([^]*?)(?=דמי מעבר|$)/)?.[1];
    const transition = t.match(/דמי מעבר לתכנית זו\s*[-–]\s*([^]*?)(?=שירות לקוחות|$)/)?.[1];
    const priceSummary = priceTerms.replace(/מחיר התכנית\s*[-–]\s*/g, '').replace(/\(המחירים כוללים מע"מ\)\.?/g, '').split('בעקבות הצטרפותך')[0].trim();
    return {id: String(n.id), name: text(n.properties.planName), data: data ? `${data}GB` : '', price: Math.min(...prices), priceTerms, priceSummary,
      features: features.slice(0, 10), terms: [fee && `דמי חיבור: ${fee}`, transition && `דמי מעבר: ${transition}`].filter(Boolean).map(s => s.slice(0, 600)), warnings: []};
  }));
}
function pelephoneDetailLinks(html) {
  const links = new Map();
  for (const m of html.matchAll(/<div\b[^>]*class="item item\d+"[^>]*id="(\d+)"[^>]*>/g)) {
    const path = /showPopupIframe\('([^']+)'/.exec(elementAt(html, m.index))?.[1];
    if (!path) throw Error('קישור תנאי חבילה חסר במקור');
    const url = new URL(path, 'https://www.pelephone.co.il');
    if (url.origin !== 'https://www.pelephone.co.il' || !/^\/(ds|digitalsite)\/heb\/(packages\/mobile-packages\/join-pelephone-online|5g\/5g-max)\/more-info\/$/i.test(url.pathname) || !/^\?pid=\d+$/.test(url.search)) throw Error('מקור תנאים לא מוכר');
    links.set(m[1], url.href);
  }
  return links;
}
function enrichPelephone(plans, details) {
  for (const p of plans) {
    const info = details.get(p.id);
    if (!info) throw Error('תנאי חבילה חסרים. הנתונים הקיימים נשמרו.');
    const core = block(block(info, 'info_data'), 'txt');
    const lines = core.split(/<br\b[^>]*>/i).map(text).filter(Boolean);
    if (!lines.length) throw Error('מבנה תנאי החבילות השתנה');
    const prices = lines.filter(s => /תשלום חודשי|מהחודש|מנויים.*₪|למנוי.*₪|הטבת Welcome|לחודש למנוי/.test(s));
    p.priceTerms += prices.length ? ` · ${prices.join(' · ')}` : '';
    const compact = prices.filter(s => !/Welcome/.test(s)).map(s => s.replace(/^.*?(?=תשלום חודשי קבוע|מהחודש|למצרפים)/, ''));
    p.priceSummary = [p.priceSummary, ...compact].join(' · ');
    // The displayed entry price must include the source's 4/5-line tiers too.
    const multi = prices.filter(s => /^למצרפים/.test(s)).flatMap(s => [...s.matchAll(/(\d+(?:\.\d+)?)\s*(?:₪|ש"ח)/g)].map(m => Number(m[1])));
    if (multi.length) p.price = Math.min(p.price, ...multi);
    p.terms = lines.filter(s => !prices.includes(s)).slice(0, 24);
  }
  return validate(plans);
}
async function catalogue(provider) {
  if (!Object.hasOwn(sources, provider)) throw Error('חברה לא מוכרת');
  const response = await fetch(sources[provider], {signal: AbortSignal.timeout(20000), redirect: 'error'});
  if (!response.ok) throw Error('מקור החבילות לא זמין כרגע. הנתונים הקיימים נשמרו.');
  const html = await response.text();
  if (html.length > 3000000) throw Error('תגובת המקור גדולה מהצפוי');
  const parsers = {pelephone: parsePelephone, partner: parsePartner, '019': parse019};
  let plans = parsers[provider](html);
  if (provider === 'pelephone') {
    const links = pelephoneDetailLinks(html), details = new Map();
    await Promise.all([...links].map(async ([id, url]) => {
      // Normalize the source's legacy /DigitalSite redirect without following arbitrary URLs.
      const normalized = url.replace(/\/DigitalSite\//i, '/ds/');
      const r = await fetch(normalized, {signal: AbortSignal.timeout(15000), redirect: 'error'});
      if (!r.ok) throw Error('לא ניתן לאמת את תנאי חבילות פלאפון');
      details.set(id, await r.text());
    }));
    plans = enrichPelephone(plans, details);
  }
  return {provider, checked_at: new Date().toISOString(), plans};
}


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
