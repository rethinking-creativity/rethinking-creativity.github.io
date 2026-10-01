// Denoise: draw the title into a canvas and resolve it out of noise over 50 steps, once.
(function () {
  const stage = document.querySelector('[data-noise]');
  if (!stage) return;
  const h1 = stage.querySelector('h1');
  const stepLabel = stage.querySelector('.noise-step');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { stepLabel.hidden = true; return; }

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  stage.insertBefore(canvas, h1);
  stage.classList.add('is-drawing');

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const style = getComputedStyle(h1);
  const fontSize = parseFloat(style.fontSize);
  const lines = ['Rethinking Human Creativity', 'in the Generative AI Era'];
  const width = stage.clientWidth;
  const lineH = fontSize * 1.08;
  const height = Math.ceil(lineH * lines.length + fontSize * 0.3);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');

  // Target: the title rendered once, offscreen.
  const off = document.createElement('canvas');
  off.width = canvas.width; off.height = canvas.height;
  const octx = off.getContext('2d');
  octx.scale(dpr, dpr);
  octx.fillStyle = '#000';
  octx.textBaseline = 'top';
  octx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
  // Shrink to fit narrow screens.
  const widest = Math.max(...lines.map((l) => octx.measureText(l).width));
  const k = Math.min(1, (width - 4) / widest);
  octx.font = `${style.fontWeight} ${fontSize * k}px ${style.fontFamily}`;
  lines.forEach((l, i) => octx.fillText(l, 0, i * lineH * k));
  const target = octx.getImageData(0, 0, off.width, off.height).data;

  const img = ctx.createImageData(off.width, off.height);
  const out = img.data;
  const ink = [21, 24, 29];
  const paper = [238, 240, 242];
  const steps = 50;
  let step = 0;

  function frame() {
    step++;
    const s = step / steps;            // 0 = noise, 1 = clean
    const keep = s * s;                 // ease toward the signal
    for (let i = 0; i < out.length; i += 4) {
      const sig = target[i + 3] / 255;
      const v = Math.min(1, Math.max(0, keep * sig + (1 - keep) * Math.random()));
      out[i] = paper[0] + (ink[0] - paper[0]) * v;
      out[i + 1] = paper[1] + (ink[1] - paper[1]) * v;
      out[i + 2] = paper[2] + (ink[2] - paper[2]) * v;
      out[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    stepLabel.textContent = `Step ${step} of ${steps}`;
    if (step < steps) requestAnimationFrame(() => setTimeout(frame, 40));
  }
  document.fonts && document.fonts.ready ? document.fonts.ready.then(frame) : frame();
})();
