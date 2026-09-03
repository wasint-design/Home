/* ========================================
   Homepage — Logic, Variation & Console API
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initDraggables();
  initVariation();
  initCardClicks();
  renderSavedPlaces();
  printHelp();
});

/* =========================================================
   SAVED PLACES — show section + render user-saved items
   ========================================================= */

/* Label → icon mapping for user-saved places */
const SAVED_LABEL_ICONS = {
  bookmark: 'assets/icons/save-label-bookmark.svg',
  home:     'assets/icons/saved-home.svg',
  office:   'assets/icons/saved-work.svg',
  gym:      'assets/icons/saved-gym.svg',
  train:    'assets/icons/save-label-train.svg',
  school:   'assets/icons/save-label-school.svg',
};

function renderSavedPlaces() {
  const section = bySection('savedPlaces');
  if (!section) return;

  const saved = (typeof SaveFavorite !== 'undefined') ? SaveFavorite.getAll() : [];
  if (saved.length === 0) return; /* no user saves → leave section as-is (variation controls visibility) */

  /* Show section regardless of variation */
  section.style.display = 'flex';

  /* Append user-saved items after preset items */
  const row = section.querySelector('.saved-places-row');
  if (!row) return;

  /* Remove previously-appended user items (re-render safe) */
  row.querySelectorAll('.saved-place-item--user').forEach(el => el.remove());

  saved.forEach(entry => {
    const icon = SAVED_LABEL_ICONS[entry.label] || SAVED_LABEL_ICONS.bookmark;
    const div = document.createElement('div');
    div.className = 'saved-place-item saved-place-item--user tappable';
    div.innerHTML = `
      <div class="saved-place-icon">
        <img src="${icon}" alt="" width="18" height="18">
      </div>
      <span class="saved-place-label">${entry.addressName || entry.hpName}</span>
    `;
    row.appendChild(div);
  });
}

/* =========================================================
   CARD CLICK → OPEN DIALOG (event delegation for ALL cards)
   ========================================================= */

function initCardClicks() {
  document.querySelector('.phone').addEventListener('click', e => {
    /* Place cards (Get around, Trending, Restaurants) */
    const placeCard = e.target.closest('.place-card');
    if (placeCard) {
      const name = placeCard.querySelector('.place-card-name')?.textContent.trim();
      const dist = placeCard.querySelector('.place-card-distance span')?.textContent.trim();
      const img  = placeCard.querySelector('.place-card-thumb img')?.src || '';
      if (name) openPlaceDialog(name, dist || '', img);
      return;
    }

    /* Go Again cards (Variation 2) → select as destination directly */
    const goAgain = e.target.closest('.go-again-card');
    if (goAgain) {
      const name = goAgain.querySelector('.go-again-name')?.textContent.trim();
      if (name) quickSelectDestination(name);
      return;
    }

    /* Saved Place items (Variation 3) → select as destination directly */
    const savedPlace = e.target.closest('.saved-place-item');
    if (savedPlace) {
      const name = savedPlace.querySelector('.saved-place-label')?.textContent.trim();
      if (name) quickSelectDestination(name);
      return;
    }
  });
}

/* =========================================================
   VARIATION SYSTEM
   setVariation(1) … setVariation(4)
   ========================================================= */

const VARIATIONS = {
  1: { name: 'New User' },
  2: { name: 'Casual' },
  3: { name: 'Recurring' },
  4: { name: 'Travel' }
};

let currentVariation = 1;

function initVariation() {
  const saved = localStorage.getItem('homepage-variation');
  if (saved && VARIATIONS[saved]) {
    setVariation(Number(saved), true);
  }
}

function setVariation(n, silent) {
  if (!VARIATIONS[n]) {
    console.warn(`Variation ${n} not found. Available: ${Object.keys(VARIATIONS).join(', ')}`);
    return;
  }
  currentVariation = n;
  document.querySelector('.phone').setAttribute('data-variation', n);
  localStorage.setItem('homepage-variation', n);

  const applyFn = variationAppliers[n];
  if (applyFn) applyFn();

  document.getElementById('homeScroll').scrollTop = 0;

  if (!silent) {
    log(`Switched to Variation ${n}: ${VARIATIONS[n].name}`);
  }
}

