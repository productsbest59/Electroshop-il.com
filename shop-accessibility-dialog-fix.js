(() => {
  const enhancementStyles = document.createElement('style');
  enhancementStyles.textContent = `
    .a11y-panel, .a11y-panel *,
    #a11yTitle, .a11y-title, .a11y-section-title, .a11y-label,
    .a11y-card, .a11y-circle-btn, .a11y-value, .a11y-footer-note, .a11y-reset {
      font-family: Arial, sans-serif !important;
      font-style: normal !important;
    }
    #a11yTitle,
    .a11y-panel .a11y-title,
    .a11y-panel .a11y-section-title,
    .a11y-panel #a11yReset {
      font-family: Arial, sans-serif !important;
      font-weight:400 !important;
      font-style:normal !important;
      font-variant:normal !important;
      font-feature-settings:normal !important;
      letter-spacing:normal !important;
      text-transform:none !important;
      text-shadow:none !important;
    }
    .a11y-panel .a11y-label,
    .a11y-panel .a11y-card,
    .a11y-panel .a11y-value,
    .a11y-panel .a11y-footer-note { font-weight:400 !important; }
    .a11y-title, .a11y-section-title, .a11y-reset {
      letter-spacing: normal !important;
    }
    .a11y-panel { left:auto !important; right:0 !important; transform:translateX(100%) !important; box-shadow:-20px 0 60px rgba(0,0,0,.28) !important; font-size: 16px !important; height: 100dvh !important; max-height: 100dvh !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; }
    .a11y-panel.open { transform:translateX(0) !important; }
    .a11y-panel .a11y-header { flex: 0 0 62px !important; padding: 11px 16px !important; min-height: 62px !important; }
    .a11y-panel .a11y-body { flex: 1 1 auto !important; min-height: 0 !important; padding: 12px 14px !important; overflow: hidden !important; display:flex !important; flex-direction:column !important; }
    .a11y-panel .a11y-grid { flex:1 1 auto !important; min-height:0 !important; grid-template-columns:repeat(3,minmax(0,1fr)) !important; grid-template-rows:repeat(3,minmax(0,1fr)) !important; gap: 9px !important; margin:0 0 8px !important; }
    .a11y-panel .a11y-title { font-size: 23px !important; line-height: 1.25 !important; }
    .a11y-panel .a11y-section-title { font-size: 15px !important; line-height: 1.25 !important; margin: 8px 0 4px !important; }
    .a11y-panel .a11y-card { min-height: 0 !important; height:100% !important; padding: 7px 5px !important; gap: 5px !important; }
    .a11y-panel .a11y-card, .a11y-panel .a11y-label { font-size: 15px !important; line-height: 1.2 !important; }
    .a11y-panel .a11y-icon { width:46px !important; height:46px !important; font-size: 30px !important; line-height: 1 !important; }
    .a11y-panel .a11y-slider-wrap { flex:0 0 auto !important; margin:0 0 6px !important; }
    .a11y-panel .a11y-slider-row { margin-top: 4px !important; }
    .a11y-panel .a11y-circle-btn { width: 46px !important; height: 46px !important; font-size: 29px !important; line-height: 1 !important; }
    .a11y-panel .a11y-value { padding: 5px 10px !important; font-size: 13px !important; line-height: 1.1 !important; }
    .a11y-panel .a11y-footer-note { font-size: 13px !important; line-height: 1.4 !important; }
    .a11y-panel .a11y-reset { margin-top: 6px !important; padding: 10px 12px !important; font-size: 15px !important; line-height: 1.2 !important; }
    body.a11y-stop-motion *, body.a11y-stop-motion *::before, body.a11y-stop-motion *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
    body.a11y-large-cursor, body.a11y-large-cursor * {
      cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='48' viewBox='0 0 40 48'%3E%3Cpath d='M3 2V35L12 27L19 44L25 41L18 25H31Z' fill='white' stroke='black' stroke-width='3' stroke-linejoin='round'/%3E%3C/svg%3E") 3 2, auto !important;
    }
    body.a11y-text-spacing * {
      letter-spacing: 0.08em !important;
      word-spacing: 0.12em !important;
      line-height: 1.7 !important;
    }
    body.a11y-text-spacing .a11y-panel, body.a11y-text-spacing .a11y-panel * {
      letter-spacing: normal !important;
      word-spacing: normal !important;
    }
    body.a11y-readable-text :where(.product, .product *, .product-detail-modal, .product-detail-modal *, .model-showcase, .model-showcase *, .cart-drawer, .cart-drawer *, .product-modal, .product-modal *) {
      font-family: Arial, sans-serif !important;
      line-height: 1.8 !important;
      letter-spacing: .02em !important;
      word-spacing: .05em !important;
    }
    body.a11y-bold-text :where(.product, .product *, .product-detail-modal, .product-detail-modal *, .model-showcase, .model-showcase *, .cart-drawer, .cart-drawer *, .product-modal, .product-modal *) {
      font-weight: 800 !important;
    }
    body.a11y-grayscale :where(.product, .product-detail-modal, .model-showcase, .model-lightbox, .cart-drawer, .product-modal, .mehadrin-gallery) {
      filter: grayscale(100%) !important;
    }
    body.a11y-blackwhite :where(.product, .product-detail-modal, .model-showcase, .model-lightbox, .cart-drawer, .product-modal, .mehadrin-gallery) {
      filter: grayscale(100%) contrast(145%) brightness(112%) !important;
    }
    body.a11y-dark-mode :where(.product, .product-detail-modal, .model-showcase, .model-lightbox, .cart-drawer, .product-modal, .mehadrin-gallery) {
      filter: invert(100%) hue-rotate(180deg) !important;
    }
    body.a11y-high-contrast :where(.product, .product-detail-card, .model-gallery figure, .cart-drawer, .product-modal) {
      background:#000 !important;
      color:#fff !important;
      border-color:#fff !important;
      box-shadow:0 0 0 2px #fff !important;
    }
    body.a11y-high-contrast :where(.product, .product-detail-card, .model-gallery figure, .cart-drawer, .product-modal) :where(h1,h2,h3,h4,p,span,strong,label,small) {
      color:#fff !important;
    }
    body.a11y-highlight-links :where(.product, .product-detail-modal, .model-showcase, .cart-drawer, .product-modal) :where(a,button) {
      text-decoration:underline !important;
      text-decoration-thickness:3px !important;
      text-underline-offset:3px !important;
      outline:2px solid #ffd85a !important;
      outline-offset:2px !important;
    }
    body.a11y-focus-visible a,
    body.a11y-focus-visible button,
    body.a11y-focus-visible input,
    body.a11y-focus-visible select,
    body.a11y-focus-visible textarea,
    body.a11y-focus-visible [tabindex]:not([tabindex="-1"]) {
      outline: 3px solid #ffd85a !important;
      outline-offset: 2px !important;
    }
    body.a11y-focus-visible a:focus,
    body.a11y-focus-visible button:focus,
    body.a11y-focus-visible input:focus,
    body.a11y-focus-visible select:focus,
    body.a11y-focus-visible textarea:focus,
    body.a11y-focus-visible [tabindex]:focus {
      box-shadow: 0 0 0 2px #080604, 0 0 18px rgba(255,216,90,.9) !important;
    }
    @media (max-height: 720px) {
      .a11y-panel .a11y-header { flex-basis:48px !important; min-height: 48px !important; padding: 7px 12px !important; }
      .a11y-panel .a11y-title { font-size: 20px !important; }
      .a11y-panel .a11y-body { padding: 7px 12px !important; }
      .a11y-panel .a11y-card { min-height: 0 !important; padding: 4px 3px !important; }
      .a11y-panel .a11y-icon { width:42px !important; height:42px !important; font-size: 30px !important; }
      .a11y-panel .a11y-label { font-size: 15px !important; }
      .a11y-panel .a11y-section-title { margin: 5px 0 2px !important; font-size: 13px !important; }
      .a11y-panel .a11y-circle-btn { width: 40px !important; height: 40px !important; font-size: 25px !important; }
      .a11y-panel .a11y-reset { padding: 7px 10px !important; }
    }
    @media (max-width: 360px) {
      .a11y-panel .a11y-body { padding-inline:8px !important; }
      .a11y-panel .a11y-grid { gap:5px !important; }
      .a11y-panel .a11y-label { font-size:13px !important; }
    }
    @media (max-width: 600px) {
      .a11y-panel {
        top:12px !important;
        right:8px !important;
        transform:translateX(calc(100% + 16px)) !important;
        width:min(390px,calc(100vw - 16px)) !important;
        height:auto !important;
        max-height:calc(100dvh - 24px) !important;
        border:1px solid rgba(212,175,55,.55) !important;
        border-radius:20px !important;
        overflow:hidden !important;
      }
      .a11y-panel.open { transform:translateX(0) !important; }
      .a11y-panel .a11y-body { flex:0 0 auto !important; }
      .a11y-panel .a11y-grid {
        flex:0 0 auto !important;
        grid-template-rows:repeat(3,clamp(86px,11dvh,104px)) !important;
      }
      .a11y-panel .a11y-card {
        height:clamp(86px,11dvh,104px) !important;
        overflow:hidden !important;
      }
      .a11y-panel .a11y-icon {
        width:40px !important;
        height:40px !important;
        font-size:26px !important;
        flex:0 0 40px !important;
      }
      .a11y-panel .a11y-label { font-size:14px !important; }
    }
    @media (max-height: 600px) and (orientation: landscape) {
      .a11y-panel {
        top:6px !important;
        right:6px !important;
        width:min(520px,82vw) !important;
        height:calc(100dvh - 12px) !important;
        max-height:calc(100dvh - 12px) !important;
        transform:translateX(calc(100% + 12px)) !important;
      }
      .a11y-panel.open { transform:translateX(0) !important; }
      .a11y-panel .a11y-header {
        flex:0 0 46px !important;
        min-height:46px !important;
        padding:6px 12px !important;
      }
      .a11y-panel .a11y-body {
        flex:1 1 auto !important;
        min-height:0 !important;
        overflow-y:auto !important;
        overscroll-behavior:contain !important;
        padding:6px 10px 10px !important;
      }
      .a11y-panel .a11y-grid {
        flex:0 0 auto !important;
        grid-template-rows:repeat(3,70px) !important;
        gap:6px !important;
      }
      .a11y-panel .a11y-card {
        height:70px !important;
        padding:4px 3px !important;
        gap:3px !important;
        overflow:hidden !important;
      }
      .a11y-panel .a11y-icon {
        width:32px !important;
        height:32px !important;
        font-size:21px !important;
        flex:0 0 32px !important;
      }
      .a11y-panel .a11y-label {
        font-size:12px !important;
        line-height:1.1 !important;
      }
      .a11y-panel .a11y-section-title { font-size:12px !important; }
      .a11y-panel .a11y-slider-wrap { margin-bottom:4px !important; }
      .a11y-panel .a11y-footer-note { font-size:11px !important; }
      .a11y-panel .a11y-reset { margin-top:3px !important; padding:6px 9px !important; }
    }
  `;
  document.head.appendChild(enhancementStyles);
  const panel = document.getElementById('a11yPanel');
  const trigger = document.getElementById('a11yFab');
  const closeButton = document.getElementById('a11yClose');
  const backdrop = document.getElementById('a11yBackdrop');
  if (!panel || !trigger || !closeButton) return;

  panel.querySelectorAll('.a11y-title, .a11y-section-title, .a11y-label, .a11y-card, .a11y-circle-btn, .a11y-value, .a11y-footer-note, .a11y-reset').forEach(element => {
    element.style.setProperty('font-family', 'Arial, sans-serif', 'important');
    element.style.setProperty('font-style', 'normal', 'important');
  });
  panel.querySelectorAll('#a11yTitle, .a11y-title, .a11y-section-title, #a11yReset').forEach(element => {
    element.style.setProperty('font-family', 'Arial, sans-serif', 'important');
    element.style.setProperty('font-weight', '400', 'important');
    element.style.setProperty('font-style', 'normal', 'important');
    element.style.setProperty('font-variant', 'normal', 'important');
    element.style.setProperty('letter-spacing', 'normal', 'important');
    element.style.setProperty('text-transform', 'none', 'important');
    element.style.setProperty('text-shadow', 'none', 'important');
  });
  panel.querySelectorAll('.a11y-label, .a11y-card, .a11y-value, .a11y-footer-note').forEach(element => {
    element.style.setProperty('font-weight', '400', 'important');
  });

  const toggleButtons = [...panel.querySelectorAll('.a11y-card[data-mode]')];
  let wasOpen = panel.classList.contains('open');
  let returnFocus = false;

  const focusableSelector = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function updateLabels() {
    const english = document.documentElement.lang === 'en';
    trigger.setAttribute('aria-label', english ? 'Open accessibility tools' : 'פתח תפריט נגישות');
    closeButton.setAttribute('aria-label', english ? 'Close accessibility tools' : 'סגור תפריט נגישות');
    const minus = document.getElementById('fontMinus');
    const plus = document.getElementById('fontPlus');
    if (minus) minus.setAttribute('aria-label', english ? 'Decrease text size' : 'הקטנת טקסט');
    if (plus) plus.setAttribute('aria-label', english ? 'Increase text size' : 'הגדלת טקסט');
  }

  function updateToggleStates() {
    toggleButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
      button.setAttribute('type', 'button');
    });
  }

  function syncEnhancedModes() {
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem('electroshop_a11y_sidepanel_v1')) || []; } catch (_) {}
    ['a11y-stop-motion', 'a11y-large-cursor', 'a11y-text-spacing', 'a11y-focus-visible', 'a11y-blackwhite'].forEach(mode => {
      document.body.classList.toggle(mode, saved.includes(mode));
    });
    updateToggleStates();
  }

  function markDynamicContent() {
    document.querySelectorAll('#products, .product, #modelGallery, .model-gallery, .product-detail-modal, .model-lightbox, .cart-drawer, .product-modal')
      .forEach(element => element.setAttribute('data-a11y-content', 'true'));
  }

  function syncDialogState() {
    const open = panel.classList.contains('open');
    trigger.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    panel.setAttribute('aria-modal', String(open));
    panel.inert = !open;
    if (backdrop) backdrop.setAttribute('aria-hidden', 'true');

    if (open && !wasOpen) {
      returnFocus = true;
      requestAnimationFrame(() => closeButton.focus());
    } else if (!open && wasOpen && returnFocus) {
      returnFocus = false;
      requestAnimationFrame(() => trigger.focus());
    }
    wasOpen = open;
    updateToggleStates();
  }

  panel.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !panel.classList.contains('open')) return;
    const focusable = [...panel.querySelectorAll(focusableSelector)].filter(element => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  toggleButtons.forEach(button => {
    new MutationObserver(updateToggleStates).observe(button, { attributes: true, attributeFilter: ['class'] });
    button.addEventListener('click', () => requestAnimationFrame(syncEnhancedModes));
  });
  const resetButton = document.getElementById('a11yReset');
  if (resetButton) resetButton.addEventListener('click', () => {
    document.body.classList.remove('a11y-stop-motion', 'a11y-large-cursor', 'a11y-text-spacing', 'a11y-focus-visible', 'a11y-blackwhite');
    requestAnimationFrame(updateToggleStates);
  });
  new MutationObserver(syncDialogState).observe(panel, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(updateLabels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  new MutationObserver(() => {
    markDynamicContent();
    syncEnhancedModes();
  }).observe(document.body, { childList: true, subtree: true });

  closeButton.setAttribute('type', 'button');
  trigger.setAttribute('type', 'button');
  updateLabels();
  markDynamicContent();
  syncEnhancedModes();
  updateToggleStates();
  syncDialogState();
})();
