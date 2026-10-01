// Flip: picking either card turns both over and shows the follow-up line.
(function () {
  const pair = document.querySelector('[data-pair]');
  if (!pair) return;
  const buttons = [...pair.querySelectorAll('.flip')];
  const after = pair.querySelector('.pair__after');
  buttons.forEach((b) => b.addEventListener('click', () => {
    const revealed = !pair.classList.contains('is-revealed');
    pair.classList.toggle('is-revealed', revealed);
    buttons.forEach((x) => x.setAttribute('aria-pressed', String(revealed)));
    after.hidden = !revealed;
  }));
})();
