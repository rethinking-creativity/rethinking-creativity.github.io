// Title revision as an insertion: "Rethinking Creativity" gains "Human" with a typing caret.
(function () {
  const ins = document.querySelector('[data-insert]');
  if (!ins) return;
  const full = ins.textContent;
  const spark = document.querySelector('.title-spark');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { if (spark) spark.classList.add('is-on'); return; }
  ins.textContent = '';
  const caret = document.createElement('span');
  caret.className = 'caret';
  caret.setAttribute('aria-hidden', 'true');
  ins.after(caret);
  setTimeout(() => {
    let i = 0;
    const tick = setInterval(() => {
      ins.textContent = full.slice(0, ++i);
      if (i >= full.length) {
        clearInterval(tick);
        if (spark) spark.classList.add('is-on');
        setTimeout(() => caret.remove(), 700);
      }
    }, 110);
  }, 900);
})();
