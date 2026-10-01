// Tracked changes: on load, strike the old phrase, then type the new one. Runs once.
(function () {
  const ins = document.querySelector('[data-ins]');
  const del = document.querySelector('[data-del]');
  if (!ins || !del) return;
  const full = ins.textContent;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  ins.textContent = '';
  del.style.textDecorationColor = 'transparent';
  setTimeout(() => {
    del.style.transition = 'text-decoration-color 0.4s';
    del.style.textDecorationColor = '';
    let i = 0;
    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    ins.after(caret);
    const tick = setInterval(() => {
      ins.textContent = full.slice(0, ++i);
      if (i >= full.length) clearInterval(tick);
    }, 70);
  }, 900);
})();
