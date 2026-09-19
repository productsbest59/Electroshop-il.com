(() => {
  const refresh = () => {
    document.querySelectorAll('.product[data-product]').forEach(card => {
      const priceText = card.querySelector('.price')?.textContent || '';
      const numericPrice = Number(priceText.replace(/[^0-9.]/g, ''));
      const invalid = !Number.isFinite(numericPrice) || numericPrice <= 0;
      const button = card.querySelector('.add');
      if (button) {
        button.disabled = invalid;
        button.setAttribute('aria-disabled', String(invalid));
      }
    });
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('.add');
    if (button?.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  new MutationObserver(refresh).observe(document.querySelector('#products'), { childList: true, subtree: true });
  document.addEventListener('electroshop-language-change', () => setTimeout(refresh));
  refresh();
})();
