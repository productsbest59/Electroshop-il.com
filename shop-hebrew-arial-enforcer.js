(() => {
  const targets = [
    '#cartDrawer',
    '#faq',
    '.faq-section',
    '.checkout-shell',
    '.site-head .button',
    '#a11yPanel'
  ];

  const apply = () => {
    if (document.documentElement.lang !== 'he') return;
    document.querySelectorAll(targets.join(',')).forEach(root => {
      [root, ...root.querySelectorAll('*')].forEach(element => {
        if (element.matches('i, .fa, .fas, .far, .fab, .fa-solid, .fa-regular, .fa-brands')) return;
        element.style.setProperty('font-family', 'Tahoma, "Arial Hebrew", Arial, sans-serif', 'important');
        element.style.setProperty('font-style', 'normal', 'important');
        element.dataset.electroshopArial = 'true';
      });
    });
  };

  const clear = () => {
    document.querySelectorAll('[data-electroshop-arial="true"]').forEach(element => {
      element.style.removeProperty('font-family');
      delete element.dataset.electroshopArial;
    });
  };

  const refresh = () => {
    if (document.documentElement.lang === 'he') apply();
    else clear();
  };

  new MutationObserver(refresh).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('electroshop-language-change', () => setTimeout(refresh, 0));
  refresh();
})();
