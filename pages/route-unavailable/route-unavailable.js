/* ========================================
   Route Unavailable — Logic & Console API
   ======================================== */

function populateFromSession() {
  const data = sessionStorage.getItem('routeCheck');
  if (!data) return;

  try {
    const r = JSON.parse(data);
    document.getElementById('ruPickupName').textContent  = r.pickupName  || '—';
    document.getElementById('ruDropoffName').textContent  = r.dropoffName || '—';
    document.getElementById('ruPickupArea').textContent   = r.pickupArea  || '';
    document.getElementById('ruDropoffArea').textContent   = r.dropoffArea || '';
    document.getElementById('ruHours').textContent        = r.schedule    || '';

    updateBadges(r.pickupArea, r.dropoffArea);
  } catch (e) {}
}

function toggleSchedule() {
  const wrap = document.querySelector('.ru-schedule-wrap');
  const tray = document.getElementById('ruScheduleTray');
  wrap.classList.toggle('open');
  tray.classList.toggle('hidden');
}

function closePopup() {
  history.back();
}

/* =========================================================
   SCENARIOS
   ========================================================= */

function runScenario(n) {
  const title    = document.querySelector('.ru-title');
  const schedule = document.querySelector('.ru-schedule-wrap');
  const buyBtn   = document.getElementById('ruBuyPassBtn');

  if (n === 1) {
    /* Cross area — available during certain times */
    title.textContent = 'This route is available during the times below';
    schedule.style.display = '';
    buyBtn.classList.add('hidden');
    applyData('EmQuartier Hop-point', 'Grand Palace', 'Sukhumvit', 'Rattanakosin');
  } else if (n === 2) {
    /* Travel pass required */
    title.textContent = 'This route is available only with a Travel pass';
    schedule.style.display = 'none';
    buyBtn.classList.remove('hidden');
    applyData('Siam Paragon', 'Terminal 21', 'Sukhumvit', 'Rattanakosin');
  } else if (n === 3) {
    /* Route not available */
    title.textContent = 'This route is not available';
    schedule.style.display = 'none';
    buyBtn.classList.add('hidden');
    applyData('Siam Paragon', 'Terminal 21', 'Sukhumvit', 'Rattanakosin');
  }
}

function applyData(pickup, dropoff, pickupArea, dropoffArea) {
  document.getElementById('ruPickupName').textContent  = pickup;
  document.getElementById('ruDropoffName').textContent  = dropoff;
  document.getElementById('ruPickupArea').textContent   = pickupArea;
  document.getElementById('ruDropoffArea').textContent   = dropoffArea;

  const schedule = AreaConfig.getSchedule(
    AreaConfig.isAvailable(pickupArea) ? dropoffArea : pickupArea
  );
  document.getElementById('ruHours').textContent = schedule;
  updateBadges(pickupArea, dropoffArea);
}

function updateBadges(pickupArea, dropoffArea) {
  const pickupBadge  = document.getElementById('ruPickupBadge');
  const dropoffBadge = document.getElementById('ruDropoffBadge');

  if (pickupBadge) {
    const a = AreaConfig.isAvailable(pickupArea);
    pickupBadge.classList.toggle('area-badge--active', a);
    pickupBadge.classList.toggle('area-badge--inactive', !a);
    /* Swap icons */
    pickupBadge.querySelector('.area-badge-map').src = a ? 'assets/icons/map-area-active.svg' : 'assets/icons/map-area-inactive.svg';
    pickupBadge.querySelector('.area-badge-pin').src = a ? 'assets/icons/hop-point-active.svg' : 'assets/icons/hop-point-inactive.svg';
  }
  if (dropoffBadge) {
    const a = AreaConfig.isAvailable(dropoffArea);
    dropoffBadge.classList.toggle('area-badge--active', a);
    dropoffBadge.classList.toggle('area-badge--inactive', !a);
    dropoffBadge.querySelector('.area-badge-map').src = a ? 'assets/icons/map-area-active.svg' : 'assets/icons/map-area-inactive.svg';
    dropoffBadge.querySelector('.area-badge-pin').src = a ? 'assets/icons/hop-point-active.svg' : 'assets/icons/hop-point-inactive.svg';
  }
}

/* =========================================================
   INIT
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  populateFromSession();
});

window.consoleReset = function () {
  localStorage.clear();
  sessionStorage.clear();
  document.getElementById('c-panel').classList.add('hidden');
  location.reload();
};

window.runScenario = runScenario;

Object.assign(window, {
  toggleSchedule, closePopup, runScenario,
});
