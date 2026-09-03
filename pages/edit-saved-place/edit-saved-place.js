/* ========================================
   Edit Saved Place — Logic
   ======================================== */

/* Use shared LABELS from SaveFavorite (single source of truth) */
const LABELS = (typeof SaveFavorite !== 'undefined') ? SaveFavorite.LABELS : [];

/* Demo data fallback */
const DEMO_PLACES = [
  { hpName: '33 Space (Back Entrance)', addressName: 'Home', label: 'home'   },
  { hpName: 'Siam Center',              addressName: 'Gym',  label: 'gym'    },
  { hpName: 'Bus stop at Kasetsart vehicle department (Vibhavadi Road)', addressName: 'Work', label: 'office' },
];

let editingEntry = null;
let editingIndex = -1;
let selectedLabel = 'bookmark';
let isNewMode = false;
let map = null;

/* =========================================================
   INIT
   ========================================================= */

function initEditPage() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');

  if (mode === 'new') {
    /* ── NEW MODE: save a new place ── */
    isNewMode = true;
    const hpName = params.get('hpName') || '';

    editingEntry = { hpName: hpName, addressName: '', label: 'bookmark' };
    editingIndex = -1;
    selectedLabel = 'bookmark';

    document.getElementById('editPillName').textContent = hpName;
    document.getElementById('editHpName').textContent = hpName;
    document.getElementById('editNameInput').value = '';

    /* Hide delete button in new mode */
    const deleteBtn = document.getElementById('editDeleteBtn');
    if (deleteBtn) deleteBtn.style.display = 'none';

  } else {
    /* ── EDIT MODE: edit existing entry ── */
    isNewMode = false;
    editingIndex = parseInt(params.get('index'), 10);

    let places = (typeof SaveFavorite !== 'undefined') ? SaveFavorite.getAll() : [];
    if (places.length === 0) places = DEMO_PLACES;

    editingEntry = places[editingIndex];
    if (!editingEntry) {
      history.back();
      return;
    }

    document.getElementById('editPillName').textContent = editingEntry.hpName;
    document.getElementById('editHpName').textContent = editingEntry.hpName;
    document.getElementById('editNameInput').value = editingEntry.addressName || '';
    selectedLabel = editingEntry.label || 'bookmark';
  }

  renderLabels();
  initMap();
}

/* =========================================================
   MAP (Leaflet)
   ========================================================= */

const MAP_CENTER = [13.7458, 100.5345];
const MAP_ZOOM = 15;

/* Hop-point locations (same as select-dropoff) */
const HP_PINS = [
  { label: 'A', lat: 13.7452, lng: 100.5348 },
  { label: 'B', lat: 13.7465, lng: 100.5325 },
  { label: 'C', lat: 13.7477, lng: 100.5360 },
  { label: 'D', lat: 13.7448, lng: 100.5378 },
  { label: 'E', lat: 13.7440, lng: 100.5308 },
];
const ORIGIN = { lat: 13.7463, lng: 100.5372 };

function initMap() {
  map = L.map('editMapLeaflet', {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    zoomControl: false,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map);

  /* User location: glow circle + blue dot */
  L.marker([ORIGIN.lat, ORIGIN.lng], {
    icon: L.divIcon({
      className: '',
      html: `<div style="position:relative;width:63px;height:63px;">
               <div style="position:absolute;inset:0;background:rgba(13,87,226,0.18);border-radius:50%;"></div>
               <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:16px;height:16px;background:#0D57E2;border:3px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.25);"></div>
             </div>`,
      iconSize: [63, 63],
      iconAnchor: [31.5, 31.5],
    }),
    interactive: false,
  }).addTo(map);

  /* Selected hop-point pin */
  L.marker(MAP_CENTER, {
    icon: L.divIcon({
      className: '',
      html: `<div style="width:25px;height:33px;">
               <img src="assets/icons/hop-point-map.svg" alt="" style="width:100%;height:100%;display:block;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.3));">
             </div>`,
      iconSize: [25, 33],
      iconAnchor: [12.5, 33],
    }),
    interactive: false,
  }).addTo(map);

  requestAnimationFrame(() => map.invalidateSize());
}

function recenterMap() {
  if (map) map.setView(MAP_CENTER, MAP_ZOOM, { animate: true });
}

/* =========================================================
   LABEL SELECTOR
   ========================================================= */

function renderLabels() {
  const row = document.getElementById('editLabelsRow');
  row.innerHTML = LABELS.map(l =>
    `<button class="edit-label-btn tappable${l.id === selectedLabel ? ' active' : ''}"
            data-label="${l.id}" onclick="selectLabel('${l.id}')">
      <img src="${l.icon}" alt="" width="18" height="18">
    </button>`
  ).join('');
}

function selectLabel(labelId) {
  selectedLabel = labelId;
  document.querySelectorAll('.edit-label-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.label === labelId);
  });
}

/* =========================================================
   SAVE / DELETE
   ========================================================= */

function saveEdit() {
  const nameInput = document.getElementById('editNameInput');
  const addressName = nameInput.value.trim() || editingEntry.hpName;

  if (typeof SaveFavorite !== 'undefined') {
    if (isNewMode) {
      /* NEW: add a new entry */
      const all = SaveFavorite.getAll();
      all.push({
        hpName: editingEntry.hpName,
        addressName: addressName,
        label: selectedLabel,
        savedAt: Date.now(),
      });
      localStorage.setItem('savedFavorites', JSON.stringify(all));
      /* Go to saved-places to see the new entry */
      window.location.href = 'saved-places.html';
      return;
    } else {
      /* EDIT: update existing entry */
      const all = SaveFavorite.getAll();
      if (all.length > 0 && all[editingIndex]) {
        all[editingIndex] = {
          ...all[editingIndex],
          addressName: addressName,
          label: selectedLabel,
          savedAt: Date.now(),
        };
        localStorage.setItem('savedFavorites', JSON.stringify(all));
      }
    }
  }

  history.back();
}

function deletePlace() {
  if (typeof SaveFavorite !== 'undefined') {
    const all = SaveFavorite.getAll();
    if (all.length > 0 && all[editingIndex]) {
      all.splice(editingIndex, 1);
      localStorage.setItem('savedFavorites', JSON.stringify(all));
    }
  }

  history.back();
}

/* =========================================================
   BOOT
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initEditPage();
  initDraggables();
});
