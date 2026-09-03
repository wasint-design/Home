/* ========================================
   Saved Places — Logic & Console API
   ======================================== */

/* Map label id → small icon for list (designed for 10.8px in 24px container) */
const LABEL_ICONS = {
  bookmark: 'save-label-bookmark.svg',
  home:     'sp-icon-home.svg',
  office:   'sp-icon-work.svg',
  gym:      'sp-icon-gym.svg',
  train:    'save-label-train.svg',
  school:   'save-label-school.svg',
};

/* Fallback demo data (shown when localStorage is empty) */
const DEMO_PLACES = [
  { hpName: '33 Space (Back Entrance)', addressName: 'Home', label: 'home'   },
  { hpName: 'Siam Center',              addressName: 'Gym',  label: 'gym'    },
  { hpName: 'Bus stop at Kasetsart vehicle department (Vibhavadi Road)', addressName: 'Work', label: 'office' },
];

let currentPlaces = [];

function editSavedPlace(index) {
  window.location.href = 'edit-saved-place.html?index=' + index;
}

function renderSavedPlaces() {
  const list = document.getElementById('spList');
  if (!list) return;

  const userSaved = (typeof SaveFavorite !== 'undefined') ? SaveFavorite.getAll() : [];
  const places = [...DEMO_PLACES, ...userSaved];
  currentPlaces = places;

  list.innerHTML = places.map((p, i) => {
    const icon = LABEL_ICONS[p.label] || LABEL_ICONS.bookmark;
    const displayName = p.addressName || p.label || 'Saved';
    const placeName = p.hpName || '';
    return `
      <div class="sp-item" data-id="sp-${i}">
        <div class="sp-item-icon">
          <img src="assets/icons/${icon}" alt="">
        </div>
        <div class="sp-item-info">
          <span class="sp-item-label">${displayName}</span>
          <span class="sp-item-place">${placeName}</span>
        </div>
        <button class="sp-item-menu tappable" onclick="editSavedPlace(${i})">
          <img src="assets/icons/overflow-menu.svg" alt="" width="16" height="16">
        </button>
      </div>`;
  }).join('');
}

/* =========================================================
   CONSOLE API
   ========================================================= */

function listIds() {
  const ids = [];
  $$('[data-id]').forEach(el => {
    ids.push({ id: el.dataset.id, tag: el.tagName.toLowerCase(), text: el.textContent.trim().slice(0, 40) });
  });
  console.table(ids);
}

function printHelp() {
  console.log(`%c Muvmi Saved Places Console `, 'background:#0D57E2;color:#fff;font-size:14px;border-radius:6px;padding:4px 12px;font-weight:700;');
  console.log(`
%cDiscovery%c
  listIds()   List all data-id elements
  help()      Show this message
`,
    'color:#0D57E2;font-weight:700', ''
  );
}

window.consoleReset = function() {
  renderSavedPlaces();
};

document.addEventListener('DOMContentLoaded', () => {
  renderSavedPlaces();
  initDraggables();
  printHelp();
});

Object.assign(window, {
  listIds,
  help: printHelp,
});
