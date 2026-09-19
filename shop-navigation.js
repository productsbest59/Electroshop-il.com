
    const langToggle = document.getElementById('langToggle');
    const langStorageKey = 'electroshop_home_lang_v1';

    function getLang() {
      const saved = localStorage.getItem(langStorageKey);
      return saved === 'en' ? 'en' : 'he';
    }

    function applyLang(lang) {
      const isEnglish = lang === 'en';
      document.documentElement.lang = isEnglish ? 'en' : 'he';
      document.documentElement.dir = isEnglish ? 'ltr' : 'rtl';
      document.body.setAttribute('dir', isEnglish ? 'ltr' : 'rtl');

      document.querySelectorAll('[data-he]').forEach(el => {
        const value = isEnglish ? el.getAttribute('data-en') : el.getAttribute('data-he');
        if (el.classList.contains('trans-html')) el.innerHTML = value;
        else el.textContent = value;
      });

      document.querySelectorAll('[data-placeholder-he]').forEach(el => {
        el.placeholder = isEnglish ? el.getAttribute('data-placeholder-en') : el.getAttribute('data-placeholder-he');
      });

      localStorage.setItem(langStorageKey, lang);
      localStorage.setItem('electroshop_store_language', lang);
    }

    langToggle.addEventListener('click', function() {
      const menu = document.getElementById('languageMenu');
      const willOpen = menu.hidden;
      menu.hidden = !willOpen;
      langToggle.setAttribute('aria-expanded', String(willOpen));
    });

    document.querySelectorAll('[data-language]').forEach(button => {
      button.addEventListener('click', function() {
        const lang = button.dataset.language;
        applyLang(lang);
        document.getElementById('languageMenu').hidden = true;
        langToggle.setAttribute('aria-expanded', 'false');
        document.dispatchEvent(new CustomEvent('electroshop-language-change', {detail:lang}));
      });
    });

    document.addEventListener('click', function(event) {
      if (!event.target.closest('.language-picker')) {
        document.getElementById('languageMenu').hidden = true;
        langToggle.setAttribute('aria-expanded', 'false');
      }
    });

    applyLang(getLang());
  

    const menuToggle = document.getElementById('menuToggle');
    const menuClose = document.getElementById('menuClose');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const mainMenu = document.getElementById('mainMenu');

    function openMenu() {
      mainMenu.classList.add('open');
      menuBackdrop.classList.add('open');
      document.body.classList.add('main-menu-is-open');
      mainMenu.setAttribute('aria-hidden', 'false');
      menuToggle.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      mainMenu.classList.remove('open');
      menuBackdrop.classList.remove('open');
      document.body.classList.remove('main-menu-is-open');
      mainMenu.setAttribute('aria-hidden', 'true');
      menuToggle.setAttribute('aria-expanded', 'false');
    }

    menuToggle.addEventListener('click', function() {
      if (mainMenu.classList.contains('open')) closeMenu();
      else openMenu();
    });

    menuClose.addEventListener('click', closeMenu);
    menuBackdrop.addEventListener('click', closeMenu);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeMenu();
    });
  