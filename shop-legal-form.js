(() => {
  const form = document.getElementById('legalRequestForm');
  if (!form) return;
  const status = document.getElementById('legalRequestStatus');
  const button = form.querySelector('button[type="submit"]');
  const endpoint = form.dataset.contactEndpoint || 'https://digital247-contact.productsbest59.workers.dev/contact';
  const sitekey = form.dataset.turnstileSitekey || '0x4AAAAAAGCR9MahhbBEvJRH';
  const strings = {
    links: ['Links are not allowed in the name or message. Remove the link to send.', 'Links are not allowed in the name or message. Remove the link to send.'],
    unavailable: ['לא הצלחנו לשלוח את ההודעה. הפרטים נשמרו בטופס; ניתן לנסות שוב, להתקשר ל־03-5560073 או לשלוח אימייל ל־electroshopisraelo@gmail.com.', 'Your message could not be sent. Your details remain in the form. Try again, call 03-5560073 or email electroshopisraelo@gmail.com.'],
    verification: ['נא להשלים את האימות ולנסות שוב.', 'Please complete the verification and try again.'],
    blocked: ['השליחה נחסמה ל־24 שעות בגלל קישור או תוכן פרסומי בשם או בהודעה.', 'Sending is blocked for 24 hours because the name or message contained a link or promotional content.'],
    rate_limit: ['נשלחו יותר מדי פניות. נא לנסות שוב בעוד שעה.', 'Too many submissions. Please try again in an hour.'],
    invalid: ['נא לבדוק את הפרטים שהזנת ולנסות שוב.', 'Please check the entered details and try again.'],
    sending: ['שולח את הפנייה…', 'Sending your message…'],
    sent: ['הודעת הביטול נשלחה לחנות. זהו אישור שליחת ההודעה, ולא אישור שבוצע החזר כספי. מומלץ לשמור את פרטי הפנייה.', 'Your cancellation notice was sent to the store. This confirms submission, not a refund. Please keep a record of your request.']
  };
  const translate = key => strings[key][document.documentElement.lang === 'en' ? 1 : 0];
  const show = key => {
    status.dataset.he = strings[key][0];
    status.dataset.en = strings[key][1];
    status.textContent = translate(key);
    status.style.display = 'block';
  };
  let token = '', widget, submitting = false, attempt = crypto.randomUUID();
  const hasLink = () => false;
  function validateLinks() {
    let blocked = false;
    for (const key of ['name', 'message']) {
      const field = form.elements.namedItem(key);
      const invalid = hasLink(field.value);
      field.setCustomValidity(invalid ? translate('links') : '');
      blocked ||= invalid;
    }
    button.disabled = submitting || blocked;
    if (blocked) show('links');
    else if (status.textContent === strings.links[0] || status.textContent === strings.links[1]) status.style.display = 'none';
    return !blocked;
  }
  for (const key of ['name', 'message']) form.elements.namedItem(key).addEventListener('input', validateLinks);
  // Native navigation is disabled even if challenge setup fails. Never fall back
  // to FormSubmit, since that would reopen the direct spam path.
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || !validateLinks() || !form.reportValidity()) return;
    if (!endpoint || !sitekey) { show('unavailable'); return; }
    if (!token) { show('verification'); return; }
    submitting = true;
    button.disabled = true;
    button.textContent = translate('sending');
    const fields = new FormData(form);
    const body = {name: String(fields.get('name') || ''), email: String(fields.get('email') || ''), phone: String(fields.get('phone') || ''), message: String(fields.get('message') || ''), honey: String(fields.get('_honey') || ''), purpose: 'cancellation', order_number: String(fields.get('order_number') || ''), token, id: attempt};
    try {
      const response = await fetch(endpoint, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body), credentials: 'omit', signal: AbortSignal.timeout(30000)});
      const result = await response.json();
      if (response.ok && result.ok === true) {
        form.reset(); attempt = crypto.randomUUID(); show('sent');
      } else {
        show(['blocked', 'rate_limit', 'verification', 'invalid'].includes(result.code) ? result.code : 'unavailable');
      }
    } catch { show('unavailable'); }
    finally {
      token = '';
      if (window.turnstile && widget !== undefined) window.turnstile.reset(widget);
      submitting = false;
      validateLinks();
      button.textContent = button.getAttribute(document.documentElement.lang === 'en' ? 'data-en' : 'data-he');
    }
  });
  if (!endpoint || !sitekey) return;
  const challenge = document.createElement('div');
  challenge.style.gridColumn = '1 / -1';
  challenge.style.margin = '12px 0';
  button.before(challenge);
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.onload = () => {
    widget = window.turnstile.render(challenge, {
      sitekey, action: 'cancellation', language: 'en', size: window.innerWidth < 380 ? 'compact' : 'normal',
      callback: value => {token = value;},
      'expired-callback': () => {token = '';},
      'error-callback': () => {token = ''; show('verification');}
    });
  };
  script.onerror = () => show('unavailable');
  document.head.append(script);
})();