(() => {
  const header = document.querySelector('body > header.topbar');
  if (!header) return;
  let previous = Math.max(0, window.scrollY), distance = 0, direction = 0, queued = false;
  function update() {
    queued = false;
    const y = Math.max(0, window.scrollY), delta = y - previous;
    previous = y;
    if (y < 40 || header.contains(document.activeElement) || document.querySelector('#mainMenu.open')) {
      header.classList.remove('home-header-hidden'); distance = 0; return;
    }
    if (Math.abs(delta) < 1) return;
    const nextDirection = Math.sign(delta);
    distance = nextDirection === direction ? distance + Math.abs(delta) : Math.abs(delta);
    direction = nextDirection;
    if (distance >= 12) {
      header.classList.toggle('home-header-hidden', direction > 0 && y > header.offsetHeight + 30);
      distance = 0;
    }
  }
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('home-header-hidden'));
})();
