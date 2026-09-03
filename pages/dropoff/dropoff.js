/* ========================================
   Select Drop-off — Logic & Console API
   ======================================== */

/* Extra info shown in the hop-point info dialog */
const HP_INFO = {
  1: { type: 'Street',      desc: 'On the corner of Sukhumvit Soi 31, opposite the 7-Eleven entrance',        photos: ['hoppoint-photo.png', 'place-lumpini.png', 'place-siam-paragon.png'] },
  2: { type: 'Street',      desc: 'In front of the building at the Sukhumvit Soi 33 intersection',            photos: ['place-lumpini.png', 'hoppoint-photo.png', 'place-grand-palace.png'] },
  3: { type: 'BTS Station', desc: 'At the base of BTS Phrom Phong Exit 4, just outside the fare gates',       photos: ['place-grand-palace.png', 'hoppoint-photo.png', 'place-lumpini.png'] },
  4: { type: 'Mall',        desc: 'In front of EmQuartier main entrance on Sukhumvit Road, near the fountain', photos: ['hoppoint-photo.png', 'place-siam-paragon.png', 'place-lumpini.png'] },
  5: { type: 'Street',      desc: 'Near the intersection of Sukhumvit Soi 39 and Sukhumvit Road, north side',  photos: ['place-siam-paragon.png', 'hoppoint-photo.png', 'place-grand-palace.png'] },
};

let currentInfoHp = null;

/* Lat/lng for hop-points around Siam Paragon / Pathumwan area, Bangkok */
const PIN_DATA = {
  1: { label: 'A', lat: 13.7452, lng: 100.5348, name: 'Sukhumvit Soi 31 · Hop-point 4', dist: '1.2 km' },
  2: { label: 'B', lat: 13.7465, lng: 100.5325, name: 'Sukhumvit Soi 33 · Hop-point 3', dist: '0.5 km' },
  3: { label: 'C', lat: 13.7477, lng: 100.5360, name: 'Phrom Phong BTS Exit 4', dist: '0.2 km' },
  4: { label: 'D', lat: 13.7448, lng: 100.5378, name: 'EmQuartier Hop-point', dist: '1.2 km' },
  5: { label: 'E', lat: 13.7440, lng: 100.5308, name: 'Sukhumvit Soi 39 · Hop-point 7', dist: '1.8 km' },
};

/* Origin: the destination marker (where the car will be / Siam Paragon vicinity) */
const ORIGIN = { lat: 13.7463, lng: 100.5372 };

const MAP_CENTER = [13.7458, 100.5345];
const MAP_ZOOM   = 15;

let map = null;
let dashLine = null;
const leafletMarkers = {};
let selectedHp = 1;

/* =========================================================
   MAP INIT (Leaflet + OpenStreetMap)
   ========================================================= */

function initMap() {
  map = L.map('mapLeaflet', {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    zoomControl: false,
    attributionControl: false,
  });

  /* CartoDB Voyager — standard map style for this project */
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map);

  /* Origin/destination marker */
  L.marker([ORIGIN.lat, ORIGIN.lng], {
    icon: L.divIcon({
      className: '',
      html: '<img src="assets/icons/map-origin-pin.svg" width="22" height="26" style="display:block;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.3));">',
      iconSize:   [22, 26],
      iconAnchor: [11, 26],
    }),
    interactive: false,
  }).addTo(map);

  /* Hop-point markers */
  Object.entries(PIN_DATA).forEach(([id, pin]) => {
    const numId  = Number(id);
    const isActive = numId === selectedHp;
    const marker = L.marker([pin.lat, pin.lng], {
      icon: createPinIcon(pin.label, isActive),
    });
    marker.on('click', () => selectHoppoint(numId));
    marker.addTo(map);
    leafletMarkers[id] = marker;
  });

  /* Initial dashed line: origin → selected pin */
  const active = PIN_DATA[selectedHp];
  dashLine = L.polyline(
    [[ORIGIN.lat, ORIGIN.lng], [active.lat, active.lng]],
    { color: '#0D57E2', weight: 2, dashArray: '5 4', lineCap: 'round' }
  ).addTo(map);

  /* Fix size after flex layout settles */
  requestAnimationFrame(() => map.invalidateSize());
}

/* Build a Leaflet DivIcon using the same SVG pin as the bottom sheet */
function createPinIcon(label, isActive) {
  if (isActive) {
    return L.divIcon({
      className: '',
      html: `<div class="map-lf-pin" style="width:17.5px;height:25px;">
               <img src="assets/icons/map-pin-active.svg" alt="">
               <span class="map-lf-letter active">${label}</span>
             </div>`,
      iconSize:   [17.5, 25],
      iconAnchor: [8.75, 25],
    });
  } else {
    return L.divIcon({
      className: '',
      html: `<div class="map-lf-pin" style="width:13.964px;height:18.951px;">
               <img src="assets/icons/map-pin-inactive.svg" alt="">
               <span class="map-lf-letter inactive">${label}</span>
             </div>`,
      iconSize:   [13.964, 18.951],
      iconAnchor: [6.982, 18.951],
    });
  }
}

/* =========================================================
   SELECT HOP-POINT
   ========================================================= */

