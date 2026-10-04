/* ting.directory text site — minimal progressive enhancement.
   Core reading works with this file absent or blocked:
   - "Hide images" is injected only when JS runs (no dead control without JS).
   - Videos remain reachable via their plain external link without JS; this adds
     an optional in-page click-to-load player. No third-party player loads until
     the visitor asks for it. Nothing here loads the 3D scene or Three.js. */
(function () {
  'use strict';

  /* ---- Hide images toggle (persisted locally) ---- */
  var KEY = 'ting-text-hide-images';
  var root = document.documentElement;

  function isHidden() {
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function setHidden(v) {
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {}
  }

  var mounts = document.querySelectorAll('[data-image-toggle]');
  Array.prototype.forEach.call(mounts, function (mount) {
    var btn = document.createElement('button');
    btn.type = 'button';
    function sync() {
      var hidden = root.classList.contains('no-images');
      btn.textContent = hidden ? 'Show images' : 'Hide images';
      btn.setAttribute('aria-pressed', hidden ? 'true' : 'false');
    }
    btn.addEventListener('click', function () {
      var hidden = root.classList.toggle('no-images');
      setHidden(hidden);
      sync();
    });
    sync();
    mount.appendChild(btn);
  });

  /* ---- Click-to-load embeds ---- */
  var players = document.querySelectorAll('[data-embed]');
  Array.prototype.forEach.call(players, function (poster) {
    poster.addEventListener('click', function (e) {
      e.preventDefault();
      var src = poster.getAttribute('data-embed');
      if (!src) return;
      var frame = document.createElement('div');
      frame.className = 'frame';
      var iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.setAttribute('allow',
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('title', poster.getAttribute('data-title') || 'Video player');
      frame.appendChild(iframe);
      poster.parentNode.replaceChild(frame, poster);
    });
  });
})();
