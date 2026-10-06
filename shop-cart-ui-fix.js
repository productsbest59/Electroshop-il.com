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
    const noticeText = english ? 'Free delivery on purchases of ILS 100 or more, unless otherwise stated. Phone delivery: ILS 50. Guitars and products marked pickup only: store pickup. Pickup has no minimum or delivery charge. Choose delivery or pickup at checkout.' : 'משלוח חינם בקנייה מ-100 ₪, אלא אם צוין אחרת. משלוח טלפונים - 50 ₪. גיטרות ומוצרים המסומנים באיסוף עצמי בלבד - איסוף מהחנות. באיסוף עצמי אין מינימום ואין דמי משלוח. בחירת משלוח או איסוף עצמי בדף התשלום.';
    if (notice) {
      notice.hidden = false;
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
