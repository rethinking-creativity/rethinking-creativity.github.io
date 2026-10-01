// Deck: click (or Space/Enter, or arrow keys) to flick the top card to the back of the stack.
// The flick sound is synthesised with Web Audio, so there is no audio file to load.
(function () {
  const deck = document.querySelector('[data-deck]');
  if (!deck) return;
  const stack = deck.querySelector('.qdeck__stack');
  const cards = [...stack.querySelectorAll('.dcard')];
  const dots = [...deck.querySelectorAll('.qdeck__dots button')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let order = cards.map((_, i) => i);
  let busy = false;
  let audio = null;

  function layout() {
    order.forEach((cardIndex, pos) => {
      const c = cards[cardIndex];
      c.dataset.pos = String(Math.min(pos, 3));
      c.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
      c.style.zIndex = String(10 - pos);
    });
    dots.forEach((d, i) => d.setAttribute('aria-current', order[0] === i ? 'true' : 'false'));
  }

  // A short paper flick: filtered noise burst with a quick downward sweep, plus a soft tap.
  function flickSound() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime;
      const len = Math.floor(audio.sampleRate * 0.16);
      const buf = audio.createBuffer(1, len, audio.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
      const noise = audio.createBufferSource();
      noise.buffer = buf;
      const band = audio.createBiquadFilter();
      band.type = 'bandpass';
      band.Q.value = 0.9;
      band.frequency.setValueAtTime(3200, t);
      band.frequency.exponentialRampToValueAtTime(900, t + 0.14);
      const g = audio.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      noise.connect(band).connect(g).connect(audio.destination);
      noise.start(t);

      const tap = audio.createOscillator();
      const tg = audio.createGain();
      tap.type = 'sine';
      tap.frequency.setValueAtTime(220, t + 0.12);
      tap.frequency.exponentialRampToValueAtTime(120, t + 0.2);
      tg.gain.setValueAtTime(0.0001, t + 0.12);
      tg.gain.exponentialRampToValueAtTime(0.12, t + 0.13);
      tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      tap.connect(tg).connect(audio.destination);
      tap.start(t + 0.12);
      tap.stop(t + 0.24);
    } catch (e) { /* audio unavailable: stay silent */ }
  }

  function next(dir) {
    if (busy) return;
    busy = true;
    flickSound();
    const top = cards[order[0]];
    const done = () => {
      top.classList.remove('is-leaving', 'is-leaving--left');
      order.push(order.shift());
      layout();
      busy = false;
    };
    if (reduce) { done(); return; }
    top.classList.add(dir < 0 ? 'is-leaving--left' : 'is-leaving');
    setTimeout(done, 380);
  }

  function goTo(i) {
    if (busy || order[0] === i) return;
    while (order[0] !== i) order.push(order.shift());
    flickSound();
    layout();
  }

  stack.addEventListener('click', () => next(1));
  stack.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); next(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); next(-1); }
  });
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
  layout();
})();

// Organizer cards: tap to flip on touch screens (hover handles mouse)
document.querySelectorAll('.person').forEach((b) => b.addEventListener('click', () => b.classList.toggle('is-flipped')));
