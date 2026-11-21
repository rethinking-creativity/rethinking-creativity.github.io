// About: a YouTube poster that loads the player only when clicked (youtube-nocookie, no cookies until then).
// YouTube refuses embeds without a Referer (Error 153), which a page opened from disk never sends,
// so a local copy opens the video on YouTube instead.
document.querySelectorAll('.yt[data-yt]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (location.protocol === 'file:') {
      window.open(`https://www.youtube.com/watch?v=${btn.dataset.yt}`, '_blank', 'noopener');
      return;
    }
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0`;
    f.title = btn.dataset.title || 'Video';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    btn.replaceWith(f);
    f.focus();
  });
});
