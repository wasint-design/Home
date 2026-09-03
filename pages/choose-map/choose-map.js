/* ========================================
   Choose on Map — Logic & Console API
   ======================================== */

const MAP_CENTER = [13.7510, 100.5400];
const MAP_ZOOM   = 14;

/* Hop-points on the map — scattered around Sukhumvit area */
const HOP_POINTS = [
  { id: 1, label: 'A', lat: 13.7502, lng: 100.5395, name: 'Sukhumvit Soi 22 · Hop-point',  dist: '0.8 km', category: 'restaurant' },
  { id: 2, label: 'B', lat: 13.7530, lng: 100.5420, name: 'Siam Paragon',                   dist: '1.2 km', category: 'mall' },
  { id: 3, label: 'C', lat: 13.7545, lng: 100.5380, name: 'Asok Station · Hop-point',       dist: '0.5 km', category: 'activity' },
  { id: 4, label: 'D', lat: 13.7490, lng: 100.5440, name: 'The Coffee Club · Hop-point',    dist: '0.9 km', category: 'cafe' },
  { id: 5, label: 'E', lat: 13.7560, lng: 100.5410, name: 'Lumpini Park · Hop-point',       dist: '2.5 km', category: 'park' },
  { id: 6, label: 'F', lat: 13.7520, lng: 100.5350, name: 'Bangkok Art Museum',              dist: '1.8 km', category: 'museum' },
];

const PICKUP_PRESET = 'Emquatiers main entrance';

let map = null;
const leafletMarkers = {};
let selectedDropoff = null; // HOP_POINTS entry or null
let activeCategory = null;  // null = show all

/* Label markers + route line for pickup/dropoff */
let pickupLabelMarker  = null;
let dropoffLabelMarker = null;
let routeLine = null;

/* Pickup data — default preset location */
const PICKUP_DATA = { lat: 13.7510, lng: 100.5408, name: PICKUP_PRESET, label: 'A' };

function updatePickupIcon(isPreset) {
  const icon = document.querySelector('.cm-field-icon');
  if (icon) icon.style.display = isPreset ? '' : 'none';
}

/* =========================================================
   MAP INIT
   ========================================================= */

