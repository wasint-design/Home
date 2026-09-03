/* ========================================
   Shared Utilities
   ======================================== */

/* ── DOM Helpers ── */
function $(sel)  { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function byId(id) { return document.querySelector(`[data-id="${id}"]`); }
function bySection(name) { return document.querySelector(`[data-section="${name}"]`); }


/**
 * Drag-to-scroll with momentum + axis-lock.
 * Simulates native mobile scroll for desktop mouse.
 */
function makeDraggable(el, { vertical = false } = {}) {
  if (!el) return;

  let isDown = false, axis = null, startX, startY, scrollLeft, scrollTop;
  let velX = 0, velY = 0, lastX = 0, lastY = 0, lastT = 0, rafId = null;
  const AXIS_THRESHOLD = 5;

  el.style.cursor = 'grab';
  el.style.userSelect = 'none';

  function cancelMomentum() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function applyMomentum() {
    if (axis === 'x') {
      velX *= 0.92;
      el.scrollLeft += velX;
      if (Math.abs(velX) > 0.5) { rafId = requestAnimationFrame(applyMomentum); return; }
    } else if (axis === 'y') {
      velY *= 0.92;
      el.scrollTop += velY;
      if (Math.abs(velY) > 0.5) { rafId = requestAnimationFrame(applyMomentum); return; }
    }
    rafId = null;
  }

  el.addEventListener('mousedown', e => {
    if (e.target.closest('button, a, input, [role="button"]')) return;
    cancelMomentum();
    isDown = true; axis = null;
    el.style.cursor = 'grabbing';
    startX = e.pageX; startY = e.pageY;
    scrollLeft = el.scrollLeft; scrollTop = el.scrollTop;
    lastX = e.pageX; lastY = e.pageY;
    lastT = performance.now();
    velX = 0; velY = 0;
  });

  el.addEventListener('mousemove', e => {
    if (!isDown) return;
    const dx = e.pageX - startX;
    const dy = e.pageY - startY;
    if (!axis) {
      if (Math.abs(dx) > AXIS_THRESHOLD || Math.abs(dy) > AXIS_THRESHOLD)
        axis = (!vertical || Math.abs(dx) > Math.abs(dy)) ? 'x' : 'y';
      else return;
    }
    e.preventDefault();
    const now = performance.now(), dt = now - lastT || 1;
    if (axis === 'x') { velX = (lastX - e.pageX) / dt * 12; el.scrollLeft = scrollLeft - dx; }
    else              { velY = (lastY - e.pageY) / dt * 12; el.scrollTop  = scrollTop  - dy; }
    lastX = e.pageX; lastY = e.pageY; lastT = now;
  });

  const release = () => {
    if (!isDown) return;
    isDown = false;
    el.style.cursor = 'grab';
    if (axis !== null) {
      el.addEventListener('click', e => e.stopPropagation(), { capture: true, once: true });
    }
    rafId = requestAnimationFrame(applyMomentum);
  };

  el.addEventListener('mouseup',    release);
  el.addEventListener('mouseleave', release);
}

/**
 * Initialize all draggable containers on the page.
 * Call after DOM is ready.
 */
function initDraggables() {
  document.querySelectorAll('.h-scroll-row, [data-drag="horizontal"]').forEach(el => {
    makeDraggable(el);
  });
  document.querySelectorAll('.scroll-area, [data-drag="vertical"]').forEach(el => {
    makeDraggable(el, { vertical: true });
  });
}