/* --- Variation Data --- */
const V1_DATA = {
  avatar: 'assets/images/member-avatar.png',
  badgeText: 'MuvMember',
  badgeIcon: 'assets/icons/muvmember-arrow.svg',
  badgeGradient: 'linear-gradient(to top, #5CA6FF, rgba(92, 166, 255, 0.7))',
  sectionTitle: 'Get around Bangkok with MuvMi',
  seeAllText: 'See all',
  cards: [
    { name: 'The Temple of the Emerald Buddha (Wat Phra Kaew)', distance: '1.8 km', image: 'assets/images/place-wat-phra-kaew.png' },
    { name: 'Grand Palace', distance: '2 km', image: 'assets/images/place-grand-palace.png' },
    { name: 'Democracy Monument', distance: '2.5 km', image: 'assets/images/place-democracy.png' },
  ],
  offers: [
    { type: 'banner', image: 'assets/images/offer-banner-1.png' },
    { type: 'banner', image: 'assets/images/offer-banner-2.png' },
    { type: 'weekend' },
  ],
};

const V2_DATA = {
  avatar: 'assets/images/gang-avatar.png',
  badgeText: 'MuvGang',
  badgeIcon: 'assets/icons/muvgang-arrow.svg',
  badgeGradient: 'linear-gradient(to top, #30C698, rgba(48, 198, 152, 0.7))',
  badgeGap: '11px',
  sectionTitle: 'MuvMi Happy hour 20% off on these location',
  seeAllText: 'See all',
  cards: [
    { name: 'The Coffee Club', distance: '0.5 km', image: 'assets/images/place-coffee-club.png' },
    { name: 'Siam Paragon Mall', distance: '1.2 km', image: 'assets/images/place-siam-paragon.png' },
    { name: 'Som Tam Nua Restaurant', distance: '1.8 km', image: 'assets/images/place-somtam-nua.png' },
  ],
  offers: [
    { type: 'banner', image: 'assets/images/offer-banner-2.png' },
    { type: 'tonight' },
    { type: 'weekend' },
  ],
};

const V4_DATA = {
  avatar: 'assets/images/member-avatar.png',
  badgeText: 'Day Pass Activated',
  badgeIcon: 'assets/icons/daypass-arrow.svg',
  badgeGradient: 'linear-gradient(172deg, #E3B674, #FFB300)',
  badgeWidth: 'auto',
  badgeJustify: 'flex-start',
  sectionTitle: 'Get around Bangkok with MuvMi',
  seeAllText: 'See all',
  cards: [
    { name: 'The Temple of the Emerald Buddha (Wat Phra Kaew)', distance: '1.8 km', image: 'assets/images/place-wat-phra-kaew.png' },
    { name: 'Grand Palace', distance: '2 km', image: 'assets/images/place-grand-palace.png' },
    { name: 'Democracy Monument', distance: '2.5 km', image: 'assets/images/place-democracy.png' },
  ],
  offers: [
    { type: 'banner', image: 'assets/images/offer-banner-muvmi-private.png' },
    { type: 'daypass', image: 'assets/images/offer-banner-daypass-img.png' },
    { type: 'weekend' },
  ],
};

const V3_DATA = {
  avatar: 'assets/images/master-avatar.png',
  badgeText: 'MuvMaster',
  badgeIcon: 'assets/icons/muvmaster-arrow.svg',
  badgeGradient: '#FF1010',
  badgeGap: '9px',
  badgeDropShadow: 'drop-shadow(0 0 2px rgba(0,0,0,0.15))',
  sectionTitle: 'MuvMi Happy hour 20% off on these location',
  seeAllText: 'See all',
  cards: [
    { name: 'The Coffee Club', distance: '0.5 km', image: 'assets/images/place-coffee-club.png' },
    { name: 'Siam Paragon Mall', distance: '1.2 km', image: 'assets/images/place-siam-paragon.png' },
    { name: 'Som Tam Nua Restaurant', distance: '1.8 km', image: 'assets/images/place-somtam-nua.png' },
  ],
  offers: [
    { type: 'banner', image: 'assets/images/offer-banner-2.png' },
    { type: 'tonight' },
    { type: 'weekend' },
  ],
};

