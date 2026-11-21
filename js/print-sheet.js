// The 4 x 6 in print sheet (front | back, folded to a 3 x 4 in card) for the Canon SELPHY:
// png(w) saves it at 1800 x 1200 (300 dpi); print(w) opens the print dialog on a 6 x 4 in page, no margins.
// needsCover(w) / prepare(id) make sure the card front has its picture (cover or PDF excerpt) first.
// Needs card-render.js, html-to-image, and (for prepare) admin-api.js + covers.js.
(function () {
  async function png(w) {
    const stage = document.createElement('div');
    stage.setAttribute('aria-hidden', 'true');
    stage.style.cssText = 'position:fixed;left:-10000px;top:0';
    stage.innerHTML = window.CardRender.sheet(w);
    document.body.appendChild(stage);
    try {
      await document.fonts.ready;
      await Promise.all([...stage.querySelectorAll('img')].map((i) => i.decode().catch(() => {})));
      window.CardRender.fitExcerpt(stage);
      return await window.htmlToImage.toBlob(stage.firstElementChild, { pixelRatio: 1, canvasWidth: 1800, canvasHeight: 1200, backgroundColor: '#fdfcf8' });
    } finally {
      stage.remove();
    }
  }

  async function print(w) {
    const url = URL.createObjectURL(await png(w));
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    const d = f.contentDocument;
    d.open();
    d.write(`<!doctype html><title>${window.CardRender.esc(w.title)}</title><style>@page{size:6in 4in;margin:0}html,body{margin:0}img{display:block;width:6in;height:4in}</style><img src="${url}">`);
    d.close();
    await d.querySelector('img').decode();
    f.contentWindow.focus();
    f.contentWindow.print();
    setTimeout(() => { f.remove(); URL.revokeObjectURL(url); }, 60000);
  }

  // Video and sound need a cover, a linked work its thumbnail, a PDF text work its opening lines
  const needsCover = (w) => !w.has_cover && w.file_ok
    && (w.link ? w.medium !== 'text'
      : (w.medium === 'video' || w.medium === 'sound') ? !!w.src
        : w.medium === 'text' && !!w.pdf && !w.excerpt);

  async function prepare(id) {
    const find = async () => (await window.AdminAPI.list()).find((x) => x.id === id);
    const w = await find();
    if (w && needsCover(w)) {
      try { if (await window.AdminAPI.makeCover(w)) return await find(); } catch (e) { console.error(e); }
    }
    return w;
  }

  window.PrintSheet = { png, print, needsCover, prepare };
})();
