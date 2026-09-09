/* ========================================
   Area Config — Shared area/route logic
   ======================================== */

const AreaConfig = (function () {
  /* User's current area */
  const USER_AREA = 'Sukhumvit';

  /* Area availability schedule (mock) */
  const AREA_SCHEDULE = {
    Sukhumvit:    { available: true,  hours: '6:00 - 22:00' },
    Rattanakosin: { available: false, hours: '9:00 - 15:00' },
  };

  /* Place → area mapping */
  const PLACE_AREAS = {
    /* Sukhumvit area (active — user is here) */
    'Emquatiers main entrance':           'Sukhumvit',
    'EmQuartier Hop-point':               'Sukhumvit',
    'Siam Paragon':                       'Sukhumvit',
    'Siam Paragon Mall':                  'Sukhumvit',
    'Siam Center':                        'Sukhumvit',
    'Asok Station · Hop-point 3':         'Sukhumvit',
    'Asok Station · Hop-point':           'Sukhumvit',
    'Sukhumvit Soi 22 · Hop-point 1':     'Sukhumvit',
    'Sukhumvit Soi 22 · Hop-point':       'Sukhumvit',
    'Sukhumvit Soi 20 · Hop-point 2':     'Sukhumvit',
    'Sukhumvit Soi 18 · Hop-point 5':     'Sukhumvit',
    'Phrom Phong BTS':                    'Sukhumvit',
    'Terminal 21':                        'Sukhumvit',
    'The Coffee Club':                    'Sukhumvit',
    'The Coffee Club · Hop-point':        'Sukhumvit',
    'Som Tam Nua Restaurant':             'Sukhumvit',
    'BTS Siam (Exit 3)':                  'Sukhumvit',
    'Siam Center (Main Entrance)':        'Sukhumvit',
    'Siam Paragon (Main Entrance)':       'Sukhumvit',
    'Siam Paragon (Back Gate, Rama I)':   'Sukhumvit',
    'Siam Paragon (Parking Entrance B)':  'Sukhumvit',
    'Siam Paragon (Parking Entrance C)':  'Sukhumvit',
    'Siam Paragon (Parking Entrance D)':  'Sukhumvit',
    'Siam Paragon Exit A':                'Sukhumvit',
    '33 Space (Back Entrance)':           'Sukhumvit',
    'Lumpini Park':                       'Sukhumvit',
    'Lumpini Park · Hop-point':           'Sukhumvit',
    'Talad Plu':                          'Sukhumvit',
    'Bangkok Art Museum':                 'Sukhumvit',

    /* Rattanakosin area (inactive — user can't travel now) */
    'The Temple of the Emerald Buddha (Wat Phra Kaew)': 'Rattanakosin',
    'Grand Palace':                       'Rattanakosin',
    'Democracy Monument':                 'Rattanakosin',
    'Arun temple':                        'Rattanakosin',
    'Bus stop at Kasetsart vehicle department (Vibhavadi Road)': 'Rattanakosin',
  };

  function getArea(placeName) {
    return PLACE_AREAS[placeName] || USER_AREA;
  }

  function isAvailable(areaName) {
    const info = AREA_SCHEDULE[areaName];
    return info ? info.available : true;
  }

  function getSchedule(areaName) {
    const info = AREA_SCHEDULE[areaName];
    return info ? info.hours : '';
  }

  /**
   * Check if a route between pickup and dropoff is available.
   * Returns { ok, pickupArea, dropoffArea, schedule }
   */
  function checkRoute(pickupName, dropoffName) {
    const pickupArea  = getArea(pickupName);
    const dropoffArea = getArea(dropoffName);
    const crossArea   = pickupArea !== dropoffArea;
    const unavailableArea = crossArea
      ? (!isAvailable(pickupArea) ? pickupArea : (!isAvailable(dropoffArea) ? dropoffArea : null))
      : null;

    return {
      ok: !crossArea || !unavailableArea,
      pickupName,
      dropoffName,
      pickupArea,
      dropoffArea,
      schedule: unavailableArea ? getSchedule(unavailableArea) : '',
    };
  }

  /**
   * Navigate to service-selection or route-unavailable based on route check.
   * Call this instead of directly navigating to service-selection.html.
   */
  function navigateToService(pickupName, dropoffName) {
    const result = checkRoute(pickupName, dropoffName);
    if (result.ok) {
      window.location.href = 'service-selection.html';
    } else {
      sessionStorage.setItem('routeCheck', JSON.stringify(result));
      window.location.href = 'route-unavailable.html';
    }
  }

  return {
    USER_AREA,
    getArea,
    isAvailable,
    getSchedule,
    checkRoute,
    navigateToService,
  };
})();