function applyVariationData(data) {
  // Avatar
  const avatarEl = byId('avatar');
  if (avatarEl) avatarEl.querySelector('img').src = data.avatar;

  // Badge
  const badge = byId('memberBadge');
  if (badge) {
    badge.querySelector('span').textContent = data.badgeText;
    badge.querySelector('img').src = data.badgeIcon;
    badge.style.background = data.badgeGradient;
    badge.style.fontSize = data.badgeFontSize || '14px';
    badge.style.filter = data.badgeDropShadow || 'none';
    badge.style.gap = data.badgeGap || '4px';
    // Allow badge to grow beyond CSS fixed width (e.g. V4 "Day Pass Activated")
    badge.style.width = data.badgeWidth !== undefined ? data.badgeWidth : '';
    badge.style.justifyContent = data.badgeJustify !== undefined ? data.badgeJustify : '';
  }

  // Get Around section title + cards
  const titleEl = byId('getAroundTitle');
  if (titleEl) titleEl.textContent = data.sectionTitle;

  const getAroundSection = bySection('getAround');
  if (getAroundSection) {
    const row = getAroundSection.querySelector('.h-scroll-row');
    if (row) {
      row.innerHTML = data.cards.map(c => `
        <div class="place-card tappable">
          <div class="place-card-thumb"><img src="${c.image}" alt="${c.name}"></div>
          <div class="place-card-info">
            <p class="place-card-name">${c.name}</p>
            <div class="place-card-distance">
              <img src="assets/icons/distance.svg" alt="" width="8" height="8">
              <span>${c.distance}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  // Offers
  const offersSection = bySection('offers');
  if (offersSection) {
    const row = offersSection.querySelector('.h-scroll-row');
    if (row) {
      row.innerHTML = data.offers.map(o => {
        if (o.type === 'banner') {
          return `<div class="offer-card offer-card--banner tappable"><img src="${o.image}" alt="Offer"></div>`;
        } else if (o.type === 'tonight') {
          return `<div class="offer-card offer-card--tonight tappable">
            <div class="offer-tag">Tonight</div>
            <div class="offer-content">
              <p class="offer-title">Riverside night market</p>
              <p class="offer-subtitle">Asiatique drop-off</p>
            </div>
          </div>`;
        } else if (o.type === 'daypass') {
          return `<div class="offer-card offer-card--daypass tappable"><img src="${o.image}" alt="Day Pass"></div>`;
        } else if (o.type === 'weekend') {
          return `<div class="offer-card offer-card--weekend tappable">
            <div class="offer-tag">Weekend</div>
            <div class="offer-content">
              <p class="offer-title">Bang Saen beach shuttle</p>
              <p class="offer-subtitle">Weekend escape</p>
            </div>
          </div>`;
        }
        return '';
      }).join('');
    }
  }

  // Re-init draggables for new content
  initDraggables();
}

function hideAllVariationSections() {
  const goAgain = bySection('goAgain');
  const savedPlaces = bySection('savedPlaces');
  if (goAgain) goAgain.style.display = 'none';
  if (savedPlaces) savedPlaces.style.display = 'none';
  // Restore area selector (hidden only in V4)
  const areaSelector = document.querySelector('.area-selector');
  if (areaSelector) areaSelector.style.display = '';
  // Reset user-details width (widened for V4)
  const userDetails = document.querySelector('.user-details');
  if (userDetails) userDetails.style.width = '';
}

const variationAppliers = {
  1: function() {
    hideAllVariationSections();
    applyVariationData(V1_DATA);
  },
  2: function() {
    hideAllVariationSections();
    const goAgain = bySection('goAgain');
    if (goAgain) goAgain.style.display = 'flex';
    applyVariationData(V2_DATA);
  },
  3: function() {
    hideAllVariationSections();
    const savedPlaces = bySection('savedPlaces');
    if (savedPlaces) savedPlaces.style.display = 'flex';
    applyVariationData(V3_DATA);
  },
  4: function() {
    hideAllVariationSections();
    const areaSelector = document.querySelector('.area-selector');
    if (areaSelector) areaSelector.style.display = 'none';
    const userDetails = document.querySelector('.user-details');
    if (userDetails) userDetails.style.width = 'auto';
    applyVariationData(V4_DATA);
  },
};

/* =========================================================
   HOP-POINT INFO DIALOG (reused from service-selection)
   ========================================================= */

let currentPlace = null; // { name, distance, image }

/* Mock hop-point data per place — maps place name to nearby hop-point info */
const PLACE_HP_DATA = {
  /* Get Around / Happy Hour */
  'The Temple of the Emerald Buddha (Wat Phra Kaew)': { letter: 'A', type: 'Hop-point', desc: 'Nearest drop-off point to the temple entrance.', photos: ['place-wat-phra-kaew.png'] },
  'Grand Palace':            { letter: 'B', type: 'Hop-point', desc: 'Drop-off at the Grand Palace main gate.',       photos: ['place-grand-palace.png'] },
  'Democracy Monument':      { letter: 'C', type: 'Hop-point', desc: 'Drop-off near Democracy Monument.',             photos: ['place-democracy.png'] },
  'The Coffee Club':         { letter: 'A', type: 'Hop-point', desc: 'Nearest hop-point to The Coffee Club.',         photos: ['place-coffee-club.png'] },
  'Siam Paragon Mall':       { letter: 'B', type: 'Hop-point', desc: 'Drop-off at Siam Paragon main entrance.',       photos: ['place-siam-paragon.png'] },
  'Som Tam Nua Restaurant':  { letter: 'C', type: 'Hop-point', desc: 'Drop-off near Som Tam Nua on Siam Square.',    photos: ['place-somtam-nua.png'] },
  /* Trending */
  'Arun temple':             { letter: 'A', type: 'Hop-point', desc: 'Drop-off near Wat Arun ferry pier.',            photos: ['place-arun-temple.png'] },
  'Talad Plu':               { letter: 'B', type: 'Hop-point', desc: 'Drop-off at Talad Plu market entrance.',        photos: ['place-talad-plu.png'] },
  'Lumpini Park':            { letter: 'C', type: 'Hop-point', desc: 'Drop-off at Lumpini Park main gate.',           photos: ['place-lumpini.png'] },
  /* Go Again */
  'Phrom Phong BTS':         { letter: 'A', type: 'Hop-point', desc: 'Drop-off at Phrom Phong BTS Exit 5.',           photos: ['hoppoint-photo.png'] },
  '33 Space (Back Entrance)': { letter: 'B', type: 'Hop-point', desc: 'Drop-off at 33 Space back entrance.',          photos: ['hoppoint-photo.png'] },
  'EmQuartier':              { letter: 'D', type: 'Hop-point', desc: 'Drop-off at EmQuartier main entrance.',         photos: ['hoppoint-photo.png'] },
  /* Saved Places */
  'Home':                    { letter: 'A', type: 'Saved place', desc: 'Your saved home location.',                    photos: ['hoppoint-photo.png'] },
  'Work':                    { letter: 'B', type: 'Saved place', desc: 'Your saved work location.',                    photos: ['hoppoint-photo.png'] },
  'Gym':                     { letter: 'C', type: 'Saved place', desc: 'Your saved gym location.',                     photos: ['hoppoint-photo.png'] },
};

/* Fallback for unknown places */
const DEFAULT_HP = { letter: 'A', type: 'Hop-point', desc: 'Nearest hop-point to this location.', photos: ['hoppoint-photo.png'] };

function openPlaceDialog(name, distance, image) {
  currentPlace = { name, distance, image };
  const hp = PLACE_HP_DATA[name] || DEFAULT_HP;

  document.getElementById('hpInfoPinLetter').textContent = hp.letter;
  document.getElementById('hpInfoName').textContent      = name;
  document.getElementById('hpInfoType').textContent      = hp.type;
  document.getElementById('hpInfoDesc').textContent      = hp.desc;
  document.getElementById('hpInfoDist').textContent      = distance + ' from you';

  /* Photos */
  const track = document.getElementById('hpPhotosTrack');
  track.innerHTML = hp.photos.map((photo, i) => `
    <div class="hp-photo-item">
      <img src="assets/images/${photo}" alt="" draggable="false">
      ${i === 0 ? '<span class="hp-meet-badge">Drop-off here</span>' : ''}
    </div>
  `).join('');

  /* Update save button state */
  const saveBtn = document.getElementById('hpSaveBtn');
  if (saveBtn) { saveBtn.dataset.hpName = name; SaveFavorite.updateButton(name); }

  const dialog = document.getElementById('hpInfoDialog');
  dialog.classList.remove('hidden');
  dialog.classList.add('visible');

  if (typeof HoppointBanner !== 'undefined') HoppointBanner.play();
  initDraggables();
}

function closePlaceDialog() {
  const dialog = document.getElementById('hpInfoDialog');
  dialog.classList.remove('visible');
  dialog.classList.add('hidden');
  currentPlace = null;
}

function goSearchPickup() {
  sessionStorage.setItem('searchFocusField', 'pickup');
  window.location.href = 'search.html';
}

function quickSelectDestination(name) {
  localStorage.setItem('selectedDestination', name);
  const savedPickup = localStorage.getItem('selectedPickup');
  if (savedPickup) {
    const p = JSON.parse(savedPickup);
    AreaConfig.navigateToService(p.name, name);
  } else {
    window.location.href = 'select-pickup.html';
  }
}

function choosePlaceAsDestination() {
  if (!currentPlace) return;
  localStorage.setItem('selectedDestination', currentPlace.name);
  closePlaceDialog();

  /* If pickup already confirmed → service-selection, otherwise → confirm pickup first */
  const savedPickup = localStorage.getItem('selectedPickup');
  if (savedPickup) {
    const p = JSON.parse(savedPickup);
    AreaConfig.navigateToService(p.name, currentPlace.name);
  } else {
    window.location.href = 'select-pickup.html';
  }
}

/* =========================================================
   CONSOLE API — Prototype Manipulation
   ========================================================= */


const LOG_STYLE = 'background:#0D57E2;color:#fff;border-radius:4px;padding:2px 8px;font-weight:600;';
function log(msg) { console.log(`%c ${msg} `, LOG_STYLE); }

// --- set(id, value) — Change text of any data-id element ---
function set(id, value) {
  const el = byId(id);
  if (!el) {
    console.warn(`Element [data-id="${id}"] not found. Use listIds() to see available IDs.`);
    return;
  }
  // If the element has a child <span> with text, update that
  const textChild = el.querySelector('span');
  if (textChild && el.children.length > 0 && !el.classList.contains('user-phone')) {
    textChild.textContent = value;
  } else {
    el.textContent = value;
  }
  log(`set "${id}" → "${value}"`);
}

// --- show(section) / hide(section) / toggle(section) ---
function show(sectionName) {
  const el = bySection(sectionName);
  if (!el) { console.warn(`Section "${sectionName}" not found. Use listSections().`); return; }
  el.style.display = '';
  log(`Shown: ${sectionName}`);
}

function hide(sectionName) {
  const el = bySection(sectionName);
  if (!el) { console.warn(`Section "${sectionName}" not found. Use listSections().`); return; }
  el.style.display = 'none';
  log(`Hidden: ${sectionName}`);
}

function toggle(sectionName) {
  const el = bySection(sectionName);
  if (!el) { console.warn(`Section "${sectionName}" not found. Use listSections().`); return; }
  if (el.style.display === 'none') { show(sectionName); } else { hide(sectionName); }
}

// --- setArea(name) — Change the area name ---
function setArea(name) {
  set('areaName', name);
}

// --- setPickup(text) — Change pickup location ---
function setPickup(text) {
  set('pickupLocation', text);
}

// --- setUser(phone, badgeText?) — Change user info ---
function setUser(phone, badgeText) {
  if (phone) set('userPhone', phone);
  if (badgeText) {
    const badge = byId('memberBadge');
    if (badge) badge.querySelector('span').textContent = badgeText;
    log(`Badge → "${badgeText}"`);
  }
}

// --- showNotification(show?) — Toggle notification dot ---
function showNotification(visible) {
  const dot = byId('notificationDot');
  if (dot) {
    dot.style.display = visible === false ? 'none' : '';
    log(`Notification dot: ${visible === false ? 'hidden' : 'visible'}`);
  }
}

// --- setNav(active) — Switch active bottom nav ---
function setNav(name) {
  $$('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.nav === name);
  });
  log(`Active nav → ${name}`);
}

// --- addPlaceCard(section, {name, distance, image}) — Inject a place card ---
function addPlaceCard(sectionName, { name, distance, image }) {
  const section = bySection(sectionName);
  if (!section) { console.warn(`Section "${sectionName}" not found.`); return; }
  const row = section.querySelector('.h-scroll-row');
  if (!row) { console.warn(`No scroll row in section "${sectionName}".`); return; }

  const card = document.createElement('div');
  card.className = 'place-card tappable';
  card.innerHTML = `
    <div class="place-card-thumb">
      <img src="${image || 'assets/images/place-wat-phra-kaew.png'}" alt="${name}">
    </div>
    <div class="place-card-info">
      <p class="place-card-name">${name}</p>
      <div class="place-card-distance">
        <img src="assets/icons/distance.svg" alt="" width="8" height="8">
        <span>${distance || '—'}</span>
      </div>
    </div>
  `;
  row.appendChild(card);
  log(`Added card "${name}" to ${sectionName}`);
}

// --- clearCards(section) — Remove all cards from a section ---
function clearCards(sectionName) {
  const section = bySection(sectionName);
  if (!section) return;
  const row = section.querySelector('.h-scroll-row');
  if (row) row.innerHTML = '';
  log(`Cleared all cards in ${sectionName}`);
}

// --- setHeaderGradient(css) — Change header gradient ---
function setHeaderGradient(css) {
  const header = bySection('header');
  if (header) {
    header.style.background = css;
    log(`Header gradient updated`);
  }
}

// --- reset() — Reload to default state ---
function reset() {
  localStorage.removeItem('homepage-variation');
  location.reload();
}

// --- Discovery helpers ---
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
    sections.push({
      section: el.dataset.section,
      visible: el.style.display !== 'none',
      tag: el.tagName.toLowerCase()
    });
  });
  console.table(sections);
}

// --- Help ---
function printHelp() {
  console.log(`%c Muvmi Prototype Console `, 'background:#0D57E2;color:#fff;font-size:14px;border-radius:6px;padding:4px 12px;font-weight:700;');
  console.log(`
%cVariations%c
  setVariation(n)          Switch variation (1–4)
  getVariation()           Show current variation

%cContent%c
  set(id, value)           Change any text element
  setUser(phone, badge?)   Update user info
  setArea(name)            Change area name
  setPickup(text)          Change pickup location
  showNotification(bool)   Show/hide notification dot

%cSections%c
  show(section)            Show a section
  hide(section)            Hide a section
  toggle(section)          Toggle section visibility

%cCards%c
  addPlaceCard(section, {name, distance, image})
  clearCards(section)       Remove all cards

%cLayout%c
  setHeaderGradient(css)   Change header gradient
  setNav(name)             Switch active nav tab

%cDiscovery%c
  listIds()                List all data-id elements
  listSections()           List all sections
  help()                   Show this message

%cReset%c
  reset()                  Reload default state
`,
    'color:#0D57E2;font-weight:700','',
    'color:#0D57E2;font-weight:700','',
    'color:#0D57E2;font-weight:700','',
    'color:#0D57E2;font-weight:700','',
    'color:#0D57E2;font-weight:700','',
    'color:#0D57E2;font-weight:700','',
    'color:#0D57E2;font-weight:700',''
  );
}

/* =========================================================
   EXPOSE ALL TO WINDOW
   ========================================================= */
Object.assign(window, {
  setVariation, getVariation: () => {
    console.log(`Current: Variation ${currentVariation} (${VARIATIONS[currentVariation].name})`);
    console.table(Object.entries(VARIATIONS).map(([k, v]) => ({
      '#': k, Name: v.name, Active: Number(k) === currentVariation ? 'yes' : ''
    })));
    return currentVariation;
  },
  set, show, hide, toggle,
  setArea, setPickup, setUser, showNotification,
  setNav, addPlaceCard, clearCards,
  goSearchPickup, openPlaceDialog, closePlaceDialog, choosePlaceAsDestination, renderSavedPlaces,
  setHeaderGradient, reset,
  listIds, listSections,
  help: printHelp
});
