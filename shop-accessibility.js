

    const fab = document.getElementById('a11yFab');
    const panel = document.getElementById('a11yPanel');
    const backdrop = document.getElementById('a11yBackdrop');
    const closeBtn = document.getElementById('a11yClose');
    const resetBtn = document.getElementById('a11yReset');
    const cards = Array.from(document.querySelectorAll('.a11y-card'));
    const fontValue = document.getElementById('fontValue');
    const fontPlus = document.getElementById('fontPlus');
    const fontMinus = document.getElementById('fontMinus');

    const storageKey = 'electroshop_a11y_sidepanel_v1';
    const fontStorageKey = 'electroshop_font_scale_v1';

    function openPanel() {
      panel.classList.add('open');
      backdrop.classList.add('open');
      fab.setAttribute('aria-expanded', 'true');
    }

    function closePanel() {
      panel.classList.remove('open');
      backdrop.classList.remove('open');
      fab.setAttribute('aria-expanded', 'false');
    }

    function getSavedModes() {
      try { return JSON.parse(localStorage.getItem(storageKey)) || []; }
      catch (e) { return []; }
    }

    function saveModes(modes) {
      localStorage.setItem(storageKey, JSON.stringify(modes));
    }

    function getSavedFont() {
      const saved = parseInt(localStorage.getItem(fontStorageKey) || '100', 10);
      return isNaN(saved) ? 100 : Math.min(140, Math.max(90, saved));
    }

    function saveFont(value) {
      localStorage.setItem(fontStorageKey, String(value));
    }

    function applyFont() {
      const value = getSavedFont();
      document.documentElement.style.fontSize = value + '%';
      fontValue.textContent = value + '%';
    }

    function applyModes() {
      const modes = getSavedModes();
      document.body.classList.remove(
        'a11y-dark-mode',
        'a11y-bold-text',
        'a11y-high-contrast',
        'a11y-highlight-links',
        'a11y-readable-text',
        'a11y-grayscale',
        'a11y-blackwhite'
      );
      cards.forEach(card => card.classList.remove('active'));
      modes.forEach(mode => {
        document.body.classList.add(mode);
        cards.filter(c => c.dataset.mode === mode).forEach(c => c.classList.add('active'));
      });
    }

    function toggleMode(mode) {
      let modes = getSavedModes();
      if (modes.includes(mode)) modes = modes.filter(m => m !== mode);
      else modes.push(mode);
      saveModes(modes);
      applyModes();
    }

    fab.addEventListener('click', function() {
      if (panel.classList.contains('open')) closePanel();
      else openPanel();
    });

    closeBtn.addEventListener('click', closePanel);
    backdrop.addEventListener('click', closePanel);

    cards.forEach(function(card) {
      card.addEventListener('click', function() {
        const mode = card.dataset.mode;
        if (mode === 'a11y-high-contrast') {
          let modes = getSavedModes();
          const exists = modes.includes('a11y-high-contrast');
          modes = modes.filter(m => m !== 'a11y-high-contrast');
          if (!exists) modes.push('a11y-high-contrast');
          saveModes(modes);
          applyModes();
          return;
        }
        toggleMode(mode);
      });
    });

    fontPlus.addEventListener('click', function() {
      const next = Math.min(140, getSavedFont() + 10);
      saveFont(next);
      applyFont();
    });

    fontMinus.addEventListener('click', function() {
      const next = Math.max(90, getSavedFont() - 10);
      saveFont(next);
      applyFont();
    });

    resetBtn.addEventListener('click', function() {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(fontStorageKey);
      document.documentElement.style.fontSize = '100%';
      applyModes();
      applyFont();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closePanel();
    });

    applyModes();
    applyFont();
  
