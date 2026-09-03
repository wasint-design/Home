/* ========================================
   Select Pickup — Logic & Console API
   ======================================== */

/* Lat/lng for hop-points near EmQuartiers / Sukhumvit 22-28 area (origin side) */
const PIN_DATA = {
  1: { label: 'A', lat: 13.7502, lng: 100.5395, name: 'Sukhumvit Soi 22 · Hop-point 1', dist: '0.8 km' },
  2: { label: 'B', lat: 13.7519, lng: 100.5385, name: 'Sukhumvit Soi 20 · Hop-point 2', dist: '1.1 km' },
  3: { label: 'C', lat: 13.7495, lng: 100.5418, name: 'Asok Station · Hop-point 3',      dist: '0.5 km' },
  4: { label: 'D', lat: 13.7513, lng: 100.5412, name: 'EmQuartier Hop-point',            dist: '0.3 km' },
  5: { label: 'E', lat: 13.7527, lng: 100.5400, name: 'Sukhumvit Soi 18 · Hop-point 5', dist: '1.4 km' },
};

/* Origin: user's current location (near EmQuartiers) */
const ORIGIN = { lat: 13.7510, lng: 100.5408 };

const MAP_CENTER = [13.7510, 100.5400];
const MAP_ZOOM   = 15;

let map = null;
let dashLine = null;
const leafletMarkers = {};

/* Default to closest hop-point from user's location */
let selectedHp = findClosestHp();

function findClosestHp() {
  let closest = 1;
  let minDist = Infinity;
  for (const [id, pin] of Object.entries(PIN_DATA)) {
    const d = parseFloat(pin.dist);  /* parse "0.5 km" → 0.5 */
    if (d < minDist) { minDist = d; closest = Number(id); }
  }
  return closest;
}

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

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map);

  /* User location dot */
  L.circleMarker([ORIGIN.lat, ORIGIN.lng], {
    radius: 8,
    fillColor: '#0D57E2',
    fillOpacity: 1,
    color: 'white',
    weight: 3,
    className: 'user-location-dot',
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

  requestAnimationFrame(() => map.invalidateSize());
}

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

  document.querySelectorAll('.pickup-item').forEach(el => {
    el.classList.toggle('selected', Number(el.dataset.hp) === id);
  });

  Object.entries(PIN_DATA).forEach(([pid, pdata]) => {
    leafletMarkers[pid].setIcon(createPinIcon(pdata.label, Number(pid) === id));
  });

  if (dashLine) {
    dashLine.setLatLngs([[ORIGIN.lat, ORIGIN.lng], [pin.lat, pin.lng]]);
  }
}

/* GPS recenter */
function recenterMap() {
  if (!map) return;
  const coords = Object.values(PIN_DATA).map(p => [p.lat, p.lng]);
  coords.push([ORIGIN.lat, ORIGIN.lng]);
  map.fitBounds(coords, { padding: [48, 48], animate: true, maxZoom: 16 });
}

/* Search pill → navigate to search page with pickup mode */
function searchPickup() {
  sessionStorage.setItem('searchFocusField', 'pickup');
  window.location.href = 'search.html';
}

/* Confirm the currently selected pickup hop-point → proceed to service selection */
function confirmPickup() {
  const pin = PIN_DATA[selectedHp];
  if (!pin) return;
  localStorage.setItem('selectedPickup', JSON.stringify({ id: selectedHp, ...pin }));
  const dest = localStorage.getItem('selectedDestination') || '';
  AreaConfig.navigateToService(pin.name, dest);
}

/* =========================================================
   INIT
   ========================================================= */

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
  console.log(`%c Muvmi Pickup Console `, 'background:#0D57E2;color:#fff;font-size:14px;border-radius:6px;padding:4px 12px;font-weight:700;');
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
  selectHoppoint(findClosestHp());
  if (map) map.setView(MAP_CENTER, MAP_ZOOM);
  document.getElementById('c-panel').classList.add('hidden');
};

window.runScenario = function(n) {
  if (n >= 1 && n <= 5) selectHoppoint(n);
};

Object.assign(window, {
  selectHoppoint,
  recenterMap,
  searchPickup,
  confirmPickup,
  listIds,
  help: printHelp,
});
