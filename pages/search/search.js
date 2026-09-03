/* ========================================
   Search — Logic & Console API
   ======================================== */

const PICKUP_PRESET = 'Emquatiers main entrance';

/* Preset pickup location data — treated as selectedPickup when unchanged */
const PRESET_PICKUP_DATA = {
  name: PICKUP_PRESET,
  lat:  13.7510,
  lng:  100.5408,
  label: 'A',
};
let activeField = 'destination'; // 'pickup' | 'destination'
let swapInProgress = false;

function selectResult(el) {
  const name = el.querySelector('.result-name').textContent.trim();

  if (activeField === 'pickup') {
    // User explicitly chose their own pickup → save it
    byId('pickupText').textContent = name;
    localStorage.setItem('selectedPickup', JSON.stringify({
      name,
      lat: PRESET_PICKUP_DATA.lat,
      lng: PRESET_PICKUP_DATA.lng,
      label: 'A',
    }));

    // If destination visible on screen → go forward immediately
    const destValue = document.getElementById('destinationInput')?.value.trim();
    if (destValue) {
      localStorage.setItem('selectedDestination', destValue);
      const pickupName = byId('pickupText')?.textContent.trim() || PICKUP_PRESET;
      AreaConfig.navigateToService(pickupName, destValue);
      return;
    }

    // No destination yet → switch to destination input
    cancelPickup();
    document.getElementById('destinationInput').focus();
  } else {
    // Direct hop-point selected — it IS the destination + drop-off point.
    // Skip select-dropoff.html entirely.
    const destInput = document.getElementById('destinationInput');
    destInput.value = name;
    if (name) localStorage.setItem('selectedDestination', name);
    sessionStorage.setItem('searchFocusField', activeField);

    const pickupEl = byId('pickupText');
    const isPreset = !pickupEl || pickupEl.textContent.trim() === PICKUP_PRESET;

    if (isPreset) {
      // Preset pickup: clear stale data → go confirm at select-pickup
      localStorage.removeItem('selectedPickup');
      window.location.href = 'select-pickup.html';
    } else {
      // Changed pickup: user already chose it → check route then go
      const pName = pickupEl.textContent.trim();
      AreaConfig.navigateToService(pName, name);
    }
  }
}

function swapPickupDest() {
  cancelPickup();          /* revert edit mode first (if active) */
  swapInProgress = true;   /* then block cancelPickup from re-firing during swap */

  const pickupTextEl = byId('pickupText');
  const destInput    = document.getElementById('destinationInput');
  const pickupIcon   = document.getElementById('pickupIcon');

  /* Read display values */
  const oldPickupName = pickupTextEl ? pickupTextEl.textContent.trim() : '';
  const oldDestName   = destInput ? destInput.value.trim() : '';

  /* Read localStorage */
  const oldPickupJson  = localStorage.getItem('selectedPickup');
  const oldDropoffJson = localStorage.getItem('selectedDropoff');
  const oldDestStr     = localStorage.getItem('selectedDestination');

  /* Swap display */
  const newPickupName = oldDestName || oldDestStr || '';
  const isPresetPickup = oldPickupName === PICKUP_PRESET && !oldPickupJson;
  if (pickupTextEl) pickupTextEl.textContent = newPickupName;
  if (destInput) destInput.value = oldPickupName;

  /* Swap localStorage — only if real user-chosen data exists
     C1 (preset + empty): display-only swap, no localStorage writes
     C2/C3: real data → swap localStorage */
  if (!isPresetPickup || newPickupName) {
    /* old pickup → new destination/dropoff */
    localStorage.setItem('selectedDestination', oldPickupName);
    if (oldPickupJson) {
      localStorage.setItem('selectedDropoff', oldPickupJson);
    } else {
      localStorage.removeItem('selectedDropoff');
    }

    /* old destination → new pickup */
    if (oldDropoffJson) {
      localStorage.setItem('selectedPickup', oldDropoffJson);
    } else if (newPickupName) {
      localStorage.setItem('selectedPickup', JSON.stringify({
        name: newPickupName, lat: PRESET_PICKUP_DATA.lat, lng: PRESET_PICKUP_DATA.lng, label: 'A',
      }));
    } else {
      localStorage.removeItem('selectedPickup');
    }
  }

  /* Update pickup icon */
  if (pickupIcon) {
    pickupIcon.style.display = (newPickupName === PICKUP_PRESET) ? '' : 'none';
  }

  /* Update sections based on new dest input */
  if (destInput) {
    const hasText = destInput.value.trim().length > 0;
    if (hasText) { hide('recent'); hide('nearby'); show('searchResults'); }
    else         { show('recent'); show('nearby'); hide('searchResults'); }
  }

  /* If swap returned to initial state (preset + empty), clean up stale localStorage */
  if (newPickupName === PICKUP_PRESET && !destInput.value.trim()) {
    localStorage.removeItem('selectedPickup');
    localStorage.removeItem('selectedDestination');
    localStorage.removeItem('selectedDropoff');
  }

  log('Swapped pickup ↔ destination');

  /* Release flag after browser settles — prevents cancelPickup from reverting */
  setTimeout(() => { swapInProgress = false; }, 100);

  /* If new pickup is empty → manually set edit mode (inline, no activatePickup dependency) */
  if (!newPickupName) {
    activeField = 'pickup';
    if (pickupTextEl) pickupTextEl.style.display = 'none';
    if (pickupIcon) pickupIcon.style.display = 'none';
    const pi = document.getElementById('pickupInput');
    if (pi) {
      pi.value = '';
      pi.style.display = '';
      setTimeout(() => pi.focus(), 150);  /* delay focus to after browser settles */
    }
  }
}

