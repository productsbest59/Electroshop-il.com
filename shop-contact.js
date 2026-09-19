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
    document.getElementById('legacyMainMenu')?.classList.remove('open');
    if (contactDialog) { contactOpener = link; contactDialog.showModal(); form.elements.name.focus(); return; }
    (section.closest('.home-contact') || section).scrollIntoView({behavior:'smooth',block:'start'});
    form.elements.name.focus({preventScroll:true});
  },true);
  if (form.id === 'contactForm') return;
  form.addEventListener('submit',async event => {
    event.preventDefault();
    const button=form.querySelector('[type="submit"]'),status=document.getElementById('electroshopContactStatus');
    if(button.disabled)return;
    button.disabled=true;status.textContent=english()?'Sending...':'שולח...';
    try {
      const body=new FormData(form);body.append('page',location.href.split('#')[0]);
      const response=await fetch(form.action,{method:'POST',body,headers:{Accept:'application/json'}});
      const data=await response.json();
      if(!response.ok || (data.success!==true && data.success!=='true'))throw new Error('Submission failed');
      status.textContent=english()?'Message sent successfully.':'ההודעה נשלחה בהצלחה.';form.reset();
    }catch{
      status.textContent=english()?'Unable to send. Please try again or contact us on WhatsApp.':'לא ניתן לשלוח כרגע. נסו שוב או פנו אלינו בוואטסאפ.';
    }finally{button.disabled=false;}
  });
})();
