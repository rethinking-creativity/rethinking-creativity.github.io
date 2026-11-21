// Card-front pictures made in the browser from an uploaded file:
// a video's frame (JPEG) and a sound's radial waveform (SVG, the style of assets/examples/sound_radial.svg);
// for a PDF text work, its opening lines (pdf.js), since the text card front shows the first two lines.
(function () {
  // A frame a little into the video (10%, at most 1 s), skipping the black first frame most clips start with
  function videoFrame(url) {
    return new Promise((resolve, reject) => {
      const v = document.createElement('video');
      v.crossOrigin = 'anonymous';
      v.muted = true;
      v.preload = 'auto';
      v.playsInline = true;
      v.onerror = () => reject(new Error('video'));
      v.onloadedmetadata = () => { v.currentTime = Math.min(1, (v.duration || 1) * 0.1); };
      v.onseeked = () => {
        const k = Math.min(1, 1280 / v.videoWidth);
        const c = document.createElement('canvas');
        c.width = Math.round(v.videoWidth * k);
        c.height = Math.round(v.videoHeight * k);
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error('frame'))), 'image/jpeg', 0.9);
      };
      v.src = url;
    });
  }

  // 120 bars around a ring; each bar's length follows the loudness (RMS) of its slice of the sound
  async function waveform(url) {
    const buf = await (await fetch(url)).arrayBuffer();
    const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 1, 44100);
    const audio = await ctx.decodeAudioData(buf);
    const ch = [...Array(audio.numberOfChannels).keys()].map((i) => audio.getChannelData(i));
    const N = 120;
    const step = Math.max(1, Math.floor(audio.length / N));
    const rms = [];
    for (let b = 0; b < N; b++) {
      let sum = 0;
      for (let i = b * step; i < Math.min(audio.length, (b + 1) * step); i++) {
        let s = 0;
        for (const c of ch) s += c[i];
        s /= ch.length;
        sum += s * s;
      }
      rms.push(Math.sqrt(sum / step));
    }
    const max = Math.max(...rms) || 1;
    const lines = rms.map((r, i) => {
      const a = (i / N) * 2 * Math.PI;
      const len = 6 + 56 * Math.pow(r / max, 0.8);
      const p = (rad) => [(100 + rad * Math.sin(a)).toFixed(1), (100 - rad * Math.cos(a)).toFixed(1)];
      const [x1, y1] = p(34);
      const [x2, y2] = p(34 + len);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g stroke="#211a33" stroke-width="2.4" stroke-linecap="round">${lines}</g><circle cx="100" cy="100" r="26" fill="#efefed"/><circle cx="100" cy="100" r="4" fill="#211a33"/></svg>`;
    return new Blob([svg], { type: 'image/svg+xml' });
  }

  async function pdfExcerpt(url) {
    const pdfjs = await import(new URL('js/vendor/pdf.min.mjs', document.baseURI).href);
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('js/vendor/pdf.worker.min.mjs', document.baseURI).href;
    const doc = await pdfjs.getDocument(url).promise;
    const page = await doc.getPage(1);
    const { items } = await page.getTextContent();
    let text = '';
    items.forEach((it) => { text += it.str + (it.hasEOL ? '\n' : ''); });
    return text.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 2).join('\n').slice(0, 300);
  }

  window.Covers = { videoFrame, waveform, pdfExcerpt };
})();
