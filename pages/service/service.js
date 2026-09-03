/* ========================================
   Service Selection — Logic & Console API
   ======================================== */

const MAP_ZOOM = 15;

let map = null;
let selectedService = 'saver';

/* Fallback data if localStorage isn't set */
const DEFAULT_PICKUP  = { lat: 13.7510, lng: 100.5408, name: 'Emquatiers main entrance', label: 'A' };
const DEFAULT_DROPOFF = { lat: 13.7477, lng: 100.5360, name: 'Siam Paragon', label: 'C' };

function getPickupData() {
  try {
    const s = localStorage.getItem('selectedPickup');
    if (s) return JSON.parse(s);
  } catch (e) {}
  return DEFAULT_PICKUP;
}

function getDropoffData() {
  try {
    const s = localStorage.getItem('selectedDropoff');
    if (s) return JSON.parse(s);
  } catch (e) {}
  return DEFAULT_DROPOFF;
}


/* =========================================================
   MAP INIT
   ========================================================= */

function initMap() {
  const pickup  = getPickupData();
  const dropoff = getDropoffData();

  const midLat = (pickup.lat  + dropoff.lat)  / 2;
  const midLng = (pickup.lng  + dropoff.lng) / 2;

  map = L.map('mapLeaflet', {
    center: [midLat, midLng],
    zoom: MAP_ZOOM,
    zoomControl: false,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map);

  /* Pickup marker (outlined badge + inactive-style pin) */
  L.marker([pickup.lat, pickup.lng], {
    icon: createLabelPinIcon(pickup.label || 'A', 'pickup'),
  }).on('click', () => openPinDialog('pickup')).addTo(map);

  /* Dropoff marker (filled badge + active-style pin) */
  L.marker([dropoff.lat, dropoff.lng], {
    icon: createLabelPinIcon(dropoff.label || 'C', 'dropoff'),
  }).on('click', () => openPinDialog('dropoff')).addTo(map);

  /* User location dot near pickup */
  L.circleMarker([pickup.lat + 0.0005, pickup.lng + 0.0005], {
    radius: 8,
    fillColor: '#0D57E2',
    fillOpacity: 1,
    color: 'white',
    weight: 3,
    interactive: false,
  }).addTo(map);

  /* Dashed route line */
  L.polyline(
    [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]],
    { color: '#0D57E2', weight: 2, dashArray: '5 4', lineCap: 'round' }
  ).addTo(map);

  /* Fit both pins */
  map.fitBounds(
    [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]],
    { padding: [56, 56], maxZoom: 15, animate: false }
  );

  requestAnimationFrame(() => map.invalidateSize());
}

