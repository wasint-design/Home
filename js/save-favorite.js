/* ========================================
   Save Favorite — Shared Logic
   Used on all pages with hop-point dialog
   ======================================== */

const SaveFavorite = (function () {
  const STORAGE_KEY = 'savedFavorites';
  const LABELS = [
    { id: 'bookmark', icon: 'assets/icons/save-label-bookmark.svg' },
    { id: 'gym',      icon: 'assets/icons/save-label-home.svg'     },
    { id: 'home',     icon: 'assets/icons/save-label-office.svg'   },
    { id: 'office',   icon: 'assets/icons/save-label-gym.svg'      },
    { id: 'train',    icon: 'assets/icons/save-label-train.svg'    },
    { id: 'school',   icon: 'assets/icons/save-label-school.svg'   },
  ];

  let currentHpName = '';
  let selectedLabel = 'bookmark';
  let sheetEl = null;

  /* ── localStorage helpers ── */
  function getAll() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (e) { return []; }
  }

  function save(entry) {
    const list = getAll().filter(e => e.hpName !== entry.hpName);
    list.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function isSaved(hpName) {
    return getAll().some(e => e.hpName === hpName);
  }

  /* ── Inject bottom sheet HTML (once) ── */
  function ensureSheet() {
    if (sheetEl) return;
    const html = `
      <div id="saveSheetOverlay" class="save-sheet-overlay hidden">
        <div class="save-sheet-backdrop" onclick="SaveFavorite.closeSheet()"></div>
        <div class="save-sheet">
          <div class="save-sheet-header">
            <span class="save-sheet-title">Save your favorite place</span>
            <button class="save-sheet-close tappable" onclick="SaveFavorite.closeSheet()">
              <img src="assets/icons/x-close.svg" alt="Close" width="20" height="20">
            </button>
          </div>
          <div class="save-sheet-body">
            <div class="save-sheet-hp-card">
              <div class="save-sheet-hp-icon">
                <img src="assets/icons/hop-point-list.svg" alt="" width="14" height="19">
              </div>
              <span class="save-sheet-hp-name" id="saveSheetHpName"></span>
            </div>
            <div class="save-sheet-field">
              <span class="save-sheet-label">Address name</span>
              <input type="text" class="save-sheet-input" id="saveSheetNameInput"
                     placeholder="Name" autocomplete="off" autocorrect="off" spellcheck="false">
            </div>
            <div class="save-sheet-field">
              <span class="save-sheet-label">Label</span>
              <div class="save-sheet-labels" id="saveSheetLabels"></div>
            </div>
          </div>
          <div class="save-sheet-footer">
            <div class="save-sheet-cta-wrap">
              <button class="save-sheet-cta tappable" onclick="SaveFavorite.confirmSave()">Save</button>
            </div>
            <div class="home-indicator"><div class="home-indicator-bar"></div></div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
    sheetEl = document.getElementById('saveSheetOverlay');

    /* Render label buttons */
    const labelsRow = document.getElementById('saveSheetLabels');
    labelsRow.innerHTML = LABELS.map(l =>
      `<button class="save-label-btn tappable${l.id === 'bookmark' ? ' active' : ''}"
              data-label="${l.id}" onclick="SaveFavorite.selectLabel('${l.id}')">
        <img src="${l.icon}" alt="" width="18" height="18">
      </button>`
    ).join('');
  }

  /* ── Update save button state in dialog ── */
  function updateButton(hpName) {
    const btn = document.getElementById('hpSaveBtn');
    if (!btn) return;
    const saved = isSaved(hpName);
    btn.classList.toggle('saved', saved);
    btn.querySelector('span').textContent = saved ? 'Saved' : 'Save';
  }

  /* ── Public API ── */
  function openSheet(hpName) {
    ensureSheet();
    currentHpName = hpName;
    selectedLabel = 'bookmark';

    document.getElementById('saveSheetHpName').textContent = hpName;
    document.getElementById('saveSheetNameInput').value = '';

    /* Reset label selection */
    sheetEl.querySelectorAll('.save-label-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.label === 'bookmark');
    });

    sheetEl.classList.remove('hidden');
  }

  function closeSheet() {
    if (sheetEl) sheetEl.classList.add('hidden');
  }

  function selectLabel(labelId) {
    selectedLabel = labelId;
    sheetEl.querySelectorAll('.save-label-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.label === labelId);
    });
  }

  function confirmSave() {
    const nameInput = document.getElementById('saveSheetNameInput');
    const addressName = nameInput.value.trim() || currentHpName;

    save({
      hpName: currentHpName,
      addressName: addressName,
      label: selectedLabel,
      savedAt: Date.now(),
    });

    closeSheet();
    updateButton(currentHpName);

    /* Update saved places on home page if available */
    if (typeof renderSavedPlaces === 'function') renderSavedPlaces();
  }

  /* Called when save button in dialog is tapped */
  function onSaveClick(hpName) {
    if (isSaved(hpName)) {
      editEntry(hpName);
      return;
    }
    openSheet(hpName);
  }

  /* Edit an existing saved entry — prefill sheet with stored data.
     Accepts either an hpName string (looks up localStorage) or a full entry object. */
  function editEntry(entryOrHpName) {
    let entry;
    if (typeof entryOrHpName === 'object' && entryOrHpName !== null) {
      entry = entryOrHpName;
    } else {
      entry = getAll().find(e => e.hpName === entryOrHpName);
    }
    if (!entry) return;

    ensureSheet();
    currentHpName = entry.hpName;
    selectedLabel = entry.label || 'bookmark';

    document.getElementById('saveSheetHpName').textContent = entry.hpName;
    document.getElementById('saveSheetNameInput').value = entry.addressName || '';

    /* Highlight the saved label */
    sheetEl.querySelectorAll('.save-label-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.label === selectedLabel);
    });

    sheetEl.classList.remove('hidden');
  }

  return {
    LABELS,
    openSheet,
    closeSheet,
    selectLabel,
    confirmSave,
    onSaveClick,
    editEntry,
    updateButton,
    isSaved,
    getAll,
  };
})();