function initMap() {
  map = L.map('mapLeaflet', {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    zoomControl: false,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map);

  /* User location dot */
  L.circleMarker([13.7510, 100.5408], {
    radius: 8,
    fillColor: '#0D57E2',
    fillOpacity: 1,
    color: 'white',
    weight: 3,
    interactive: false,
  }).addTo(map);

  /* Add hop-point markers */
  HOP_POINTS.forEach(hp => {
    const marker = L.marker([hp.lat, hp.lng], {
      icon: createHpIcon(hp.label),
    });
    marker.on('click', () => openHpDialog(hp));
    marker.addTo(map);
    leafletMarkers[hp.id] = marker;
  });

  updateLabelMarkers();
  requestAnimationFrame(() => map.invalidateSize());
}

function createHpIcon(label) {
  const html = `
    <div class="cm-pin">
      <img src="assets/icons/hop-point-map.svg" alt="" width="14" height="19">
    </div>`;
  return L.divIcon({
    className: '',
    html,
    iconSize: [14, 19],
    iconAnchor: [7, 19],
  });
}

/* =========================================================
   SELECT DROPOFF
   ========================================================= */

function selectDropoff(hp) {
  selectedDropoff = hp;

  const textEl = document.getElementById('cmDropoffText');
  const fieldEl = textEl.closest('.cm-field');
  textEl.textContent = hp.name;
  fieldEl.classList.remove('cm-field--placeholder');
  fieldEl.classList.add('cm-field--selected');

  /* Show clear button */
  document.getElementById('cmDropoffClear').classList.remove('hidden');

  /* Enable Next button */
  document.getElementById('cmNextBtn').disabled = false;

  /* Update label markers on map */
  updateLabelMarkers();

  log(`Dropoff → ${hp.name}`);
}

function clearField(field) {
  if (field === 'pickup') {
    document.getElementById('cmPickupText').textContent = PICKUP_PRESET;
    document.getElementById('cmPickupClear').classList.add('hidden');
    updatePickupIcon(true);
    localStorage.removeItem('selectedPickup');
    PICKUP_DATA.name = PICKUP_PRESET;
    PICKUP_DATA.lat  = 13.7510;
    PICKUP_DATA.lng  = 100.5408;
  } else {
    const textEl  = document.getElementById('cmDropoffText');
    const fieldEl = textEl.closest('.cm-field');
    textEl.textContent = 'Drop-off';
    fieldEl.classList.remove('cm-field--selected');
    fieldEl.classList.add('cm-field--placeholder');
    document.getElementById('cmDropoffClear').classList.add('hidden');
    selectedDropoff = null;
    document.getElementById('cmNextBtn').disabled = true;
    localStorage.removeItem('selectedDestination');
  }

  updateLabelMarkers();
  log(`Cleared ${field}`);
}

/* =========================================================
   LABEL PINS ON MAP (pickup / dropoff indicators)
   ========================================================= */

function createLabelPinIcon(badgeText, type) {
  const isPickup   = type === 'pickup';
  const badgeClass = isPickup ? 'pickup-badge' : 'dropoff-badge';
  const pinSrc     = isPickup
    ? 'assets/icons/map-pin-hop-pickup.svg'
    : 'assets/icons/map-pin-hop-dropoff.svg';

  const pinW = 20, pinH = 26.667;
  const totalH = 19 + 4 + pinH;

  const html = `
    <div class="map-hp-label-pin">
      <div class="map-hp-label-badge ${badgeClass}">${badgeText}</div>
      <img src="${pinSrc}" alt="" style="width:${pinW}px;height:${pinH}px;display:block;">
    </div>`;

  return L.divIcon({
    className: '',
    html,
    iconSize:   [60, totalH],
    iconAnchor: [30, totalH],
  });
}

function updateLabelMarkers() {
  /* Remove old markers + line */
  if (pickupLabelMarker)  { map.removeLayer(pickupLabelMarker);  pickupLabelMarker = null; }
  if (dropoffLabelMarker) { map.removeLayer(dropoffLabelMarker); dropoffLabelMarker = null; }
  if (routeLine)          { map.removeLayer(routeLine);          routeLine = null; }

  /* Pickup label — always show (preset location) */
  pickupLabelMarker = L.marker([PICKUP_DATA.lat, PICKUP_DATA.lng], {
    icon: createLabelPinIcon('Pick up', 'pickup'),
    interactive: false,
  }).addTo(map);

  /* Dropoff label — only if selected */
  if (selectedDropoff && selectedDropoff.lat) {
    dropoffLabelMarker = L.marker([selectedDropoff.lat, selectedDropoff.lng], {
      icon: createLabelPinIcon('Drop off', 'dropoff'),
      interactive: false,
    }).addTo(map);

    /* Dashed route line */
    routeLine = L.polyline(
      [[PICKUP_DATA.lat, PICKUP_DATA.lng], [selectedDropoff.lat, selectedDropoff.lng]],
      { color: '#0D57E2', weight: 2, dashArray: '5 4', lineCap: 'round' }
    ).addTo(map);
  }
}

/* =========================================================
   HOP-POINT DIALOG
   ========================================================= */

let dialogHp = null; // currently shown hop-point

function openHpDialog(hp) {
  dialogHp = hp;

  document.getElementById('hpInfoPinLetter').textContent = hp.label;
  document.getElementById('hpInfoName').textContent      = hp.name;
  document.getElementById('hpInfoType').textContent      = 'Hop-point';
  document.getElementById('hpInfoDesc').textContent      = 'Drop-off point near this location.';
  document.getElementById('hpInfoDist').textContent      = hp.dist + ' from you';

  /* Photos */
  const track = document.getElementById('hpPhotosTrack');
  track.innerHTML = `
    <div class="hp-photo-item">
      <img src="assets/images/hoppoint-photo.png" alt="" draggable="false">
      <span class="hp-meet-badge">Drop-off here</span>
    </div>`;

  /* Update save button state */
  const saveBtn = document.getElementById('hpSaveBtn');
  if (saveBtn) { saveBtn.dataset.hpName = hp.name; SaveFavorite.updateButton(hp.name); }

  const dialog = document.getElementById('hpInfoDialog');
  dialog.classList.remove('hidden');
  dialog.classList.add('visible');

  if (typeof HoppointBanner !== 'undefined') HoppointBanner.play();
  initDraggables();

  log(`Dialog → ${hp.name}`);
}

function closeHpDialog() {
  const dialog = document.getElementById('hpInfoDialog');
  dialog.classList.remove('visible');
  dialog.classList.add('hidden');
  dialogHp = null;
}

function chooseHpAsDropoff() {
  if (!dialogHp) return;
  selectDropoff(dialogHp);
  closeHpDialog();
}

/* =========================================================
   CATEGORY FILTER
   ========================================================= */

function filterCategory(cat) {
  if (activeCategory === cat) {
    /* Toggle off */
    activeCategory = null;
    document.querySelectorAll('.cm-chip').forEach(c => c.classList.remove('active'));
  } else {
    activeCategory = cat;
    document.querySelectorAll('.cm-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.category === cat);
    });
  }

  /* Show/hide markers */
  HOP_POINTS.forEach(hp => {
    const marker = leafletMarkers[hp.id];
    if (!activeCategory || hp.category === activeCategory) {
      marker.addTo(map);
    } else {
      map.removeLayer(marker);
    }
  });

  log(activeCategory ? `Filter → ${activeCategory}` : 'Filter → all');
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function goToSearch(field) {
  sessionStorage.setItem('searchFocusField', field);
  /* Preserve destination if already selected */
  if (selectedDropoff) {
    localStorage.setItem('selectedDestination', selectedDropoff.name);
  }
  window.location.href = 'search.html';
}

function swapFields() {
  const pickupEl  = document.getElementById('cmPickupText');
  const dropoffEl = document.getElementById('cmDropoffText');
  const dropoffField = dropoffEl.closest('.cm-field');

  const oldPickup  = pickupEl.textContent.trim();
  const oldDropoff = dropoffEl.textContent.trim();
  const hadDropoff = selectedDropoff !== null;

  /* Swap display */
  if (hadDropoff) {
    pickupEl.textContent  = oldDropoff;
    dropoffEl.textContent = oldPickup;
    dropoffField.classList.remove('cm-field--placeholder');
    dropoffField.classList.add('cm-field--selected');
    document.getElementById('cmDropoffClear').classList.remove('hidden');
  } else {
    pickupEl.textContent  = '';
    dropoffEl.textContent = oldPickup;
    dropoffField.classList.remove('cm-field--placeholder');
    dropoffField.classList.add('cm-field--selected');
    selectedDropoff = { name: oldPickup };
    document.getElementById('cmNextBtn').disabled = false;
    document.getElementById('cmDropoffClear').classList.remove('hidden');
  }

  /* Update GPS icon — show only if new pickup is preset */
  const newPickup = pickupEl.textContent.trim();
  updatePickupIcon(newPickup === PICKUP_PRESET);

  /* Update clear buttons */
  document.getElementById('cmPickupClear').classList.toggle('hidden', !newPickup);

  log('Swapped pickup ↔ dropoff');
}

function goNext() {
  if (!selectedDropoff) return;

  const pickupName  = document.getElementById('cmPickupText').textContent.trim();
  const dropoffName = selectedDropoff.name;

  /* Save destination */
  localStorage.setItem('selectedDestination', dropoffName);

  /* Check if pickup is still preset */
  const isPreset = !pickupName || pickupName === PICKUP_PRESET;
  if (isPreset) {
    localStorage.removeItem('selectedPickup');
    window.location.href = 'select-pickup.html';
  } else {
    localStorage.setItem('selectedPickup', JSON.stringify({
      name: pickupName, lat: 13.7510, lng: 100.5408, label: 'A',
    }));
    AreaConfig.navigateToService(pickupName, dropoffName);
  }
}

/* =========================================================
   POPULATE FROM LOCALSTORAGE
   ========================================================= */

function populateFields() {
  const pickupEl  = document.getElementById('cmPickupText');
  const dropoffEl = document.getElementById('cmDropoffText');

  /* Pickup */
  try {
    const s = localStorage.getItem('selectedPickup');
    if (s) {
      const data = JSON.parse(s);
      pickupEl.textContent = data.name || PICKUP_PRESET;
      if (data.name && data.name !== PICKUP_PRESET) {
        document.getElementById('cmPickupClear').classList.remove('hidden');
      }
    }
  } catch (e) {}

  /* Show clear button if pickup has any value */
  const isPreset = pickupEl.textContent.trim() === PICKUP_PRESET;
  if (pickupEl.textContent.trim()) {
    document.getElementById('cmPickupClear').classList.remove('hidden');
  }
  updatePickupIcon(isPreset);

  /* Dropoff — from selectedDestination */
  const dest = localStorage.getItem('selectedDestination');
  if (dest) {
    dropoffEl.textContent = dest;
    const field = dropoffEl.closest('.cm-field');
    field.classList.remove('cm-field--placeholder');
    field.classList.add('cm-field--selected');
    selectedDropoff = { name: dest };
    document.getElementById('cmNextBtn').disabled = false;
    document.getElementById('cmDropoffClear').classList.remove('hidden');
  }
}

/* =========================================================
   INIT
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initDraggables();
  initMap();
  populateFields();

  /* Category chip clicks */
  document.querySelectorAll('.cm-chip').forEach(chip => {
    chip.addEventListener('click', () => filterCategory(chip.dataset.category));
  });

  printHelp();
});