function createLabelPinIcon(label, type) {
  const isPickup   = type === 'pickup';
  const badgeClass = isPickup ? 'pickup-badge' : 'dropoff-badge';
  const badgeText  = isPickup ? 'Pick up'      : 'Drop off';
  const pinSrc     = isPickup
    ? 'assets/icons/map-pin-hop-pickup.svg'
    : 'assets/icons/map-pin-hop-dropoff.svg';

  const pinW = 20;
  const pinH = 26.667;
  const totalH = 19 + 4 + pinH; // badge + gap + pin

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

/* =========================================================
   PIN DIALOG
   ========================================================= */

let currentPinType = null; // 'pickup' | 'dropoff'

const PIN_DIALOG_INFO = {
  pickup:  { type: 'Hop-point', desc: 'Walk to this location to meet your driver.',     photos: ['hoppoint-photo.png', 'place-lumpini.png'] },
  dropoff: { type: 'Hop-point', desc: 'Your driver will drop you off at this location.', photos: ['hoppoint-photo.png', 'place-siam-paragon.png'] },
};

function openPinDialog(type) {
  currentPinType = type;
  const data = type === 'pickup' ? getPickupData() : getDropoffData();
  const info = PIN_DIALOG_INFO[type];

  document.getElementById('hpInfoPinLetter').textContent = data.label || (type === 'pickup' ? 'A' : 'C');
  document.getElementById('hpInfoName').textContent      = data.name  || '—';
  document.getElementById('hpInfoType').textContent      = info.type;
  document.getElementById('hpInfoDesc').textContent      = info.desc;
  document.getElementById('hpInfoDist').textContent      = data.dist  ? data.dist + ' from you' : '';
  document.getElementById('hpCtaBtn').textContent        = type === 'pickup' ? 'Change This Pickup' : 'Change This Drop-off';

  const track = document.getElementById('hpPhotosTrack');
  track.innerHTML = info.photos.map((photo, i) => `
    <div class="hp-photo-item">
      <img src="assets/images/${photo}" alt="" draggable="false">
      ${i === 0 ? '<span class="hp-meet-badge">Let\'s meet here</span>' : ''}
    </div>
  `).join('');

  /* Update save button state */
  const saveBtn = document.getElementById('hpSaveBtn');
  if (saveBtn) { saveBtn.dataset.hpName = data.name; if (typeof SaveFavorite !== 'undefined') SaveFavorite.updateButton(data.name); }

  const dialog = document.getElementById('hpInfoDialog');
  dialog.classList.remove('hidden');
  dialog.classList.add('visible');

  if (typeof HoppointBanner !== 'undefined') HoppointBanner.play();
}

function closePinDialog() {
  const dialog = document.getElementById('hpInfoDialog');
  dialog.classList.remove('visible');
  dialog.classList.add('hidden');
  currentPinType = null;
}

function changePinFromDialog() {
  window.location.href = currentPinType === 'pickup' ? 'select-pickup.html' : 'select-dropoff.html';
}

/* =========================================================
   SWAP PICKUP ↔ DESTINATION
   ========================================================= */

function swapPickupDest() {
  const oldPickup  = getPickupData();
  const oldDropoff = getDropoffData();
  const oldDest    = localStorage.getItem('selectedDestination');

  /* old pickup → new dropoff/destination */
  localStorage.setItem('selectedDropoff', JSON.stringify(oldPickup));
  localStorage.setItem('selectedDestination', oldPickup.name);

  /* old dropoff → new pickup */
  localStorage.setItem('selectedPickup', JSON.stringify(oldDropoff));

  /* Reload to re-render map + header with swapped data */
  location.reload();
}

/* =========================================================
   SERVICE SELECTION
   ========================================================= */

function selectService(serviceId) {
  selectedService = serviceId;
  document.querySelectorAll('.service-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.service === serviceId);
  });
  log(`Service → ${serviceId}`);
}

function confirmService() {
  localStorage.setItem('selectedService', selectedService);
  window.location.href = 'request.html';
}

/* =========================================================
   POPULATE DYNAMIC DATA FROM LOCALSTORAGE
   ========================================================= */

function populateHeader() {
  const pickup  = getPickupData();
  const destName = localStorage.getItem('selectedDestination') || DEFAULT_DROPOFF.name;

  const pickupEl   = document.getElementById('servicePickupText');
  const pickupIcon = document.getElementById('servicePickupIcon');
  const destEl     = document.getElementById('serviceDestText');

  if (pickupEl) pickupEl.textContent = pickup.name || DEFAULT_PICKUP.name;
  if (destEl)   destEl.textContent   = destName;

  /* GPS icon only for preset pickup */
  if (pickupIcon) {
    pickupIcon.style.display = (pickup.name === DEFAULT_PICKUP.name) ? '' : 'none';
  }
}

/* =========================================================
   BOTTOM SHEET — 3-STAGE DRAG
   ========================================================= */

const SHEET_STAGES = { collapsed: 20, default: 44, expanded: 62 }; // vh

let sheetStage = 'default';
let sheetEl    = null;

function setSheetHeight(vh, animate) {
  if (!sheetEl) return;
  sheetEl.style.transition = animate
    ? 'height 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    : 'none';
  sheetEl.style.height = vh + 'vh';
}