function activatePickup() {
  const pickupInput = document.getElementById('pickupInput');
  const pickupText  = byId('pickupText');
  const pickupIcon  = document.getElementById('pickupIcon');
  if (!pickupInput || pickupInput.style.display !== 'none') return;

  activeField = 'pickup';

  // Switch pickup to edit mode
  pickupText.style.display = 'none';
  if (pickupIcon) pickupIcon.style.display = 'none';
  pickupInput.style.display = '';
  pickupInput.focus();

  // Restore sections (pickup starts empty → show recent+nearby)
  const destVal = document.getElementById('destinationInput').value.trim();
  if (destVal.length === 0) {
    show('recent');
    show('nearby');
    hide('searchResults');
  }
}

function cancelPickup() {
  if (swapInProgress) return;  /* don't revert during swap */
  const pickupInput = document.getElementById('pickupInput');
  const pickupText  = byId('pickupText');
  const pickupIcon  = document.getElementById('pickupIcon');
  if (!pickupInput || pickupInput.style.display === 'none') return;

  // Revert to display mode
  pickupInput.value = '';
  pickupInput.style.display = 'none';
  pickupText.style.display = '';
  // Icon only visible when showing the preset point
  if (pickupIcon) {
    pickupIcon.style.display = pickupText.textContent.trim() === PICKUP_PRESET ? '' : 'none';
  }
}

/* Navigate after a Place destination is selected.
   - Preset pickup   → clear stale selectedPickup, go to select-dropoff → select-pickup to confirm
   - Changed pickup  → selectedPickup already set, go to select-dropoff → service-selection
*/
function navigateToDropoff(el) {
  const destName = el
    ? el.querySelector('.result-name')?.textContent.trim()
    : document.getElementById('destinationInput').value.trim();
  if (destName) localStorage.setItem('selectedDestination', destName);

  sessionStorage.setItem('searchFocusField', activeField);

  const pickupEl = byId('pickupText');
  const isPreset = !pickupEl || pickupEl.textContent.trim() === PICKUP_PRESET;

  if (isPreset) {
    // Clear any stale selectedPickup — select-pickup will set it fresh after confirmation
    localStorage.removeItem('selectedPickup');
  }

  window.location.href = 'select-dropoff.html';
}

/* Restore focus when coming back via history.back() (bfcache restore) */
window.addEventListener('pageshow', e => {
  if (!e.persisted) return;
  const field = sessionStorage.getItem('searchFocusField');
  if (field === 'pickup') {
    activatePickup();
  } else {
    const destInput = document.getElementById('destinationInput');
    if (destInput) { activeField = 'destination'; destInput.focus(); }
  }
  sessionStorage.removeItem('searchFocusField');
});

document.addEventListener('DOMContentLoaded', () => {
  initDraggables();
  printHelp();

  const destInput   = document.getElementById('destinationInput');
  const pickupInput = document.getElementById('pickupInput');

  /* Check if we should focus pickup (e.g. coming from select-pickup search pill) */
  const focusField = sessionStorage.getItem('searchFocusField');
  if (focusField === 'pickup') {
    sessionStorage.removeItem('searchFocusField');
    /* Restore previously-selected destination so it doesn't disappear */
    const savedDest = localStorage.getItem('selectedDestination');
    if (savedDest && destInput) destInput.value = savedDest;
    /* Small delay so DOM is ready before switching to edit mode */
    requestAnimationFrame(() => activatePickup());
  } else if (destInput) {
    destInput.focus();
  }

  // ── Destination input ──────────────────────────────────────
  if (destInput) {

    // Tapping destination cancels any active pickup search
    destInput.addEventListener('focus', () => {
      activeField = 'destination';
      cancelPickup();
    });

    destInput.addEventListener('input', () => {
      const hasText = destInput.value.trim().length > 0;
      if (hasText) {
        hide('recent');
        hide('nearby');
        show('searchResults');
      } else {
        show('recent');
        show('nearby');
        hide('searchResults');
      }
    });
  }

  // ── Pickup input ───────────────────────────────────────────
  if (pickupInput) {
    pickupInput.addEventListener('input', () => {
      const hasText = pickupInput.value.trim().length > 0;
      if (hasText) {
        hide('recent');
        hide('nearby');
        show('searchResults');
      } else {
        show('recent');
        show('nearby');
        hide('searchResults');
      }
    });

    // Stop click inside input from bubbling to the wrapper div's activatePickup()
    pickupInput.addEventListener('click', e => e.stopPropagation());
  }

  // ── Result item selection (event delegation) ───────────────
  document.querySelectorAll('.search-results').forEach(container => {
    container.addEventListener('click', e => {
      const item = e.target.closest('.search-result-item:not(.search-result-item--place)');
      if (!item || !container.contains(item)) return;
      selectResult(item);
    });
  });
});

