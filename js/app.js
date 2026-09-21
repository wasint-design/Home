/* ========================================
   App Init — Shared bootstrap for all pages
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initStatusBar();
  applyUrlScenario();
});

/* Read ?scenario=N from URL and call the page's runScenario() if available */
function applyUrlScenario() {
  const param = new URLSearchParams(window.location.search).get('scenario');
  if (param && typeof window.runScenario === 'function') {
    window.runScenario(Number(param));
  }
}

function initStatusBar() {
  const timeEl = document.querySelector('.status-bar-time');
  if (timeEl) {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    timeEl.textContent = `${h}:${m}`;
  }
}
