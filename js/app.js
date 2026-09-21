/* ========================================
   App Init — Shared bootstrap for all pages
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initStatusBar();
});

function initStatusBar() {
  const timeEl = document.querySelector('.status-bar-time');
  if (timeEl) {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    timeEl.textContent = `${h}:${m}`;
  }
}