/* =========================================================
   CONSOLE API
   ========================================================= */

const LOG_STYLE = 'background:#0D57E2;color:#fff;border-radius:4px;padding:2px 8px;font-weight:600;';
function log(msg) { console.log(`%c ${msg} `, LOG_STYLE); }

function show(sectionName) {
  const el = bySection(sectionName);
  if (!el) { console.warn(`Section "${sectionName}" not found.`); return; }
  el.style.display = '';
  log(`Shown: ${sectionName}`);
}

function hide(sectionName) {
  const el = bySection(sectionName);
  if (!el) { console.warn(`Section "${sectionName}" not found.`); return; }
  el.style.display = 'none';
  log(`Hidden: ${sectionName}`);
}

function toggle(sectionName) {
  const el = bySection(sectionName);
  if (!el) return;
  el.style.display === 'none' ? show(sectionName) : hide(sectionName);
}

function listIds() {
  const ids = [];
  $$('[data-id]').forEach(el => {
    ids.push({ id: el.dataset.id, tag: el.tagName.toLowerCase(), text: el.textContent.trim().slice(0, 40) });
  });
  console.table(ids);
}

function listSections() {
  const sections = [];
  $$('[data-section]').forEach(el => {
    sections.push({ section: el.dataset.section, visible: el.style.display !== 'none', tag: el.tagName.toLowerCase() });
  });
  console.table(sections);
}

function printHelp() {
  console.log(`%c Muvmi Search Console `, 'background:#0D57E2;color:#fff;font-size:14px;border-radius:6px;padding:4px 12px;font-weight:700;');
  console.log(`
%cSections%c
  show(section)     Show a section
  hide(section)     Hide a section
  toggle(section)   Toggle visibility

%cPlace results%c
  togglePlaceHoppoints(id)   Expand/collapse child hop-points for a place

%cDiscovery%c
  listIds()         List all data-id elements
  listSections()    List all sections
  help()            Show this message
`,
    'color:#0D57E2;font-weight:700', '',
    'color:#0D57E2;font-weight:700', '',
    'color:#0D57E2;font-weight:700', ''
  );
}

/* =========================================================
   PLACE RESULT — EXPAND / COLLAPSE
   ========================================================= */

/**
 * Toggle child hop-points for a place result group.
 * @param {string} groupId  — the suffix used in data-id attributes (e.g. 'siamParagon')
 */
function togglePlaceHoppoints(groupId) {
  const hoppoints = byId(`placeHoppoints-${groupId}`);
  const btn       = byId(`viewMoreBtn-${groupId}`);
  if (!hoppoints) return;

  // Expand and hide the button permanently (until page reload)
  hoppoints.classList.add('expanded');
  if (btn) btn.style.display = 'none';
  log(`Expanded: ${groupId}`);
}

/* =========================================================
   SCENARIOS
   ========================================================= */

/**
 * Scenario 0: Default search state — recent + nearby visible, searchResults hidden
 * Scenario 1: Place results state — searchResults visible, recent + nearby hidden
 */
function runScenario(n) {
  // Reset all place expansions + restore view-more buttons
  document.querySelectorAll('.place-hoppoints.expanded').forEach(el => {
    el.classList.remove('expanded');
  });
  document.querySelectorAll('.view-more-btn').forEach(el => {
    el.style.display = '';
  });

  const destInput = document.getElementById('destinationInput');

  // Always cancel pickup mode on scenario switch
  cancelPickup();

  if (n === 0) {
    // Default: recent + nearby visible
    show('recent');
    show('nearby');
    hide('searchResults');
    if (destInput) { destInput.value = ''; destInput.focus(); }
    log('Scenario: Default (Recent + Nearby)');

  } else if (n === 1) {
    // Place results: typing "Siam"
    hide('recent');
    hide('nearby');
    show('searchResults');
    if (destInput) { destInput.value = 'Siam'; destInput.focus(); }
    log('Scenario: Place results (Siam Paragon)');
  }
}

window.consoleReset = function() {
  localStorage.clear();
  sessionStorage.clear();
  runScenario(0);
  document.getElementById('c-panel').classList.add('hidden');
};

window.runScenario = runScenario;

Object.assign(window, {
  show, hide, toggle,
  listIds, listSections,
  togglePlaceHoppoints,
  swapPickupDest, activatePickup, cancelPickup, selectResult,
  navigateToDropoff,
  help: printHelp
});
