(() => {
  const form = document.getElementById('electroshopContactForm') || document.getElementById('contactForm');
  if (!form) return;
  const section = document.getElementById('electroshop-contact') || document.getElementById('contact');
  let contactDialog, contactOpener;
  if (document.body.dataset.contactModal === 'true') {
    contactDialog = document.createElement('dialog');
    contactDialog.className = 'contact-modal';
    contactDialog.setAttribute('aria-label', 'יצירת קשר');
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'contact-modal-close'; close.textContent = '×'; close.setAttribute('aria-label', 'סגירה');
    contactDialog.append(close, section); document.body.append(contactDialog);
    const trigger = document.createElement('button');
    trigger.type = 'button'; trigger.className = 'floating-contact'; trigger.dataset.contactTrigger = ''; trigger.setAttribute('aria-label', 'יצירת קשר'); trigger.setAttribute('aria-haspopup','dialog'); trigger.innerHTML = '<span aria-hidden="true">✉</span><span>יצירת קשר</span>';
    document.body.append(trigger);
    close.addEventListener('click', () => contactDialog.close());
    contactDialog.addEventListener('click', e => { if (e.target === contactDialog) { const r=contactDialog.getBoundingClientRect(); if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) contactDialog.close(); } });
    contactDialog.addEventListener('close', () => contactOpener?.focus());
  }
  const english = () => document.documentElement.lang === 'en';
  function translate() {
    section.dir = english() ? 'ltr' : 'rtl';
    section.querySelectorAll('[data-he]').forEach(el => el.textContent = el.dataset[english() ? 'en' : 'he']);
    section.querySelectorAll('[data-ph-he]').forEach(el => {
      el.placeholder = el.dataset[english() ? 'phEn' : 'phHe'];
      el.setAttribute('aria-label', el.placeholder);
    });
  }
  translate();
  new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.addEventListener('click', event => {
    const link = event.target.closest('a,button');
    if (!link || !link.matches('[data-contact-trigger],.contact-open-trigger,.contact-toggle,a[href="#contact"],a[href="index.html#contact"]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (typeof window.closeMenu === 'function') window.closeMenu();
    document.getElementById('menuClose')?.click();
    document.getElementById('legacyMainMenu')?.classList.remove('open');
    if (contactDialog) { contactOpener = link; contactDialog.showModal(); form.elements.name.focus(); return; }
    (section.closest('.home-contact') || section).scrollIntoView({behavior:'smooth',block:'start'});
    form.elements.name.focus({preventScroll:true});
  },true);
})();

(() => {
  const form = document.getElementById('electroshopContactForm') || document.getElementById('contactForm');
  if (!form) return;
  const status = document.getElementById('electroshopContactStatus') || document.getElementById('formStatus');
  const button = form.querySelector('button[type="submit"]');
  const endpoint = form.dataset.contactEndpoint || 'https://digital247-contact.productsbest59.workers.dev/contact';
  const sitekey = form.dataset.turnstileSitekey || '0x4AAAAAAGCR9MahhbBEvJRH';
  const strings = {
    links: ['Links are not allowed in the name or message. Remove the link to send.', 'Links are not allowed in the name or message. Remove the link to send.'],
    unavailable: ['השליחה אינה זמינה כרגע. נסה שוב בעוד כמה דקות.', 'Sending is temporarily unavailable. Please try again in a few minutes.'],
    verification: ['נא להשלים את האימות ולנסות שוב.', 'Please complete the verification and try again.'],
    blocked: ['השליחה נחסמה ל־24 שעות בגלל קישור או תוכן פרסומי בשם או בהודעה.', 'Sending is blocked for 24 hours because the name or message contained a link or promotional content.'],
    rate_limit: ['נשלחו יותר מדי פניות. נא לנסות שוב בעוד שעה.', 'Too many submissions. Please try again in an hour.'],
    invalid: ['נא לבדוק את הפרטים שהזנת ולנסות שוב.', 'Please check the entered details and try again.'],
    sending: ['שולח את הפנייה…', 'Sending your message…'],
    sent: ['הפנייה נשלחה בהצלחה.', 'Your message has been sent successfully.']
  };
  const translate = key => strings[key][document.documentElement.lang === 'en' ? 1 : 0];
  const show = key => {
    status.dataset.he = strings[key][0];
    status.dataset.en = strings[key][1];
    status.textContent = translate(key);
    status.style.display = 'block';
  };
  let token = '', widget, submitting = false, attempt = crypto.randomUUID();
  const hasLink = value => /(?:https?:\/\/|ftp:\/\/|www\.|(?:[\p{L}\p{N}-]+\.)+(?:[\p{L}]{2,63}|xn--[a-z0-9-]+)(?=$|[^\p{L}\p{N}-]))/iu.test(value.normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/g, ''));
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
    const body = {name: String(fields.get('name') || ''), email: String(fields.get('email') || ''), phone: String(fields.get('phone') || ''), message: String(fields.get('message') || ''), honey: String(fields.get('_honey') || ''), token, id: attempt};
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
  challenge.style.margin = '12px 0';
  button.before(challenge);
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.onload = () => {
    widget = window.turnstile.render(challenge, {
      sitekey, action: 'contact', language: 'en', size: window.innerWidth < 380 ? 'compact' : 'normal',
      callback: value => {token = value;},
      'expired-callback': () => {token = '';},
      'error-callback': () => {token = ''; show('verification');}
    });
  };
  script.onerror = () => show('unavailable');
  document.head.append(script);
})();