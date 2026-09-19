import('./shop-api.js?v=4').then(async api => {
  const session = await api.getSession();
  if (!session || !await api.isAdmin(session)) { location.replace('shop-login.html'); return; }
  const paymentLabels = { pending:'ממתין לתשלום', paid:'שולם', failed:'נכשל', refunded:'הוחזר' };
  const fulfillmentLabels = { new:'הזמנה חדשה', preparing:'בהכנה', awaiting_shipment:'ממתין למשלוח', ready_for_pickup:'מוכן לאיסוף', collected:'נאסף', shipped:'נשלח', delivered:'נמסר', returning:'נשלח בחזרה', returned:'הוחזר', cancelled:'בוטל' };
  const list = document.querySelector('#orderList'), search = document.querySelector('#orderSearch'), orderDate = document.querySelector('#orderDate'), paymentFilter = document.querySelector('#paymentFilter'), fulfillmentFilter = document.querySelector('#fulfillmentFilter');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const options = (labels,current) => Object.entries(labels).map(([value,label]) => `<option value="${value}" ${value===current?'selected':''}>${label}</option>`).join('');
  const imageUrl = path => !path ? '' : path.startsWith('http') || path.startsWith('images/') ? path : path.startsWith('products-images/') ? `../${path}` : `${api.SUPABASE_URL}/storage/v1/object/public/electroshop-product-images/${path}`;
  let orders = await api.getOrders(session);
  const statusClass = order => order.payment_status === 'paid' ? 'paid' : order.payment_status === 'failed' || order.fulfillment_status === 'cancelled' ? 'failed' : order.payment_status === 'refunded' ? 'refunded' : 'pending';
  const paymentMethod = order => order.payment_method_details || (order.payment_provider === 'bit_manual' ? 'ביט — אישור ידני' : order.payment_provider === 'paypal' ? 'PayPal' : order.payment_provider === 'tranzila' ? `Tranzila${order.payment_card_last4 ? ` •••• ${order.payment_card_last4}` : ''}` : 'לא ידוע');

  function card(order) {
    const date = new Date(order.created_at);
    const status = paymentLabels[order.payment_status] || order.payment_status;
    return `<article class="order-card compact" data-order="${order.id}">
      <div class="order-row-actions"><button class="order-delete" type="button" aria-label="מחיקת הזמנה">×</button><button class="order-toggle" type="button" aria-expanded="false" aria-label="פתיחת פרטי הזמנה">+</button></div>
      <div class="order-cell order-number" data-label="מספר הזמנה">#${escape(order.order_number)}</div>
      <div class="order-cell" data-label="לקוח"><strong>${escape(order.customer_name)}</strong><small>${escape(order.customer_email)}</small></div>
      <div class="order-cell" data-label="טלפון"><a href="tel:${escape(order.customer_phone)}">${escape(order.customer_phone)}</a></div>
      <div class="order-cell order-amount" data-label="סכום כולל">${Number(order.total).toLocaleString('he-IL')} ש״ח</div>
      <div class="order-cell" data-label="תאריך ושעה">${date.toLocaleDateString('he-IL')}<small>${date.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}</small></div>
      <div class="order-cell"><span class="order-status ${statusClass(order)}">${escape(status)}</span><small class="payment-method">${escape(paymentMethod(order))}</small></div>
      <div class="order-cell quick-status-cell"><select class="quick-fulfillment" aria-label="שינוי מצב טיפול ומשלוח">${options(fulfillmentLabels,order.fulfillment_status)}</select></div>
      <div class="order-details" hidden>
        <div class="customer-grid"><div><b>${escape(order.customer_name)}</b><br><a href="mailto:${escape(order.customer_email)}">${escape(order.customer_email)}</a><br><a href="tel:${escape(order.customer_phone)}">${escape(order.customer_phone)}</a></div><div><b>${order.fulfillment_method === 'pickup' ? 'איסוף עצמי' : 'משלוח'}</b><br>${escape(order.address)}, ${escape(order.city)}<br>${escape(order.postal_code)} ${escape(order.country)}<br><b>אמצעי תשלום:</b> ${escape(paymentMethod(order))}</div></div>
        <div class="ordered-items">${order.order_items.map(item => `<div><img src="${escape(imageUrl(item.primary_image_path))}" alt=""><span>${escape(item.product_name_he)}<small>${escape(Object.values(item.selected_options||{}).filter(Boolean).join(' | '))} | כמות: ${Number(item.quantity)}</small></span></div>`).join('')}</div>
        <div class="order-controls"><label>מצב תשלום<select data-field="payment_status">${options(paymentLabels,order.payment_status)}</select></label><label>מצב טיפול ומשלוח<select data-field="fulfillment_status">${options(fulfillmentLabels,order.fulfillment_status)}</select></label><label>מספר מעקב<input data-field="tracking_number" value="${escape(order.tracking_number)}"></label><label>הערה פנימית<textarea data-field="admin_note" rows="2">${escape(order.admin_note)}</textarea></label><button class="button save-order">שמירת עדכון</button></div>
      </div>
    </article>`;
  }
  function render() {
    const term = search.value.trim().toLowerCase();
    const filtered = orders.filter(order => {
      const created = new Date(order.created_at), localDate = `${created.getFullYear()}-${String(created.getMonth()+1).padStart(2,'0')}-${String(created.getDate()).padStart(2,'0')}`;
      return [order.order_number,order.customer_name,order.customer_email,order.customer_phone].join(' ').toLowerCase().includes(term) && (!orderDate.value || localDate === orderDate.value) && (!paymentFilter.value || order.payment_status === paymentFilter.value) && (!fulfillmentFilter.value || order.fulfillment_status === fulfillmentFilter.value);
    });
    list.innerHTML = filtered.length ? filtered.map(card).join('') : '<div class="empty">לא נמצאו הזמנות</div>';
  }
  [search,orderDate,paymentFilter,fulfillmentFilter].forEach(control => control.addEventListener('input',render));
  list.addEventListener('change', async event => {
    const select = event.target.closest('.quick-fulfillment');
    if (!select) return;
    const orderCard = select.closest('[data-order]'), value = select.value;
    select.disabled = true;
    try {
      await api.updateOrder(session,orderCard.dataset.order,{fulfillment_status:value});
      const order = orders.find(item => item.id === orderCard.dataset.order);
      if (order) order.fulfillment_status = value;
      const detailsSelect = orderCard.querySelector('[data-field="fulfillment_status"]');
      if (detailsSelect) detailsSelect.value = value;
      if (value === 'shipped') {
        try { await api.sendShipmentEmail(session,orderCard.dataset.order); }
        catch (error) { alert(`הסטטוס נשמר, אך שליחת המייל ללקוח נכשלה: ${error.message}`); }
      }
      select.classList.add('saved');
      setTimeout(() => select.classList.remove('saved'),900);
    } catch(error) {select.value=orders.find(item=>item.id===orderCard.dataset.order)?.fulfillment_status||'new';alert(error.message);} finally { select.disabled = false; }
  });
  list.addEventListener('click', async event => {
    const remove = event.target.closest('.order-delete');
    if (remove) {
      const orderCard = remove.closest('[data-order]'), order = orders.find(item => item.id === orderCard.dataset.order);
      if (!confirm(`למחוק לצמיתות את הזמנה #${order?.order_number || ''}?\nלא ניתן לשחזר את ההזמנה לאחר המחיקה.`)) return;
      remove.disabled = true;
      try { await api.deleteOrder(session,orderCard.dataset.order); orders = orders.filter(item => item.id !== orderCard.dataset.order); render(); }
      catch (error) { remove.disabled = false; alert(`מחיקת ההזמנה נכשלה: ${error.message}`); }
      return;
    }
    const toggle = event.target.closest('.order-toggle');
    if (toggle) { const orderCard=toggle.closest('.order-card'),details=orderCard.querySelector('.order-details'),open=details.hidden;details.hidden=!open;toggle.textContent=open?'−':'+';toggle.setAttribute('aria-expanded',String(open));orderCard.classList.toggle('open',open);return; }
    const button = event.target.closest('.save-order'); if (!button) return;
    const orderCard = button.closest('[data-order]'), data = {}; orderCard.querySelectorAll('[data-field]').forEach(field => data[field.dataset.field]=field.value);
    button.disabled=true; try {await api.updateOrder(session,orderCard.dataset.order,data); const index=orders.findIndex(order=>order.id===orderCard.dataset.order);if(index>=0)orders[index]={...orders[index],...data};if(data.fulfillment_status==='shipped'){try{await api.sendShipmentEmail(session,orderCard.dataset.order)}catch(error){alert(`הסטטוס נשמר, אך שליחת המייל ללקוח נכשלה: ${error.message}`)}}button.textContent='נשמר ✓';setTimeout(render,900);}catch(error){alert(error.message);button.disabled=false;}
  });
  render();
}).catch(error => { document.querySelector('#orderList').innerHTML=`<div class="status show error">${String(error.message).replace(/[<>&]/g,'')}</div>`; });
