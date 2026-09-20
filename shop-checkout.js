import('./shop-config.js').then(({config})=>{
import('./shop-api.js?v=multi-category-1').then(async api => {
  const language = localStorage.getItem('electroshop_store_language') === 'en' ? 'en' : 'he';
  const english = language === 'en';
  document.documentElement.lang = language;
  document.documentElement.dir = english ? 'ltr' : 'rtl';

  const copy = english ? {
    title: 'Checkout | ELECTRO', back: 'Back to store', heading: 'Customer and shipping details',
    notice: 'Choose PayPal or Debit or Credit Card below. Payment is securely processed in USD.',
    fields: ['Full name', 'Email address', 'Phone', 'Country', 'City', 'Street and number', 'Postal code', 'Order notes'],
    countryHelp: 'Choose from the list or enter any other country', card: 'Secure credit card payment (ILS)',
    paypal: 'Pay with PayPal in USD', summary: 'Order summary', total: 'Total to pay', empty: 'Your cart is empty',
    emptyError: 'An order cannot be created with an empty cart', redirecting: 'Redirecting to payment...',
    paypalError: 'PayPal could not start the payment', tranzilaError: 'Tranzila did not return a payment link',
    cancelled: 'Payment was cancelled. You can choose a payment method again.', sdkError: 'PayPal checkout could not be loaded.'
  } : {
    title: 'השלמת הזמנה | ELECTRO', back: 'חזרה לחנות', heading: 'פרטי הרוכש והמשלוח',
    notice: 'תשלום מאובטח בכרטיס אשראי ובשקלים באמצעות Tranzila.',
    fields: ['שם מלא', 'דואר אלקטרוני', 'טלפון', 'מדינה', 'עיר', 'רחוב ומספר', 'מיקוד', 'הערות להזמנה'],
    countryHelp: 'ניתן לבחור מהרשימה או להקליד כל מדינה אחרת', card: 'תשלום מאובטח בכרטיס אשראי',
    paypal: 'תשלום עם PayPal בדולרים', summary: 'סיכום הזמנה', total: 'סה״כ לתשלום', empty: 'הסל ריק',
    emptyError: 'לא ניתן ליצור הזמנה עם סל ריק', redirecting: 'מעביר לתשלום...',
    paypalError: 'לא התקבל קישור תשלום מ-PayPal', tranzilaError: 'לא התקבל קישור תשלום מ-Tranzila'
  };

  document.title = copy.title;
  document.querySelector('.site-head a').textContent = copy.back;
  document.querySelector('.checkout-shell h1').textContent = copy.heading;
  document.querySelector('.checkout-shell section > .notice').textContent = copy.notice;
  [...document.querySelectorAll('#checkoutForm > label.field > span')].forEach((span, index) => { if (copy.fields[index]) span.textContent = copy.fields[index]; });
  document.querySelector('#checkoutForm label.field small').textContent = copy.countryHelp;
  const cardButton = document.querySelector('button[value="tranzila"]');
  const paypalButton = document.querySelector('button[value="paypal"]');
  cardButton.textContent = copy.card;
  paypalButton.textContent = copy.paypal;
  cardButton.hidden = english;
  paypalButton.hidden = true;
  document.querySelector('.order-summary h2').textContent = copy.summary;

  const products = await api.getProducts();
  let promotionEnabled = true;
  try { promotionEnabled = (await api.getPromotionSettings()).enabled; } catch {}
  const cart = JSON.parse(localStorage.getItem('electroshop_new_store_cart_v2') || '{}');
  const lines = Object.values(cart).map(item => ({ item, product: products.find(product => product.id === item.productId) })).filter(line => line.product);
  const usdPrice = product => {
    const manual = Number(product.priceUsd);
    return manual > 0 ? Math.round(manual) : Math.max(1, Math.round(Number(product.price) / 3.7));
  };
  const linePrice = ({ item, product }) => {
    const ils = Number(item.price ?? product.price);
    if (!english) return ils;
    return item.price == null ? usdPrice(product) : Math.max(1, Math.round(ils / 3.7));
  };
  const money = amount => english ? `$${Number(amount).toFixed(2)}` : `${Number(amount).toLocaleString('he-IL')} ש״ח`;
  const optionTranslations = {'זהב':'Gold','צבע זהב':'Gold','מוזהב':'Gold','כסף':'Silver','צבע כסף':'Silver','מוכסף':'Silver','רוז גולד':'Rose Gold','זהב ורוד':'Rose Gold','שחור':'Black','לבן':'White','כחול':'Blue','אדום':'Red','ירוק':'Green','קצר':'Short','קצרה':'Short','ארוך':'Long','ארוכה':'Long','קטן':'Small','קטנה':'Small','בינוני':'Medium','בינונית':'Medium','גדול':'Large','גדולה':'Large','מתכוונן':'Adjustable','מתכווננת':'Adjustable','נשים':'Women','גברים':'Men'};
  const optionText = value => { const raw=String(value).trim(); return english ? (optionTranslations[raw] || raw.replace(/מילימטרים/g,'millimeters').replace(/מילימטר/g,'millimeter').replace(/ס\s*["״']?\s*מ/g,'cm').replace(/מ\s*["״']?\s*מ/g,'mm')) : raw; };
  const unitPrices = lines.flatMap(line => Array.from({length:line.item.qty},()=>linePrice(line)));
  const subtotal = unitPrices.reduce((sum, price) => sum + price, 0);
  const cheapest = unitPrices.length ? Math.min(...unitPrices) : 0;
  const promotionDiscount = promotionEnabled ? (unitPrices.length >= 5 ? cheapest : unitPrices.length >= 4 ? cheapest * .5 : 0) : 0;
  const total = subtotal - promotionDiscount;

  document.querySelector('#summaryLines').innerHTML = lines.map(({ item, product }) => `
    <div class="summary-line">
      <img src="${item.image || product.images[0]}" alt="">
      <div>
        <strong>${english ? product.nameEn : product.nameHe}</strong>
        <small>${[item.color, item.size, item.style].filter(Boolean).map(optionText).join(' | ')}</small>
        <span>${item.qty} × ${money(linePrice({ item, product }))}</span>
      </div>
    </div>`).join('') || `<p>${copy.empty}</p>`;
  document.querySelector('#summaryTotal').innerHTML = promotionDiscount
    ? `<small>${english?'Subtotal':'סכום לפני הנחה'}: ${money(subtotal)}</small><small class="discount">${english?'Offer discount':'הנחת מבצע'}: −${money(promotionDiscount)}</small><span>${copy.total}</span><strong>${money(total)}</strong>`
    : `<span>${copy.total}</span><strong>${money(total)}</strong>`;

  const form = document.querySelector('#checkoutForm');
  form.querySelectorAll('button[type="submit"]').forEach(b=>b.disabled=!config.paymentsEnabled);
  if(!config.paymentsEnabled){form.querySelectorAll('button[type="submit"]').forEach(b=>{b.disabled=true;b.textContent='התשלום המקוון ייפתח בקרוב'});document.querySelector('.checkout-shell section > .notice').textContent='החנות בהכנה. עדיין לא ניתן לשלוח הזמנה או לבצע חיוב.';}

  const message = document.querySelector('#message');
  const orderItems = () => lines.map(line => ({ productId: line.product.id, quantity: line.item.qty, color: line.item.color || '', size: line.item.size || '', style: line.item.style || '', unitPrice: linePrice(line), image: line.item.image || line.product.images[0] || '' }));
  const rememberPendingPurchase = order => {
    const purchase = {
      transaction_id: String(order.order_number || order.id),
      value: Number(total.toFixed(2)),
      currency: english ? 'USD' : 'ILS',
      shipping: 0,
      items: lines.map(({ item, product }, index) => ({
        item_id: product.sku || product.id,
        item_name: english ? product.nameEn : product.nameHe,
        item_brand: 'ELECTRO',
        item_category: product.category || 'jewelry',
        item_variant: [item.color, item.size, item.style].filter(Boolean).map(optionText).join(' | '),
        index,
        price: Number(linePrice({ item, product })),
        quantity: Number(item.qty) || 1
      }))
    };
    sessionStorage.setItem('electroshop_ga_pending_purchase_v1', JSON.stringify(purchase));
  };
  let paypalStoreOrder = null;
  let paypalFundingSource = 'paypal';

  async function createPayPalOrder() {
    if (!lines.length) throw new Error(copy.emptyError);
    if (!form.reportValidity()) throw new Error(english ? 'Please complete all required details.' : 'יש להשלים את כל שדות החובה');
    if (paypalStoreOrder) return paypalStoreOrder;
    const customer = Object.fromEntries(new FormData(form));
    delete customer.paymentProvider;
    const order = await api.createOrder(customer, orderItems());
    rememberPendingPurchase(order);
    const payment = await api.startPayPalPayment(order.id);
    if (!payment?.paypal_order_id) throw new Error(copy.paypalError);
    sessionStorage.setItem('electroshop_pending_order_number', order.order_number);
    paypalStoreOrder = { order, payment };
    return paypalStoreOrder;
  }

  async function loadPayPalButtons() {
    if (!english || !config.paymentsEnabled) return;
    const config = await api.getPayPalConfig();
    if (!config?.client_id) throw new Error(copy.sdkError);
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.client_id)}&currency=${encodeURIComponent(config.currency || 'USD')}&intent=capture&components=buttons&enable-funding=card&disable-funding=paylater`;
      script.onload = resolve;
      script.onerror = () => reject(new Error(copy.sdkError));
      document.head.appendChild(script);
    });
    const container = document.querySelector('#paypalButtons');
    container.hidden = false;
    const buttons = window.paypal.Buttons({
      style: { shape: 'rect', layout: 'vertical', color: 'gold', label: 'paypal', height: 48 },
      async createOrder(data) {
        message.textContent = '';
        message.className = 'status';
        try {
          paypalFundingSource = String(data?.fundingSource || 'paypal').toLowerCase();
          const { payment } = await createPayPalOrder();
          return payment.paypal_order_id;
        } catch (error) {
          message.textContent = error.message;
          message.className = 'status show error';
          throw error;
        }
      },
      async onApprove(data, actions) {
        try {
          const result = await api.capturePayPalPayment(paypalStoreOrder.order.id, data.orderID, paypalFundingSource);
          localStorage.removeItem('electroshop_new_store_cart_v2');
          location.assign('payment-success.html');
        } catch (error) {
          if (/INSTRUMENT_DECLINED/i.test(error.message)) return actions.restart();
          message.textContent = error.message;
          message.className = 'status show error';
        }
      },
      onCancel() {
        message.textContent = copy.cancelled;
        message.className = 'status show';
      },
      onError(error) {
        message.textContent = error?.message || copy.paypalError;
        message.className = 'status show error';
      }
    });
    if (!buttons.isEligible()) throw new Error(copy.sdkError);
    await buttons.render('#paypalButtons');
  }

  loadPayPalButtons().catch(error => {
    message.textContent = error.message;
    message.className = 'status show error';
    paypalButton.hidden = false;
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if(!config.paymentsEnabled)return;
    if (english && event.submitter?.value !== 'paypal') return;
    const buttons = [...event.target.querySelectorAll('button[type="submit"]')];
    const button = event.submitter;
    const provider = button?.value || 'tranzila';
    const originalText = button?.textContent || '';
    if (!lines.length) {
      message.textContent = copy.emptyError;
      message.className = 'status show error';
      return;
    }
    buttons.forEach(item => item.disabled = true);
    button.textContent = copy.redirecting;
    try {
      const customer = Object.fromEntries(new FormData(event.target));
      delete customer.paymentProvider;
      const items = orderItems();
      const order = await api.createOrder(customer, items);
      rememberPendingPurchase(order);
      const payment = provider === 'paypal' ? await api.startPayPalPayment(order.id) : await api.startTranzilaPayment(order.id);
      const paymentLink = provider === 'paypal' ? payment?.approval_url : payment?.pr_link;
      if (!paymentLink) throw new Error(provider === 'paypal' ? copy.paypalError : copy.tranzilaError);
      sessionStorage.setItem('electroshop_pending_order_number', order.order_number);
      location.assign(paymentLink);
    } catch (error) {
      message.textContent = error.message;
      message.className = 'status show error';
      buttons.forEach(item => item.disabled = false);
      button.textContent = originalText;
    }
  });
}).catch(error => {
  const message = document.querySelector('#message');
  message.textContent = error.message;
  message.className = 'status show error';
});

});