function selectHoppoint(id) {
  selectedHp = id;
  const pin = PIN_DATA[id];
  if (!pin) return;

  /* List: update selected item */
  document.querySelectorAll('.dropoff-item').forEach(el => {
    el.classList.toggle('selected', Number(el.dataset.hp) === id);
  });

  /* Map: update pin icons */
  Object.entries(PIN_DATA).forEach(([pid, pdata]) => {
    leafletMarkers[pid].setIcon(createPinIcon(pdata.label, Number(pid) === id));
  });

  /* Dashed line: move endpoint to selected pin */
  if (dashLine) {
    dashLine.setLatLngs([[ORIGIN.lat, ORIGIN.lng], [pin.lat, pin.lng]]);
  }
}

/* GPS recenter — fit all pins + origin into view */
function recenterMap() {
  if (!map) return;
  const coords = Object.values(PIN_DATA).map(p => [p.lat, p.lng]);
  coords.push([ORIGIN.lat, ORIGIN.lng]);
  map.fitBounds(coords, { padding: [48, 48], animate: true, maxZoom: 16 });
}

/* =========================================================
   INIT
   ========================================================= */

/* =========================================================
   HOP-POINT INFO DIALOG
   ========================================================= */

function openHpInfo(id) {
  currentInfoHp = id;
  const pin  = PIN_DATA[id];
  const info = HP_INFO[id];
  if (!pin || !info) return;

  /* Update pin letter */
  document.getElementById('hpInfoPinLetter').textContent = pin.label;

  /* Update name */
  document.getElementById('hpInfoName').textContent = pin.name;

  /* Update type badge */
  document.getElementById('hpInfoType').textContent = info.type;

  /* Update description + distance */
  document.getElementById('hpInfoDesc').textContent = info.desc;
  document.getElementById('hpInfoDist').textContent = pin.dist + ' from you';

  /* Build photo carousel */
  const track = document.getElementById('hpPhotosTrack');
  track.innerHTML = info.photos.map((photo, i) => `
    <div class="hp-photo-item">
      <img src="assets/images/${photo}" alt="" draggable="false">
      ${i === 0 ? '<span class="hp-meet-badge">Let\'s meet here</span>' : ''}
    </div>
  `).join('');

  /* Update save button state */
  const saveBtn = document.getElementById('hpSaveBtn');
  if (saveBtn) { saveBtn.dataset.hpName = pin.name; if (typeof SaveFavorite !== 'undefined') SaveFavorite.updateButton(pin.name); }

  /* Show dialog */
  const dialog = document.getElementById('hpInfoDialog');
  dialog.classList.remove('hidden');
  dialog.classList.add('visible');

  /* Replay banner slide-up animation */
  if (typeof HoppointBanner !== 'undefined') HoppointBanner.play();
}

function closeHpInfo() {
  const dialog = document.getElementById('hpInfoDialog');
  dialog.classList.remove('visible');
  dialog.classList.add('hidden');
  currentInfoHp = null;
}

function chooseFromDialog() {
  if (currentInfoHp !== null) selectHoppoint(currentInfoHp);
  closeHpInfo();
  confirmDropoff();
}

/* Confirm the currently selected hop-point.
   - Preset flow (selectedPickup already saved) → go straight to service-selection
   - Changed pickup flow (no pickup saved yet) → go to select-pickup first
*/
function confirmDropoff() {
  const pin = PIN_DATA[selectedHp];
  if (!pin) return;
  localStorage.setItem('selectedDropoff', JSON.stringify({ id: selectedHp, ...pin }));
  const hasPickup = !!localStorage.getItem('selectedPickup');
  if (hasPickup) {
    const pickupData = JSON.parse(localStorage.getItem('selectedPickup'));
    AreaConfig.navigateToService(pickupData.name, pin.name);
  } else {
    window.location.href = 'select-pickup.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initDraggables();
  initMap();
  printHelp();
});

/* =========================================================
   CONSOLE API
   ========================================================= */

const LOG_STYLE = 'background:#0D57E2;color:#fff;border-radius:4px;padding:2px 8px;font-weight:600;';
function log(msg) { console.log(`%c ${msg} `, LOG_STYLE); }

function listIds() {
  const ids = [];
  $$('[data-id]').forEach(el => {
    ids.push({ id: el.dataset.id, tag: el.tagName.toLowerCase(), text: el.textContent.trim().slice(0, 40) });
  });
  console.table(ids);
}

function printHelp() {
  console.log(`%c Muvmi Drop-off Console `, 'background:#0D57E2;color:#fff;font-size:14px;border-radius:6px;padding:4px 12px;font-weight:700;');
  console.log(`
%cSelection%c
  selectHoppoint(1..5)   Select a hop-point by number
  recenterMap()          Recenter map to default view

%cDiscovery%c
  listIds()              List all data-id elements
  help()                 Show this message
`,
    'color:#0D57E2;font-weight:700', '',
    'color:#0D57E2;font-weight:700', ''
  );
}

window.consoleReset = function() {
  localStorage.clear();
  sessionStorage.clear();
  selectHoppoint(1);
  if (map) map.setView(MAP_CENTER, MAP_ZOOM);
  document.getElementById('c-panel').classList.add('hidden');
};

window.runScenario = function(n) {
  if (n >= 1 && n <= 5) selectHoppoint(n);
};

Object.assign(window, {
  selectHoppoint,
  recenterMap,
  openHpInfo,
  closeHpInfo,
  chooseFromDialog,
  confirmDropoff,
  listIds,
  help: printHelp,
});
