const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

// Called only by server-side payment verification. Never expose this as a public send endpoint.
export async function sendPaidOrderEmail(orderId: string) {
  const base = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const mailKey = Deno.env.get('BREVO_API_KEY') || '';
  const path = `electroshop_orders?id=eq.${encodeURIComponent(orderId)}`;
  async function db(query: string, method = 'GET', body?: unknown) {
    const r = await fetch(`${base}/rest/v1/${query}`, {method, headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body === undefined ? undefined : JSON.stringify(body),signal:AbortSignal.timeout(10000)});
    if (!r.ok) throw Error(`Email database operation failed (${r.status})`);
    return await r.json();
  }
  try {
    if (!mailKey || !key) throw Error('Email configuration missing');
    const rows = await db(path + '&payment_status=eq.paid&select=*,order_items:electroshop_order_items(*)&limit=1');
    const order = rows[0];
    if (!order || order.customer_email_sent_at) return;
    const items = (order.order_items || []).map((i: any) => `<tr><td>${escape(i.product_name_he)}<br><small>${Object.values(i.selected_options || {}).filter(Boolean).map(escape).join(' | ')}</small></td><td>${escape(i.quantity)}</td><td>${escape(i.unit_price)} ₪</td></tr>`).join('');
    const html = `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#222"><h1>אלקטרושופ</h1><h2>תודה על הרכישה!</h2><p>שלום ${escape(order.customer_name)}, התשלום עבור הזמנה <strong>${escape(order.order_number)}</strong> התקבל בהצלחה.</p><table style="width:100%;text-align:right" cellpadding="10"><tr><th>מוצר</th><th>כמות</th><th>מחיר ליחידה</th></tr>${items}</table><p>משלוח: ${escape(order.shipping_amount)} ₪</p><h3>סה״כ ששולם: ${escape(order.total)} ₪</h3><p>פרטי הכתובת שנמסרו: ${escape(order.address)}, ${escape(order.city)}, ${escape(order.postal_code)}, ${escape(order.country)}</p><p>מוצרים שסומנו באיסוף עצמי: יש לתאם הגעה מול החנות.</p>${order.customer_note ? `<p>ההערה שלך: ${escape(order.customer_note)}</p>` : ''}<p>לשאלות או לתיקון פרטי ההזמנה, אפשר להשיב למייל זה.</p><p><a href="https://electroshop-il.com">חזרה לחנות</a></p></div>`;
    // Atomic claim prevents concurrent callbacks from sending the same confirmation twice.
    const claim = await db(path + '&payment_status=eq.paid&customer_email_sent_at=is.null&customer_email_claimed_at=is.null', 'PATCH', {customer_email_claimed_at:new Date().toISOString(),customer_email_error:null});
    if (!claim.length) return;
    const storeEmail = Deno.env.get('ELECTROSHOP_STORE_EMAIL') || 'electroshopisraelo@gmail.com';
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {method:'POST',headers:{'api-key':mailKey,'Content-Type':'application/json'},body:JSON.stringify({sender:{name:'אלקטרושופ',email:'electroshopisraelo@gmail.com'},replyTo:{name:'אלקטרושופ',email:'electroshopisraelo@gmail.com'},to:[{email:order.customer_email}],bcc:[{email:storeEmail,name:'אלקטרושופ'}],subject:`אישור רכישה ${order.order_number} | אלקטרושופ`,htmlContent:html}),signal:AbortSignal.timeout(15000)});
    // Unknown outcomes stay claimed: a timeout must never cause a duplicate message.
    if (!r.ok) {
      if (r.status >= 400 && r.status < 500) await db(path, 'PATCH', {customer_email_claimed_at:null});
      throw Error(`Email provider rejected request (${r.status})`);
    }
    const result = await r.json();
    await db(path, 'PATCH', {customer_email_sent_at:new Date().toISOString(),customer_email_message_id:result.messageId || null,customer_email_error:null});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email confirmation failed';
    console.error('Electroshop order confirmation:', message);
    try { await db(path, 'PATCH', {customer_email_error:message}); } catch { /* Payment remains paid even if email storage is unavailable. */ }
  }
}
