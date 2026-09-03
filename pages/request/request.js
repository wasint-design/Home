/* ========================================
   Request (Trip Details) — Logic & Console API
   ======================================== */

const MAP_ZOOM = 15;
let map = null;
let paxCount = 1;
let privateCar = false;

/* Fallback data */
const DEFAULT_PICKUP  = { lat: 13.7510, lng: 100.5408, name: 'Emquatiers main entrance', label: 'A' };
const DEFAULT_DROPOFF = { lat: 13.7477, lng: 100.5360, name: 'Siam Paragon', label: 'C' };

const SERVICE_DATA = {
  'saver':       { name: 'Saver',             icon: 'service-saver.svg',       iconW: 21, iconH: 16, eta: '~10-15 mins away',  desc: 'Ride sharing, saver with longer time',    cta: 'Request Tuk Tuk', rideFee: 25, discount: 15 },
  'express-tuk': { name: 'Express Tuk Tuk',   icon: 'service-express-tuk.svg', iconW: 15, iconH: 24, eta: '~5-10 mins away',   desc: 'Ride sharing, with faster pickup',         cta: 'Request Tuk Tuk', rideFee: 55, discount: 0  },
  'rod-deang':   { name: 'Express Rod Deang', icon: 'service-calendar.svg',    iconW: 20, iconH: 20, eta: '30 mins in advance', desc: 'Select your preferred pickup time',        cta: 'Request Ride',    rideFee: 55, discount: 0  },
  'muvpet':      { name: 'MuvPet',            icon: 'service-calendar.svg',    iconW: 20, iconH: 20, eta: '30 mins in advance', desc: 'Select your preferred pickup time',        cta: 'Request Ride',    rideFee: 55, discount: 0  },
  'muvbaby':     { name: 'MuvBaby',           icon: 'service-calendar.svg',    iconW: 20, iconH: 20, eta: '30 mins in advance', desc: 'Select your preferred pickup time',        cta: 'Request Ride',    rideFee: 55, discount: 0  },
};

/* =========================================================
   DATA HELPERS
   ========================================================= */

function getPickupData() {
  try { const s = localStorage.getItem('selectedPickup'); if (s) return JSON.parse(s); } catch (e) {}
  return DEFAULT_PICKUP;
}

function getDropoffData() {
  try { const s = localStorage.getItem('selectedDropoff'); if (s) return JSON.parse(s); } catch (e) {}
  return DEFAULT_DROPOFF;
}

function getSelectedService() {
  return localStorage.getItem('selectedService') || 'saver';
}

/* =========================================================
   POPULATE
   ========================================================= */

function populateHeader() {
  const pickup   = getPickupData();
  const destName = localStorage.getItem('selectedDestination') || DEFAULT_DROPOFF.name;

  const pickupEl   = document.getElementById('requestPickupText');
  const pickupIcon = document.getElementById('requestPickupIcon');
  const destEl     = document.getElementById('requestDestText');
  if (pickupEl) pickupEl.textContent = pickup.name || DEFAULT_PICKUP.name;
  if (destEl)   destEl.textContent   = destName;

  /* GPS icon only for preset pickup */
  if (pickupIcon) {
    pickupIcon.style.display = (pickup.name === DEFAULT_PICKUP.name) ? '' : 'none';
  }
}

function populateService() {
  const svcId = getSelectedService();
  const svc   = SERVICE_DATA[svcId] || SERVICE_DATA['saver'];

  document.getElementById('reqServiceName').textContent = svc.name;
  document.getElementById('reqEta').textContent         = svc.eta;
  document.getElementById('reqDesc').textContent        = svc.desc;
  document.getElementById('reqCtaBtn').textContent      = svc.cta;

  const iconImg = document.getElementById('reqServiceIconImg');
  iconImg.src    = `assets/icons/${svc.icon}`;
  iconImg.width  = svc.iconW;
  iconImg.height = svc.iconH;

  /* Pricing */
  const appFee = 10;
  const total  = svc.rideFee + appFee;
  const final  = total - svc.discount;

  document.getElementById('reqRideFee').textContent = `฿${svc.rideFee}`;

  const discountRow = document.getElementById('reqDiscountRow');
  const oldPriceEl  = document.getElementById('reqBadgeOld');

  if (svc.discount > 0) {
    discountRow.style.display = '';
    document.getElementById('reqDiscountAmt').textContent = `- ฿${svc.discount}`;
    oldPriceEl.style.display = '';
    oldPriceEl.textContent   = `฿${total}`;
  } else {
    discountRow.style.display = 'none';
    oldPriceEl.style.display  = 'none';
  }

  document.getElementById('reqBadgeNew').textContent = `฿${final}`;
}

/* =========================================================
   MAP
   ========================================================= */

