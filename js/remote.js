/* ========================================
   Remote Control — Firebase Realtime DB
   Facilitator can send commands to user's
   prototype session in real-time.
   ======================================== */

const Remote = (function () {
  /* Firebase config — fill in from Firebase Console */
  const FIREBASE_CONFIG = {
    apiKey:            'AIzaSyAXPQjSQ0oFxgFqcfk6J5y6yfrfUS5b754',
    authDomain:        'home-test-remote.firebaseapp.com',
    databaseURL:       'https://home-test-remote-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId:         'home-test-remote',
    storageBucket:     'home-test-remote.firebasestorage.app',
    messagingSenderId: '850823192093',
    appId:             '1:850823192093:web:afbfbc25fcf9104f95f0f4',
  };

  let db = null;
  let sessionId = null;
  let listening = false;

  /* Get or create session ID from URL param */
  function getSessionId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('session') || 'default';
  }

  /* Initialize Firebase + start listening */
  function init() {
    if (!FIREBASE_CONFIG.apiKey) return; /* not configured yet */
    if (listening) return;

    sessionId = getSessionId();

    /* Init Firebase (compat SDK loaded via CDN) */
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    db = firebase.database();

    /* Listen for commands */
    const cmdRef = db.ref(`sessions/${sessionId}/command`);
    cmdRef.on('value', snap => {
      const cmd = snap.val();
      if (!cmd || !cmd.action) return;
      execute(cmd);
      /* Clear after execution so same command can be sent again */
      cmdRef.remove();
    });

    listening = true;
    console.log(`%c Remote `, 'background:#10B981;color:#fff;border-radius:4px;padding:2px 8px;font-weight:600;',
      `Listening on session: ${sessionId}`);
  }

  /* Execute a received command */
  function execute(cmd) {
    console.log(`%c Remote `, 'background:#10B981;color:#fff;border-radius:4px;padding:2px 8px;font-weight:600;',
      `${cmd.action}`, cmd.params || '');

    switch (cmd.action) {
      case 'navigate':
        window.location.href = cmd.params[0];
        break;
      case 'reload':
        window.location.reload();
        break;
      case 'reset':
        if (typeof window.consoleReset === 'function') window.consoleReset();
        else { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }
        break;
      case 'runScenario':
        if (typeof window.runScenario === 'function') window.runScenario(cmd.params[0]);
        break;
      case 'eval':
        /* Run arbitrary JS — for advanced console commands */
        try { new Function(cmd.params[0])(); } catch (e) { console.warn('Remote eval error:', e); }
        break;
      default:
        /* Try calling as a window function: e.g. action="selectHoppoint", params=[3] */
        if (typeof window[cmd.action] === 'function') {
          window[cmd.action](...(cmd.params || []));
        }
    }
  }

  /* Send a command (used by controller page) */
  function send(action, params) {
    if (!db || !sessionId) return;
    db.ref(`sessions/${sessionId}/command`).set({
      action,
      params: params || [],
      t: Date.now(),
    });
  }

  /* Report current page (so controller knows where user is) */
  function reportPage() {
    if (!db || !sessionId) return;
    db.ref(`sessions/${sessionId}/state`).update({
      page: window.location.pathname.split('/').pop() || 'index.html',
      variation: localStorage.getItem('homepage-variation') || '',
      t: Date.now(),
    });
  }

  return { init, send, getSessionId, reportPage, FIREBASE_CONFIG };
})();

/* Auto-init when loaded on prototype pages (not controller) */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('remoteController')) {
    Remote.init();
    Remote.reportPage();
  }
});