/* =========================================================
   CONSOLE API
   ========================================================= */

const LOG_STYLE = 'background:#0D57E2;color:#fff;border-radius:4px;padding:2px 8px;font-weight:600;';
function log(msg) { console.log(`%c ${msg} `, LOG_STYLE); }

function printHelp() {
  console.log(`%c Muvmi Choose on Map Console `, 'background:#0D57E2;color:#fff;font-size:14px;border-radius:6px;padding:4px 12px;font-weight:700;');
  console.log(`
%cActions%c
  selectDropoff(hp)        Select a hop-point as dropoff (pass HOP_POINTS[n])
  filterCategory(cat)      Filter: 'restaurant'|'activity'|'cafe'|'mall'|'park'|'museum'
  goNext()                 Navigate to next step

%cDiscovery%c
  help()                   Show this message
`,
    'color:#0D57E2;font-weight:700', '',
    'color:#0D57E2;font-weight:700', ''
  );
}

window.consoleReset = function() {
  localStorage.clear();
  sessionStorage.clear();
  document.getElementById('c-panel').classList.add('hidden');
  location.reload();
};

Object.assign(window, {
  openHpDialog, closeHpDialog, chooseHpAsDropoff,
  selectDropoff, clearField, filterCategory, swapFields, goToSearch, goNext,
  help: printHelp,
});
