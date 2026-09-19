(() => {
  const total = document.querySelector('#cartTotal');
  if (!total) return;
  const updateLabel = () => {
    const english = document.documentElement.lang === 'en';
    const label = total.querySelector('span');
    const checkout = document.querySelector('#checkout');
    const notice = document.querySelector('#cartDrawer .notice');
    const wanted = english ? 'Total to pay' : 'סה״כ לתשלום';
    if (label && label.textContent !== wanted) label.textContent = wanted;
    const checkoutText = english ? 'Continue to payment' : 'המשך לתשלום';
    if (checkout && checkout.textContent !== checkoutText) checkout.textContent = checkoutText;
    const noticeText = '';
    if (notice) {
      notice.hidden = true;
      if (notice.textContent !== noticeText) notice.textContent = noticeText;
    }
    if (!english) {
      document.querySelectorAll('#cartDrawer, #cartDrawer *').forEach(element => {
        element.style.setProperty('font-family', 'Tahoma, "Arial Hebrew", Arial, sans-serif', 'important');
        element.style.setProperty('font-style', 'normal', 'important');
      });
    }
  };
  new MutationObserver(updateLabel).observe(document.querySelector('#cartDrawer'), { childList: true, subtree: true });
  document.addEventListener('electroshop-language-change', () => setTimeout(updateLabel));
  updateLabel();
})();
