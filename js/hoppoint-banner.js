/**
 * ════════════════════════════════════════════════════════
 *  Hoppoint Banner — standalone script
 *  Add <script src="hoppoint-banner.js"></script> before </body>
 * ════════════════════════════════════════════════════════
 *
 *  QUICK USAGE:
 *  ─────────────────────────────────────────────────────
 *  HoppointBanner.setText('Use <b>"OFF15"</b> for discount');
 *  HoppointBanner.setMode('2');        // '1' | '2' | 'slide'
 *  HoppointBanner.setColor('#FF6B2C'); // banner background color
 *  HoppointBanner.setIcon('path/to/icon.png');
 *  HoppointBanner.play();              // replay slide-up animation
 * ════════════════════════════════════════════════════════
 */

const HoppointBanner = (() => {
  const wrap = document.getElementById('hpBannerWrap');
  const text = document.getElementById('hpBannerText');

  if (!wrap || !text) {
    console.warn('[HoppointBanner] Elements #hpBannerWrap / #hpBannerText not found.');
    return {};
  }

  // ── Slide-up animation ──
  function play() {
    wrap.classList.remove('visible');
    void wrap.offsetHeight; // force reflow
    setTimeout(() => wrap.classList.add('visible'), 300);
  }

  // ── Update text (supports HTML e.g. <b>) ──
  function setText(html) {
    text.innerHTML = html;
    if (wrap.classList.contains('mode-slide')) _updateSlideDuration();
  }

  // ── Display mode: '1' | '2' | 'slide' ──
  function setMode(mode) {
    wrap.classList.remove('mode-2', 'mode-slide');
    if (mode === '2')     wrap.classList.add('mode-2');
    if (mode === 'slide') { wrap.classList.add('mode-slide'); _updateSlideDuration(); }
    play();
  }

  // ── Background color ──
  function setColor(hex) {
    const banner = wrap.querySelector('.hp-banner');
    if (banner) banner.style.backgroundColor = hex;
  }

  // ── Icon image ──
  function setIcon(src) {
    const icon = wrap.querySelector('.hp-banner-icon');
    if (icon) icon.src = src;
  }

  // ── Background graphic (covers entire banner) ──
  function setGraphic(src) {
    const img = wrap.querySelector('.hp-banner-bg-graphic');
    const decorEls = wrap.querySelectorAll('.hp-ell-left, .hp-ell-right, .hp-sparkle');
    if (!img) return;
    if (src) {
      img.src = src;
      img.style.display = 'block';
      decorEls.forEach(el => el.style.display = 'none');
    } else {
      img.src = '';
      img.style.display = 'none';
      decorEls.forEach(el => el.style.display = '');
    }
  }

  // ── Scale font size (e.g. for accessibility or larger screens) ──
  function setScale(multiplier) {
    text.style.fontSize = multiplier === 1 ? '' : (14 * multiplier) + 'px';
  }

  // ── Internal: auto-calc ticker duration from text length ──
  function _updateSlideDuration() {
    const chars    = text.textContent.length || 10;
    const duration = Math.max(3, (chars * 8 + 20) / 60);
    wrap.style.setProperty('--hp-slide-duration', duration.toFixed(1) + 's');
  }

  // Boot: play on load
  play();

  return { play, setText, setMode, setColor, setIcon, setGraphic, setScale };
})();