function snapToStage(vh) {
  const mid1 = (SHEET_STAGES.collapsed + SHEET_STAGES.default) / 2; // 35
  const mid2 = (SHEET_STAGES.default   + SHEET_STAGES.expanded) / 2; // 56
  if (vh < mid1) return 'collapsed';
  if (vh > mid2) return 'expanded';
  return 'default';
}

function setSheetStage(stage) {
  if (!SHEET_STAGES[stage] && SHEET_STAGES[stage] !== 0) return;
  sheetStage = stage;
  setSheetHeight(SHEET_STAGES[stage], true);
  log(`Sheet → ${stage} (${SHEET_STAGES[stage]}vh)`);
}

function initSheetDrag() {
  sheetEl = document.querySelector('.service-sheet');
  if (!sheetEl) return;

  /* Always start at default stage on page load */
  sheetEl.style.transition = 'none';
  sheetEl.style.height = SHEET_STAGES.default + 'vh';
  sheetStage = 'default';

  const dragHandle = document.querySelector('.service-drag-wrap');
  if (!dragHandle) return;

  let dragging = false;
  let startY   = 0;
  let startH   = 0; // px

  const viewH = () => window.innerHeight;

  dragHandle.addEventListener('pointerdown', e => {
    dragging = true;
    startY = e.clientY;
    startH = sheetEl.getBoundingClientRect().height;
    sheetEl.style.transition = 'none';
    dragHandle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  dragHandle.addEventListener('pointermove', e => {
    if (!dragging) return;
    const deltaY  = startY - e.clientY; // positive = up = taller
    const newHPx  = startH + deltaY;
    const vhMin   = SHEET_STAGES.collapsed;
    const vhMax   = SHEET_STAGES.expanded;
    const newVh   = Math.max(vhMin, Math.min(vhMax, (newHPx / viewH()) * 100));
    sheetEl.style.height = newVh + 'vh';
  });

  const finishDrag = () => {
    if (!dragging) return;
    dragging = false;
    const currentVh = (sheetEl.getBoundingClientRect().height / viewH()) * 100;
    const newStage  = snapToStage(currentVh);
    sheetStage = newStage;
    setSheetHeight(SHEET_STAGES[newStage], true);
  };

  dragHandle.addEventListener('pointerup',     finishDrag);
  dragHandle.addEventListener('pointercancel', () => {
    if (!dragging) return;
    dragging = false;
    setSheetHeight(SHEET_STAGES[sheetStage], true);
  });
}

/* =========================================================
   INIT
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initDraggables();
  initSheetDrag();
  populateHeader();
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
  console.log(`%c Muvmi Service Selection Console `, 'background:#0D57E2;color:#fff;font-size:14px;border-radius:6px;padding:4px 12px;font-weight:700;');
  console.log(`
%cSelection%c
  selectService(id)         Select a service ('saver' | 'express-tuk' | 'rod-deang' | 'muvpet' | 'muvbaby')
  setSheetStage(stage)      Snap sheet to 'collapsed' | 'default' | 'expanded'

%cDiscovery%c
  listIds()           List all data-id elements
  help()              Show this message
`,
    'color:#0D57E2;font-weight:700', '',
    'color:#0D57E2;font-weight:700', ''
  );
}

window.consoleReset = function() {
  localStorage.clear();
  sessionStorage.clear();
  selectService('saver');
  setSheetStage('default');
  document.getElementById('c-panel').classList.add('hidden');
};

window.runScenario = function(n) {
  const svcs = ['saver', 'express-tuk', 'rod-deang', 'muvpet', 'muvbaby'];
  if (svcs[n - 1]) selectService(svcs[n - 1]);
};

Object.assign(window, {
  swapPickupDest,
  selectService,
  confirmService,
  setSheetStage,
  openPinDialog, closePinDialog, changePinFromDialog,
  listIds,
  help: printHelp,
});
