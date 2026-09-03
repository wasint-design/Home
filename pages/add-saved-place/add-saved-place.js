/* ========================================
   Add Saved Place — Logic
   ======================================== */

const RECENT_PLACES = [
  { name: '33 Space (Back Entrance)',                                     dist: '900 m',  zone: 'Rattanakosin', zoneActive: true  },
  { name: 'Siam Center',                                                 dist: '900 m',  zone: 'Rattanakosin', zoneActive: true  },
  { name: 'Bus stop at Kasetsart vehicle department (Vibhavadi Road)',    dist: '1.2 km', zone: 'Sukhumvit',    zoneActive: false },
  { name: 'Bus stop at Kasetsart vehicle department (Vibhavadi Road)',    dist: '1.2 km', zone: 'Sukhumvit',    zoneActive: false },
  { name: 'Bus stop at Kasetsart vehicle department (Vibhavadi Road)',    dist: '1.2 km', zone: 'Sukhumvit',    zoneActive: false },
];

const NEARBY_PLACES = [
  { name: '33 Space (Back Entrance)',                                     dist: '900 m',  zone: 'Rattanakosin', zoneActive: true  },
  { name: 'Siam Center',                                                 dist: '900 m',  zone: 'Rattanakosin', zoneActive: true  },
  { name: 'Bus stop at Kasetsart vehicle department (Vibhavadi Road)',    dist: '1.2 km', zone: 'Sukhumvit',    zoneActive: false },
];

/* All places combined for search filtering */
const ALL_PLACES = [...RECENT_PLACES, ...NEARBY_PLACES];

function renderHpItem(p) {
  const zoneClass = p.zoneActive ? 'active' : 'disabled';
  const zoneIcon  = p.zoneActive ? 'zone-icon-active.svg' : 'zone-icon-disabled.svg';
  const escaped = p.name.replace(/'/g, "\\'");
  return `
    <div class="asp-item tappable" onclick="selectPlace('${escaped}')">
      <div class="asp-item-icon">
        <img src="assets/icons/hop-point-saved.svg" alt="">
      </div>
      <div class="asp-item-info">
        <span class="asp-item-name">${p.name}</span>
        <div class="asp-item-meta">
          <span class="asp-item-dist">${p.dist}</span>
          <div class="asp-zone-tag ${zoneClass}">
            <div class="asp-zone-icon">
              <img src="assets/icons/${zoneIcon}" alt="" width="13" height="13">
            </div>
            <span class="asp-zone-name">${p.zone}</span>
          </div>
        </div>
      </div>
    </div>`;
}

function renderLists() {
  document.getElementById('aspRecentList').innerHTML = RECENT_PLACES.map(renderHpItem).join('');
  document.getElementById('aspNearbyList').innerHTML = NEARBY_PLACES.map(renderHpItem).join('');
}

/* =========================================================
   SEARCH BEHAVIOR
   ========================================================= */

function filterPlaces(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  /* Deduplicate by name */
  const seen = new Set();
  return ALL_PLACES.filter(p => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return p.name.toLowerCase().includes(q) || p.zone.toLowerCase().includes(q);
  });
}

function handleSearchInput() {
  const input = document.getElementById('aspSearchInput');
  const query = input.value.trim();
  const recentSection = document.getElementById('aspRecent');
  const nearbySection = document.getElementById('aspNearby');
  const resultsSection = document.getElementById('aspResults');

  if (query.length > 0) {
    recentSection.style.display = 'none';
    nearbySection.style.display = 'none';
    resultsSection.style.display = '';

    const results = filterPlaces(query);
    const resultsList = document.getElementById('aspResultsList');
    if (results.length > 0) {
      resultsList.innerHTML = results.map(renderHpItem).join('');
    } else {
      resultsList.innerHTML = '<p style="padding:16px;color:#909090;font-size:14px;">No results found</p>';
    }
  } else {
    recentSection.style.display = '';
    nearbySection.style.display = '';
    resultsSection.style.display = 'none';
  }
}

/* =========================================================
   HOP-POINT INFO DIALOG
   ========================================================= */

/* Extra info for demo hop-points */
const HP_INFO = {
  '33 Space (Back Entrance)':  { type: 'Street',      desc: 'On the corner of Sukhumvit Soi 31, opposite the 7-Eleven entrance',        photos: ['hoppoint-photo.png', 'place-lumpini.png', 'place-siam-paragon.png'] },
  'Siam Center':               { type: 'Mall',        desc: 'In front of Siam Center main entrance on Rama I Road',                      photos: ['place-siam-paragon.png', 'hoppoint-photo.png', 'place-grand-palace.png'] },
  'Bus stop at Kasetsart vehicle department (Vibhavadi Road)': { type: 'BTS Station', desc: 'At the bus stop near Kasetsart intersection, Vibhavadi Road side', photos: ['place-grand-palace.png', 'hoppoint-photo.png', 'place-lumpini.png'] },
};

let currentHpName = null;

function selectPlace(hpName) {
  currentHpName = hpName;
  const info = HP_INFO[hpName] || { type: 'Street', desc: hpName, photos: ['hoppoint-photo.png'] };

  document.getElementById('hpInfoName').textContent = hpName;
  document.getElementById('hpInfoType').textContent = info.type;
  document.getElementById('hpInfoDesc').textContent = info.desc;

  /* Find distance from list data */
  const place = ALL_PLACES.find(p => p.name === hpName);
  document.getElementById('hpInfoDist').textContent = (place ? place.dist : '') + ' from you';

  /* Photo carousel */
  const track = document.getElementById('hpPhotosTrack');
  track.innerHTML = info.photos.map((photo, i) => `
    <div class="hp-photo-item">
      <img src="assets/images/${photo}" alt="" draggable="false">
      ${i === 0 ? '<span class="hp-meet-badge">Let\'s meet here</span>' : ''}
    </div>
  `).join('');

  /* Show dialog */
  const dialog = document.getElementById('hpInfoDialog');
  dialog.classList.remove('hidden');
  dialog.classList.add('visible');
}

function closeHpInfo() {
  const dialog = document.getElementById('hpInfoDialog');
  dialog.classList.remove('visible');
  dialog.classList.add('hidden');
  currentHpName = null;
}

function saveFromDialog() {
  if (currentHpName) {
    window.location.href = 'edit-saved-place.html?hpName=' + encodeURIComponent(currentHpName) + '&mode=new';
  }
}

/* =========================================================
   INIT
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  renderLists();
  initDraggables();

  const input = document.getElementById('aspSearchInput');
  if (input) {
    input.addEventListener('input', handleSearchInput);
    input.focus();
  }
});