function initMap() {
  const pickup  = getPickupData();
  const dropoff = getDropoffData();

  const midLat = (pickup.lat  + dropoff.lat)  / 2;
  const midLng = (pickup.lng  + dropoff.lng)  / 2;

  map = L.map('mapLeaflet', {
    center: [midLat, midLng],
    zoom: MAP_ZOOM,
    zoomControl: false,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map);

  /* Pickup marker */
  L.marker([pickup.lat, pickup.lng], {
    icon: createLabelPinIcon(pickup.label || 'A', 'pickup'),
    interactive: false,
  }).addTo(map);

  /* Dropoff marker */
  L.marker([dropoff.lat, dropoff.lng], {
    icon: createLabelPinIcon(dropoff.label || 'C', 'dropoff'),
    interactive: false,
  }).addTo(map);

  /* User location dot */
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

/* =========================================================
   PASSENGERS PICKER
   ========================================================= */

function renderPaxDropdown() {
  const dropdown = document.getElementById('paxDropdown');
  dropdown.innerHTML = '';
  for (let i = 1; i <= 6; i++) {
    const opt = document.createElement('div');
    opt.className = `req-pax-option${i === paxCount ? ' selected' : ''}`;
    opt.textContent = i;
    opt.onclick = () => selectPax(i);
    dropdown.appendChild(opt);
  }
}

function togglePaxDropdown() {
  const dropdown = document.getElementById('paxDropdown');
  if (dropdown.classList.contains('hidden')) {
    renderPaxDropdown();
    /* Compute position relative to .phone (dropdown is portaled there) */
    const phone    = document.querySelector('.phone');
    const wrap     = document.querySelector('.req-picker-wrap');
    const phoneRect = phone.getBoundingClientRect();
    const wrapRect  = wrap.getBoundingClientRect();
    dropdown.style.top  = (wrapRect.bottom - phoneRect.top + 4) + 'px';
    dropdown.style.left = (wrapRect.left - phoneRect.left + 32) + 'px'; /* 32 = minus-btn(24)+gap(8) */
    dropdown.classList.remove('hidden');
  } else {
    dropdown.classList.add('hidden');
  }
}

function selectPax(n) {
  paxCount = n;
  document.getElementById('paxValue').textContent = n;
  document.getElementById('paxDropdown').classList.add('hidden');
  updatePaxButtons();
  log(`Passengers → ${n}`);
}

function changePax(delta) {
  const newVal = Math.max(1, Math.min(6, paxCount + delta));
  if (newVal !== paxCount) selectPax(newVal);
}

function updatePaxButtons() {
  document.getElementById('paxMinus').disabled = paxCount <= 1;
  document.getElementById('paxPlus').disabled  = paxCount >= 6;
}

/* =========================================================
   PRIVATE CAR
   ========================================================= */

function togglePrivateCar() {
  privateCar = !privateCar;
  document.getElementById('privateCarCheckbox').classList.toggle('checked', privateCar);
  log(`Private car → ${privateCar}`);
}

/* =========================================================
   PRICE INFO TOGGLE
   ========================================================= */

function togglePriceInfo() {
  const panel = document.getElementById('reqPricePanel');
  if (panel.classList.contains('open')) {
    closePriceInfo();
  } else {
    /* Anchor panel bottom to footer top so it slides up flush above the footer */
    const footer = document.querySelector('.request-footer');
    panel.style.bottom = footer.offsetHeight + 'px';
    panel.classList.add('open');
    document.getElementById('reqPriceOverlay').classList.remove('hidden');
    log('Price summary → open');
  }
}

function closePriceInfo() {
  document.getElementById('reqPricePanel').classList.remove('open');
  document.getElementById('reqPriceOverlay').classList.add('hidden');
  log('Price summary → closed');
}

/* =========================================================
   SUBMIT
   ========================================================= */

function submitRequest() {
  const svcId = getSelectedService();
  log(`Request: ${svcId}, pax=${paxCount}, private=${privateCar}`);
  window.location.href = 'tracking.html';
}

/* =========================================================
   INIT
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initDraggables();
  populateHeader();
  populateService();
  initMap();
  updatePaxButtons();

  /* Portal dropdown to .phone so it sits in phone's stacking context (z-index 50)
     and is never clipped by request-card (z-index 2) or footer (z-index 21). */
  const phone    = document.querySelector('.phone');
  const dropdown = document.getElementById('paxDropdown');
  phone.appendChild(dropdown);

  /* Close dropdown on outside click — exclude both picker-wrap AND the dropdown itself */
  document.addEventListener('click', e => {
    if (!e.target.closest('.req-picker-wrap') && !e.target.closest('#paxDropdown')) {
      dropdown.classList.add('hidden');
    }
  });

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
  console.log(`%c Muvmi Request Console `, 'background:#0D57E2;color:#fff;font-size:14px;border-radius:6px;padding:4px 12px;font-weight:700;');
  console.log(`
%cActions%c
  changePax(delta)        Change passenger count by delta (+1 / -1)
  selectPax(n)            Set passenger count to n (1-6)
  togglePrivateCar()      Toggle private car checkbox

%cDiscovery%c
  listIds()               List all data-id elements
  help()                  Show this message
`,
    'color:#0D57E2;font-weight:700', '',
    'color:#0D57E2;font-weight:700', ''
  );
}

window.consoleReset = function() {
  localStorage.clear();
  sessionStorage.clear();
  selectPax(1);
  privateCar = false;
  document.getElementById('privateCarCheckbox').classList.remove('checked');
  closePriceInfo();
  document.getElementById('c-panel').classList.add('hidden');
};

Object.assign(window, {
  changePax, selectPax, togglePrivateCar, submitRequest,
  togglePriceInfo, closePriceInfo,
  listIds,
  help: printHelp,
});
