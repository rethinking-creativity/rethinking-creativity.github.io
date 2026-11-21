// On-site entry at the meet-up: the submit page opened from the organizer page (admin.html, same tab),
// so this tab holds the organizer password. Entries then skip Turnstile, and the
// thank-you screen offers "Print card" (SELPHY, 4 x 6 in) and "Enter another".
// For everyone else this file does nothing.
(function () {
  const key = sessionStorage.getItem('rc-admin-key');
  if (!key) return;
  window.RC_ORGANIZER_KEY = key; // read by submit-api.js

  const head = document.querySelector('.submit__head');
  if (head) head.insertAdjacentHTML('afterbegin', '<p class="onsite-note">Organizer mode: entries are ready to print · <a href="admin.html">Submissions</a></p>');

  // The print tools load only here, one after another (each needs the one before)
  const libs = ['js/vendor/qrcode.js', 'js/vendor/html-to-image.js', 'js/card-render.js', 'js/covers.js', 'js/admin-api.js', 'js/print-sheet.js'];
  const ready = libs.reduce((p, src) => p.then(() => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  })), Promise.resolve());

  document.addEventListener('rc:submitted', (e) => {
    const done = document.getElementById('done');
    done.querySelector('p').outerHTML = '<p class="onsite-actions"><button class="contribute__button" type="button" id="printCard">Print card</button> <a href="submit.html">Enter another</a></p><p class="onsite-status" id="printStatus" role="status"></p>';
    const btn = document.getElementById('printCard');
    const status = document.getElementById('printStatus');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      status.textContent = 'Preparing the card…';
      try {
        await ready;
        const w = await window.PrintSheet.prepare(e.detail.id);
        if (!w) throw new Error('not found');
        await window.PrintSheet.print(w);
        status.textContent = '';
      } catch (err) {
        console.error(err);
        status.textContent = 'Could not prepare the card. Print it from the Submissions page.';
      }
      btn.disabled = false;
    });
  });
})();
