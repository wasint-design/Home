/* ─── Prototype Console ────────────────────────────────────────────────────────
   Shared across all pages. Each page sets window.CONSOLE_PAGE before including
   this script, then optionally overrides consoleReset() and runScenario().
   Comments are persisted in localStorage and shown from all pages in the panel.
──────────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const STORAGE_KEY = 'proto_comments';
  const COUNTER_KEY = 'proto_pin_counter';
  const PAGE_ID = window.CONSOLE_PAGE ||
    location.pathname.split('/').pop().replace('.html', '') || 'index';

  let commentMode = false;

  /* ── Inject CSS ──────────────────────────────────────────────────────────── */
  const css = document.createElement('style');
  css.textContent = `
    .hidden { display: none !important; }
    .comment-pin {
      position: fixed; z-index: 46;
      width: 22px; height: 22px;
      background: #FBBF24; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 800; color: #000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transform: translate(-50%, -50%);
      pointer-events: none;
      border: 2px solid #fff;
    }
    #c-fab {
      position: fixed; right: 4px; top: 4px;
      z-index: 50; background: #1A1A2E; color: white;
      border-radius: 8px; padding: 5px 8px;
      display: flex; flex-direction: row; align-items: center; gap: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      cursor: pointer; border: none; user-select: none; font-family: inherit;
    }
    #c-fab .c-label {
      font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
      color: rgba(255,255,255,0.8);
    }
    #c-panel {
      position: fixed; right: 0; top: 0; bottom: 0; width: 260px;
      z-index: 50; overflow-y: auto;
      border-left: 1px solid rgba(255,255,255,0.08);
      box-shadow: -4px 0 24px rgba(0,0,0,0.3);
    }
    @media (min-width: 600px) {
      #c-fab {
        right: 24px; bottom: 24px; top: auto; transform: none;
        border-radius: 999px; padding: 10px 16px; gap: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      }
      #c-fab .c-label {
        writing-mode: horizontal-tb; transform: none;
        font-size: 13px; color: white; letter-spacing: 0;
      }
      #c-panel {
        right: 24px; bottom: 68px; top: auto;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.08);
      }
    }
  `;
  document.head.appendChild(css);

  /* ── localStorage helpers ────────────────────────────────────────────────── */
  function getCounter()  { return parseInt(localStorage.getItem(COUNTER_KEY) || '1', 10); }
  function bumpCounter() { const n = getCounter(); localStorage.setItem(COUNTER_KEY, n + 1); return n; }
  function decCounter()  { const n = getCounter(); if (n > 1) localStorage.setItem(COUNTER_KEY, n - 1); }
  function loadAll()     { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
  function persist(arr)  { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }
  function esc(s)        { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* ── Toggle panel ────────────────────────────────────────────────────────── */
  window.toggleConsole = function () {
    const panel = document.getElementById('c-panel');
    const open  = panel.classList.toggle('hidden');   // hidden = closed
    if (!open) renderCommentsList();                  // opened → refresh list
  };

  /* ── Comment mode ────────────────────────────────────────────────────────── */
  window.toggleCommentMode = function () {
    commentMode = !commentMode;
    const overlay = document.getElementById('c-overlay');
    const btn     = document.getElementById('c-comment-btn');
    const label   = btn.querySelector('span');
    if (commentMode) {
      overlay.classList.remove('hidden');
      btn.style.background = 'rgba(251,191,36,0.25)';
      btn.style.color      = '#FCD34D';
      label.textContent    = 'คลิกบน screen เพื่อ pin';
    } else {
      overlay.classList.add('hidden');
      btn.style.background = '';
      btn.style.color      = '';
      label.textContent    = 'Pin a comment';
    }
  };

  /* ── Place pin ───────────────────────────────────────────────────────────── */
  window.handleCommentClick = function (e) {
    const id = bumpCounter();
    spawnPin(id, e.clientX, e.clientY);
    toggleCommentMode();
    showCommentInput(e.clientX, e.clientY, id);
  };

  function spawnPin(id, x, y) {
    const pin = document.createElement('div');
    pin.id = `pin-${id}`;
    pin.className = 'comment-pin';
    pin.style.left = x + 'px';
    pin.style.top  = y + 'px';
    pin.textContent = id;
    document.body.appendChild(pin);
  }

  /* ── Comment input popup ─────────────────────────────────────────────────── */
  window.showCommentInput = function (x, y, id) {
    document.getElementById('c-input-popup')?.remove();
    const el   = document.createElement('div');
    el.id      = 'c-input-popup';
    const left = Math.min(x + 14, window.innerWidth  - 242);
    const top  = Math.min(y + 14, window.innerHeight - 134);
    el.style.cssText = `position:fixed;left:${left}px;top:${top}px;z-index:54;width:228px;
      background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.18);
      padding:12px;border:1px solid #e5e7eb;`;
    el.innerHTML = `
      <textarea id="c-ta" placeholder="ใส่ comment..." rows="3"
        style="width:100%;font-size:13px;border:1px solid #e5e7eb;border-radius:8px;
               padding:8px 10px;outline:none;resize:none;font-family:inherit;box-sizing:border-box;"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button onclick="saveComment(${id})"
          style="flex:1;background:#0D57E2;color:#fff;border:none;border-radius:8px;
                 padding:7px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Save</button>
        <button onclick="cancelComment(${id})"
          style="flex:1;background:#f3f4f6;color:#555;border:none;border-radius:8px;
                 padding:7px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Cancel</button>
      </div>`;
    document.body.appendChild(el);
    setTimeout(() => el.querySelector('textarea').focus(), 30);
  };

  /* ── Save / Cancel / Delete ──────────────────────────────────────────────── */
  window.saveComment = function (id) {
    const text = document.getElementById('c-ta')?.value?.trim();
    if (!text) { cancelComment(id); return; }
    const pin = document.getElementById(`pin-${id}`);
    const all = loadAll();
    all.push({ id, page: PAGE_ID, text,
               x: parseFloat(pin?.style.left) || 0,
               y: parseFloat(pin?.style.top)  || 0 });
    persist(all);
    document.getElementById('c-input-popup')?.remove();
    renderCommentsList();
    document.getElementById('c-panel').classList.remove('hidden');
  };

  window.cancelComment = function (id) {
    document.getElementById('c-input-popup')?.remove();
    document.getElementById(`pin-${id}`)?.remove();
    decCounter();
  };

  window.deleteComment = function (id) {
    persist(loadAll().filter(c => c.id !== id));
    document.getElementById(`pin-${id}`)?.remove();
    renderCommentsList();
  };

  /* ── Render comments list (all pages) ────────────────────────────────────── */
  function renderCommentsList() {
    const list  = document.getElementById('c-comments-list');
    const badge = document.getElementById('c-comment-count');
    if (!list) return;
    const all = loadAll();
    if (all.length === 0) {
      list.innerHTML = '<div style="font-size:12px;color:rgba(255,255,255,0.3);text-align:center;padding:8px 0;">No comments yet</div>';
      if (badge) badge.classList.add('hidden');
      return;
    }
    if (badge) { badge.textContent = all.length; badge.classList.remove('hidden'); }
    list.innerHTML = all.map(c => `
      <div style="display:flex;align-items:flex-start;gap:7px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.07);">
        <span style="width:17px;height:17px;background:#FBBF24;border-radius:50%;display:flex;align-items:center;
                     justify-content:center;font-size:9px;font-weight:800;color:#000;flex-shrink:0;margin-top:2px;">${c.id}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;
                      letter-spacing:0.4px;margin-bottom:2px;">${esc(c.page)}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.75);line-height:1.4;word-break:break-word;">${esc(c.text)}</div>
        </div>
        <button onclick="deleteComment(${c.id})"
          style="background:none;border:none;color:rgba(255,255,255,0.25);cursor:pointer;
                 font-size:13px;padding:0;flex-shrink:0;line-height:1;">✕</button>
      </div>`).join('');
  }

  /* ── Load saved pins for this page on startup ────────────────────────────── */
  function loadPagePins() {
    loadAll().filter(c => c.page === PAGE_ID).forEach(c => spawnPin(c.id, c.x, c.y));
  }

  /* ── Defaults (pages override these inline after this script) ────────────── */
  window.consoleReset = window.consoleReset || function () {
    document.getElementById('c-panel').classList.add('hidden');
    location.reload();
  };
  window.runScenario = window.runScenario || function () {};

  /* ── Boot ────────────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPagePins);
  } else {
    loadPagePins();
  }

}());
