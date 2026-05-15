import { signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { ref, onValue, set, update }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import {
  auth, db, tables,
  guestData, guestsByTable, arrivedGuests,
  guestKey, sortTableIds, toKey,
  loadGuestData, rebuildArrivedSet, fbSetCheckin,
} from './firebase.js';

let selectedTable   = null;
let showMissingOnly = false;
let pendingCheckins = new Set();

// ─── WRITE HELPERS ────────────────────────────────────────────────────────────
async function fbSetCheckinMulti(keys, value) {
  const updates = {};
  keys.forEach(k => { updates[`checkins/${toKey(k.split('|')[1])}`] = value; });
  await update(ref(db), updates);
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function showLoginScreen(errorMsg) {
  document.querySelector('header').style.display = 'none';
  document.querySelector('.layout').style.display = 'none';

  let existing = document.getElementById('auth-screen');
  if (existing) existing.remove();

  const screen = document.createElement('div');
  screen.id = 'auth-screen';
  screen.className = 'auth-screen';
  screen.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-heading">
        <div class="auth-eyebrow">Admin Access</div>
        <div class="auth-title">Tristan <span>&</span> Regina</div>
        <div class="auth-subtitle">Wedding Seating — 31 May 2026</div>
      </div>
      <div class="auth-card">
        <div class="auth-hint">Sign in to access the admin panel</div>
        <input id="login-email" type="email" placeholder="Email address" autocomplete="email" class="auth-input">
        <input id="login-password" type="password" placeholder="Password" autocomplete="current-password" class="auth-input">
        ${errorMsg ? `<div class="auth-error">${errorMsg}</div>` : ''}
        <button id="login-btn" class="auth-submit">Sign in</button>
      </div>
    </div>`;
  document.body.appendChild(screen);

  const emailEl = screen.querySelector('#login-email');
  const passEl  = screen.querySelector('#login-password');
  const btn     = screen.querySelector('#login-btn');

  const doLogin = async () => {
    const email = emailEl.value.trim();
    const pass  = passEl.value;
    if (!email || !pass) return;
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      const msg = e.code === 'auth/invalid-credential'
        ? 'Incorrect email or password.'
        : 'Sign-in failed. Please try again.';
      showLoginScreen(msg);
    }
  };

  btn.addEventListener('click', doLogin);
  passEl.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  emailEl.focus();
}

// ─── ADMIN BOOT ───────────────────────────────────────────────────────────────
async function bootAdmin() {
  document.querySelector('header').style.display = '';
  document.querySelector('.layout').style.display = '';

  if (!document.getElementById('signout-btn')) {
    const btn = document.createElement('button');
    btn.id = 'signout-btn';
    btn.className = 'btn';
    btn.textContent = 'Sign out';
    btn.onclick = () => signOut(auth);
    document.querySelector('.header-actions').appendChild(btn);
  }

  await loadGuestData();

  onValue(ref(db, 'checkins'), snap => {
    rebuildArrivedSet(snap);
    renderGuests();
    updateStats();
    if (selectedTable) updateTableRatio(selectedTable);
  });

  initBallroom();
  renderGuests();
  scaleBallroom();
  window.addEventListener('resize', scaleBallroom);

  document.getElementById('searchInput').addEventListener('blur', () => {
    document.getElementById('adminAutocomplete').style.display = 'none';
  });
}

// ─── FLOOR PLAN ───────────────────────────────────────────────────────────────
function initBallroom() {
  const ballroom = document.getElementById('ballroom');
  tables.forEach(t => {
    const guests = guestsByTable[t.id] || [];
    const type = guests.length === 0 ? 'empty' : t.type;

    const ring = document.createElement('div');
    ring.className = 'chair-ring';
    ring.style.left = t.cx + 'px';
    ring.style.top = t.cy + 'px';

    const numChairs = Math.max(8, guests.length);
    for (let i = 0; i < numChairs; i++) {
      const angle = (i / numChairs) * 2 * Math.PI - Math.PI / 2;
      const r = 38;
      const dot = document.createElement('div');
      dot.style.cssText = `
        position:absolute;
        width:8px;height:8px;border-radius:50%;
        background:${type === 'vip' ? '#d4a83a' : type === 'empty' ? '#a0b4bc' : '#3a9a86'};
        opacity:0.5;
        left:${44 + r * Math.cos(angle) - 4}px;
        top:${44 + r * Math.sin(angle) - 4}px;
      `;
      ring.appendChild(dot);
    }
    ballroom.appendChild(ring);

    const el = document.createElement('div');
    el.className = `table ${type}`;
    el.style.left = t.cx + 'px';
    el.style.top = t.cy + 'px';
    el.dataset.tableId = t.id;
    el.onclick = () => selectTable(t.id);

    const label = document.createElement('div');
    label.className = 'table-label';
    label.innerHTML = t.id === 'VIP 1' ? 'VIP<br>1' : t.id;
    el.appendChild(label);

    const ratio = document.createElement('div');
    ratio.className = 'table-ratio';
    ratio.dataset.ratioFor = t.id;
    el.appendChild(ratio);

    ballroom.appendChild(el);
  });
}

function scaleBallroom() {
  if (window.innerWidth <= 768) return;
  const wrap = document.getElementById('canvasWrap');
  const scaler = document.getElementById('ballroomScaler');
  const ballroom = document.getElementById('ballroom');
  if (!wrap || !scaler || !ballroom) return;

  const BALLROOM_W = 580;
  const BALLROOM_H = 860;
  const PAD = 48;

  const availW = wrap.clientWidth - PAD;
  const availH = wrap.clientHeight - PAD;

  const scaleW = availW / BALLROOM_W;
  const scaleH = availH / BALLROOM_H;
  const scale = Math.min(scaleW, scaleH, 1);

  ballroom.style.transformOrigin = 'top center';
  ballroom.style.transform = `scale(${scale})`;

  scaler.style.width = Math.round(BALLROOM_W * scale) + 'px';
  scaler.style.height = Math.round(BALLROOM_H * scale) + 'px';
  scaler.style.overflow = 'visible';
}

// ─── GUEST LIST ───────────────────────────────────────────────────────────────
function toggleMissing() {
  showMissingOnly = !showMissingOnly;
  const btn = document.getElementById('missingBtn');
  btn.textContent = showMissingOnly ? 'Show All Guests' : 'Show Missing Guests';
  btn.classList.toggle('active', showMissingOnly);

  selectedTable = null;
  document.getElementById('searchInput').value = '';
  document.querySelectorAll('.table').forEach(el => el.classList.remove('selected'));

  const title = document.getElementById('sidebarTitle');
  const sub = document.getElementById('sidebarSub');
  if (showMissingOnly) {
    const missing = guestData.filter(g => !arrivedGuests.has(guestKey(g)));
    title.textContent = 'Missing Guests';
    sub.textContent = `${missing.length} not yet checked in`;
  } else {
    title.textContent = 'All Guests';
    sub.textContent = 'Click a table to filter';
  }
  renderGuests();
}

function updateTableRatio(tableId) {
  const el = document.querySelector(`[data-ratio-for="${CSS.escape(tableId)}"]`);
  if (!el) return;
  const guests = guestsByTable[tableId] || [];
  const arrived = guests.filter(g => arrivedGuests.has(guestKey(g))).length;
  el.textContent = `${arrived} / ${guests.length}`;
}

function selectTable(tableId) {
  if (showMissingOnly) {
    showMissingOnly = false;
    const btn = document.getElementById('missingBtn');
    btn.textContent = 'Show Missing Guests';
    btn.classList.remove('active');
  }

  const searchInput = document.getElementById('searchInput');

  if (selectedTable === tableId) {
    selectedTable = null;
    document.querySelectorAll('.table').forEach(el => el.classList.remove('selected'));
    searchInput.value = '';
    document.getElementById('sidebarTitle').textContent = 'All Guests';
    document.getElementById('sidebarSub').textContent = 'Click a table to filter';
    renderGuests();
    return;
  }

  searchInput.value = `Table ${tableId}`;
  filterGuests();
}

function filterGuests() {
  selectedTable = null;
  document.querySelectorAll('.table').forEach(el => el.classList.remove('selected'));

  if (showMissingOnly) {
    showMissingOnly = false;
    const btn = document.getElementById('missingBtn');
    btn.textContent = 'Show Missing Guests';
    btn.classList.remove('active');
  }

  const q = document.getElementById('searchInput').value.trim();
  const title = document.getElementById('sidebarTitle');
  const sub = document.getElementById('sidebarSub');
  const autocomplete = document.getElementById('adminAutocomplete');

  const tableMatch = q.match(/^table\s+(.+)$/i);
  if (tableMatch) {
    autocomplete.style.display = 'none';
    const tq = tableMatch[1].trim().toUpperCase();
    const allIds = [...new Set(guestData.map(g => g.table))];
    const matchedId = allIds.find(id => id.toUpperCase() === tq || id.toUpperCase() === tq.replace('VIP1','VIP 1'));
    if (matchedId) {
      document.querySelectorAll('.table').forEach(el => {
        el.classList.toggle('selected', el.dataset.tableId === matchedId);
      });
      selectedTable = matchedId;
      updateTableRatio(matchedId);
      const count = guestData.filter(g => g.table === matchedId).length;
      const arrivedCount = guestData.filter(g => g.table === matchedId && arrivedGuests.has(guestKey(g))).length;
      title.textContent = `Table ${matchedId}`;
      sub.textContent = `${count} guests · ${arrivedCount} checked in`;
    } else {
      title.textContent = 'No table found';
      sub.textContent = `"${q}"`;
    }
  } else if (q.length >= 2) {
    const matches = guestData.filter(g => g.name.toLowerCase().includes(q.toLowerCase()));
    title.textContent = 'Search results';
    sub.textContent = `${matches.length} guest${matches.length !== 1 ? 's' : ''} found`;
    const suggestions = matches.slice(0, 6);
    if (suggestions.length > 0) {
      autocomplete.innerHTML = suggestions.map(g => {
        const isVip = g.table === 'VIP 1';
        const initials = g.name.split(' ').filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join('');
        const safeName = g.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
        return `<div class="admin-autocomplete-item" onmousedown="selectAdminGuest('${safeName}')">
          <div style="width:26px;height:26px;border-radius:50%;background:${isVip?'var(--gold-light)':'var(--sage-light)'};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;color:${isVip?'var(--gold)':'var(--sage)'};">${initials}</div>
          <div style="flex:1;font-size:13px;color:var(--charcoal);">${g.name}</div>
          <div style="font-size:11px;color:var(--muted);">T${g.table}</div>
        </div>`;
      }).join('');
      autocomplete.style.display = 'block';
    } else {
      autocomplete.style.display = 'none';
    }
  } else {
    autocomplete.style.display = 'none';
    title.textContent = 'All Guests';
    sub.textContent = 'Click a table to filter';
  }
  renderGuests();
}

function renderGuests() {
  const list = document.getElementById('guestList');
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  let toShow = guestData;

  const tableMatch = q.match(/^table\s+(.+)$/i);
  if (selectedTable) {
    toShow = guestData.filter(g => g.table === selectedTable);
  } else if (tableMatch) {
    const tq = tableMatch[1].trim().toUpperCase();
    const allIds = [...new Set(guestData.map(g => g.table))];
    const matchedId = allIds.find(id => id.toUpperCase() === tq);
    toShow = matchedId ? guestData.filter(g => g.table === matchedId) : [];
  } else if (q.length >= 2) {
    toShow = guestData.filter(g => g.name.toLowerCase().includes(q));
  }

  if (showMissingOnly) {
    toShow = toShow.filter(g => !arrivedGuests.has(guestKey(g)));
  }

  if (toShow.length === 0) {
    list.innerHTML = '<div class="no-results">' + (showMissingOnly ? 'Everyone has checked in!' : 'No guests found') + '</div>';
    updateStats();
    return;
  }

  const showingAll = !selectedTable && !q;
  if (showingAll || showMissingOnly) {
    const byTable = {};
    toShow.forEach(g => {
      if (!byTable[g.table]) byTable[g.table] = [];
      byTable[g.table].push(g);
    });
    const sortedTables = Object.keys(byTable).sort(sortTableIds);
    list.innerHTML = '';
    sortedTables.forEach(tbl => {
      const allInTable = guestData.filter(g => g.table === tbl);
      const arrivedCount = allInTable.filter(g => arrivedGuests.has(guestKey(g))).length;
      const sec = document.createElement('div');
      sec.className = 'table-section-label';
      sec.textContent = showMissingOnly
        ? `Table ${tbl} · ${byTable[tbl].length} missing`
        : `Table ${tbl} · ${allInTable.length} guests · ${arrivedCount} checked in`;
      list.appendChild(sec);
      byTable[tbl].forEach(g => list.appendChild(makeGuestItem(g)));
    });
  } else {
    list.innerHTML = '';
    toShow.forEach(g => list.appendChild(makeGuestItem(g)));
  }

  updateStats();
}

function makeGuestItem(g) {
  const key = guestKey(g);
  const isVip = g.table === 'VIP 1';
  const arrived = arrivedGuests.has(key);
  const pending = pendingCheckins.has(key);

  const item = document.createElement('div');
  item.className = 'guest-item' + (arrived ? ' already-in' : '');

  const initials = g.name.split(' ').filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join('');

  const boxClass = pending ? (arrived ? 'pending-arrived' : 'pending') : '';
  const boxTitle = arrived
    ? (pending ? 'Remove from de-register selection' : 'Select to de-register')
    : (pending ? 'Remove from selection' : 'Select to check in');

  item.innerHTML = `
    <div class="select-box ${boxClass}" data-key="${key}" title="${boxTitle}">
      <svg viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="guest-avatar ${isVip ? 'vip' : ''}" style="margin-left:12px;">${initials}</div>
    <div class="guest-name">${g.name}</div>
    <div class="guest-seat">T${g.table}</div>
    <div class="checkin-cell ${arrived ? 'arrived' : ''}" data-key="${key}" title="${arrived ? 'Click to undo check-in' : 'Click to check in'}">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8.5L6.5 12L13 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  `;

  item.querySelector('.select-box').addEventListener('click', (e) => {
    e.stopPropagation();
    togglePending(key);
  });

  item.querySelector('.checkin-cell').addEventListener('click', async (e) => {
    e.stopPropagation();
    const k = e.currentTarget.dataset.key;
    const guestName = k.split('|')[1];
    if (arrivedGuests.has(k)) {
      await fbSetCheckin(guestName, false);
    } else {
      pendingCheckins.delete(k);
      await fbSetCheckin(guestName, true);
    }
    if (selectedTable === g.table) updateTableRatio(g.table);
    updateActionBar();
  });

  return item;
}

function togglePending(key) {
  if (pendingCheckins.has(key)) pendingCheckins.delete(key);
  else pendingCheckins.add(key);
  updateActionBar();
  const arrived = arrivedGuests.has(key);
  const isPending = pendingCheckins.has(key);
  document.querySelectorAll(`.select-box[data-key="${CSS.escape(key)}"]`).forEach(el => {
    el.classList.toggle('pending', isPending && !arrived);
    el.classList.toggle('pending-arrived', isPending && arrived);
  });
}

function updateActionBar() {
  const bar = document.getElementById('checkinBar');
  const label = document.getElementById('checkinBarLabel');
  const confirmBtn = document.getElementById('checkinBarConfirm');
  const alert = document.getElementById('mixedAlert');
  const n = pendingCheckins.size;

  if (n === 0) {
    bar.classList.remove('visible', 'mode-deregister', 'mode-mixed');
    alert.style.display = 'none';
    return;
  }

  bar.classList.add('visible');

  const checkedIn    = [...pendingCheckins].filter(k => arrivedGuests.has(k));
  const notCheckedIn = [...pendingCheckins].filter(k => !arrivedGuests.has(k));
  const allArrived   = checkedIn.length === n;
  const allPending   = notCheckedIn.length === n;
  const mixed        = checkedIn.length > 0 && notCheckedIn.length > 0;

  const nameOf = key => key.split('|')[1];

  if (allPending) {
    bar.classList.remove('mode-deregister', 'mode-mixed');
    label.textContent = `Check in ${n} guest${n !== 1 ? 's' : ''}`;
    confirmBtn.textContent = 'Check in';
    confirmBtn.style.opacity = '1';
    confirmBtn.style.pointerEvents = 'auto';
    alert.style.display = 'none';
  } else if (allArrived) {
    bar.classList.add('mode-deregister');
    bar.classList.remove('mode-mixed');
    label.textContent = `De-register ${n} guest${n !== 1 ? 's' : ''}`;
    confirmBtn.textContent = 'De-register';
    confirmBtn.style.opacity = '1';
    confirmBtn.style.pointerEvents = 'auto';
    alert.style.display = 'none';
  } else {
    bar.classList.add('mode-mixed');
    bar.classList.remove('mode-deregister');
    label.textContent = 'Cannot action mixed selection';
    confirmBtn.textContent = 'Action';
    confirmBtn.style.opacity = '0.35';
    confirmBtn.style.pointerEvents = 'none';

    const checkedNames = checkedIn.map(nameOf);
    const pendingNames = notCheckedIn.map(nameOf);
    alert.style.display = 'block';
    alert.innerHTML =
      `<strong style="color:#2c2c2c;">Checked in:</strong> ${checkedNames.join(', ')}<br>` +
      `<strong style="color:#2c2c2c;">Not checked in:</strong> ${pendingNames.join(', ')}<br>` +
      `<span style="color:#c0392b;font-weight:500;">No action can be taken on a mixed selection.</span>`;
  }
}

function clearPending() {
  pendingCheckins.clear();
  updateActionBar();
  renderGuests();
}

async function confirmCheckin() {
  if (pendingCheckins.size === 0) return;

  const checkedIn    = [...pendingCheckins].filter(k => arrivedGuests.has(k));
  const notCheckedIn = [...pendingCheckins].filter(k => !arrivedGuests.has(k));
  if (checkedIn.length > 0 && notCheckedIn.length > 0) return;

  if (checkedIn.length > 0) {
    await fbSetCheckinMulti(checkedIn, false);
  } else {
    await fbSetCheckinMulti(notCheckedIn, true);
  }

  pendingCheckins.clear();
  updateActionBar();
  renderGuests();

  const list = document.getElementById('guestList');
  const flash = document.createElement('div');
  flash.className = 'flash-success';
  list.style.position = 'relative';
  list.appendChild(flash);
  flash.addEventListener('animationend', () => flash.remove());
}

function updateStats() {
  const total = guestData.length;
  const arrived = arrivedGuests.size;
  document.getElementById('statsBar').innerHTML =
    `<strong>${arrived}</strong> / ${total} arrived`;
}

async function resetAll() {
  if (confirm('Reset all check-ins?')) {
    await set(ref(db, 'checkins'), null);
    pendingCheckins.clear();
    showMissingOnly = false;
    const btn = document.getElementById('missingBtn');
    if (btn) { btn.textContent = 'Show Missing Guests'; btn.classList.remove('active'); }
    updateActionBar();
  }
}

function exportData() {
  const rows = ['Table,Guest,Status'];
  const sorted = [...guestData].sort((a, b) => sortTableIds(a.table, b.table));
  sorted.forEach(g => {
    const key = guestKey(g);
    rows.push(`"${g.table}","${g.name}","${arrivedGuests.has(key) ? 'Arrived' : 'Not arrived'}"`);
  });
  const blob = new Blob([rows.join('\n')], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'seating-checkin.csv';
  a.click();
}

function showQRPanel() {
  const existing = document.getElementById('qr-panel');
  if (existing) { existing.remove(); return; }

  const panel = document.createElement('div');
  panel.id = 'qr-panel';
  panel.className = 'qr-overlay';

  const base = window.location.href.split('?')[0];
  const checkinUrl = `${base}?checkin=1`;

  panel.innerHTML = `
    <div class="qr-dialog">
      <div class="qr-dialog-header">
        <div>
          <div class="qr-dialog-title">Guest Check-in QR</div>
          <div class="qr-dialog-sub">One generic QR code for all guests to scan</div>
        </div>
        <button class="qr-dialog-close" onclick="document.getElementById('qr-panel').remove()">×</button>
      </div>
      <div class="qr-dialog-body">
        <div class="qr-url-box">
          <div class="qr-url-label">Check-in URL</div>
          <div class="qr-url-text">${checkinUrl}</div>
        </div>
        <div class="qr-desc">
          Print this URL as a QR code and display it at the venue entrance. When guests scan it, they'll be prompted to type their name — the system will find their record, show their table and tablemates, then check them in.
        </div>
        <button class="qr-copy-btn" onclick="navigator.clipboard.writeText('${checkinUrl}').then(()=>{this.textContent='Copied!';setTimeout(()=>{this.textContent='Copy link'},1500)})">Copy link</button>
        <a href="${checkinUrl}" target="_blank" class="qr-preview-link">Preview guest experience ↗</a>
      </div>
    </div>`;

  panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
  document.body.appendChild(panel);
}

// ─── TEST HARNESS ─────────────────────────────────────────────────────────────
async function runTest() {
  const shuffled = [...guestData].sort(() => Math.random() - 0.5);
  const chosen100 = shuffled.slice(0, 100);

  const updates = {};
  await set(ref(db, 'checkins'), null);
  chosen100.forEach(g => { updates[`checkins/${toKey(g.name)}`] = true; });
  await update(ref(db), updates);

  await new Promise(resolve => setTimeout(resolve, 600));

  selectedTable = null;
  document.getElementById('searchInput').value = '';
  document.querySelectorAll('.table').forEach(el => el.classList.remove('selected'));
  renderGuests();

  const results = [];
  let allPassed = true;

  const statText = document.getElementById('statsBar').textContent;
  const statMatch = statText.match(/(\d+)\s*\/\s*(\d+)/);
  const t1Pass = statMatch && parseInt(statMatch[1]) === 100 && parseInt(statMatch[2]) === guestData.length;
  results.push({ label: 'Header stat shows 100 / ' + guestData.length, pass: t1Pass, detail: 'Got: "' + statText.trim() + '"' });
  if (!t1Pass) allPassed = false;

  const allItems = document.querySelectorAll('#guestList .guest-item');
  const arrivedItems = [...allItems].filter(el => el.querySelector('.checkin-cell.arrived'));
  const t2Pass = arrivedItems.length === 100;
  results.push({ label: 'All-guest view: 100 rows show ✓ tick', pass: t2Pass, detail: 'Ticked rows visible: ' + arrivedItems.length });
  if (!t2Pass) allPassed = false;

  const notArrivedItems = [...allItems].filter(el => !el.querySelector('.checkin-cell.arrived'));
  const expectedNotArrived = guestData.length - 100;
  const t3Pass = notArrivedItems.length === expectedNotArrived;
  results.push({ label: 'All-guest view: ' + expectedNotArrived + ' rows have no tick', pass: t3Pass, detail: 'Unticked rows: ' + notArrivedItems.length });
  if (!t3Pass) allPassed = false;

  const checkedInGuest = chosen100[0];
  document.getElementById('searchInput').value = checkedInGuest.name.split(' ')[0];
  filterGuests();
  const nameFilterItems = document.querySelectorAll('#guestList .guest-item');
  const nameFilterArrived = [...nameFilterItems].filter(el => {
    const nameEl = el.querySelector('.guest-name');
    return nameEl && nameEl.textContent === checkedInGuest.name && el.querySelector('.checkin-cell.arrived');
  });
  const t4Pass = nameFilterArrived.length >= 1;
  results.push({ label: 'Name filter "' + checkedInGuest.name.split(' ')[0] + '": checked-in guest shows ✓', pass: t4Pass, detail: 'Matched checked-in rows: ' + nameFilterArrived.length });
  if (!t4Pass) allPassed = false;

  const notCheckedIn = guestData.find(g => !arrivedGuests.has(g.table + '|' + g.name));
  document.getElementById('searchInput').value = notCheckedIn.name;
  filterGuests();
  const ncItems = document.querySelectorAll('#guestList .guest-item');
  const ncArrived = [...ncItems].filter(el => el.querySelector('.checkin-cell.arrived'));
  const t5Pass = ncArrived.length === 0;
  results.push({ label: 'Name filter "' + notCheckedIn.name + '": not-arrived guest shows no tick', pass: t5Pass, detail: 'Unexpected ticked rows: ' + ncArrived.length });
  if (!t5Pass) allPassed = false;

  const testTableId = checkedInGuest.table;
  document.getElementById('searchInput').value = 'Table ' + testTableId;
  filterGuests();
  const tableItems = document.querySelectorAll('#guestList .guest-item');
  const tableArrivedExpected = guestData.filter(g => g.table === testTableId && arrivedGuests.has(g.table + '|' + g.name)).length;
  const tableArrivedVisible = [...tableItems].filter(el => el.querySelector('.checkin-cell.arrived')).length;
  const t6Pass = tableArrivedVisible === tableArrivedExpected;
  results.push({ label: 'Table filter "Table ' + testTableId + '": ticks match (expected ' + tableArrivedExpected + ')', pass: t6Pass, detail: 'Visible ticks: ' + tableArrivedVisible });
  if (!t6Pass) allPassed = false;

  const highlighted = document.querySelectorAll('.table.selected');
  const t7Pass = highlighted.length === 1 && highlighted[0].dataset.tableId === testTableId;
  results.push({ label: 'Table filter: floor plan table ' + testTableId + ' highlighted', pass: t7Pass, detail: 'Selected tables: ' + ([...highlighted].map(e => e.dataset.tableId).join(', ') || 'none') });
  if (!t7Pass) allPassed = false;

  document.getElementById('searchInput').value = '';
  selectedTable = null;
  document.querySelectorAll('.table').forEach(el => el.classList.remove('selected'));
  renderGuests();
  const sectionLabels = document.querySelectorAll('#guestList .table-section-label');
  let t8Pass = true, t8Detail = '';
  sectionLabels.forEach(sec => {
    const m = sec.textContent.match(/Table (.+?) ·.+· (\d+) checked in/);
    if (!m) return;
    const tbl = m[1].trim();
    const visibleCount = parseInt(m[2]);
    const actualCount = guestData.filter(g => g.table === tbl && arrivedGuests.has(g.table + '|' + g.name)).length;
    if (visibleCount !== actualCount) { t8Pass = false; t8Detail += 'Table ' + tbl + ': shown ' + visibleCount + ' vs actual ' + actualCount + '. '; }
  });
  if (!t8Detail) t8Detail = 'All section counts correct';
  results.push({ label: 'Section headers: checked-in counts accurate across all tables', pass: t8Pass, detail: t8Detail });
  if (!t8Pass) allPassed = false;

  const toggleGuest = chosen100[5];
  const toggleKey = toggleGuest.table + '|' + toggleGuest.name;
  document.getElementById('searchInput').value = toggleGuest.name;
  filterGuests();
  const beforeToggle = document.querySelectorAll('#guestList .checkin-cell.arrived').length;
  await fbSetCheckin(toggleGuest.name, false);
  arrivedGuests.delete(toggleKey);
  renderGuests();
  const afterToggle = document.querySelectorAll('#guestList .checkin-cell.arrived').length;
  const t9Pass = beforeToggle === 1 && afterToggle === 0;
  results.push({ label: 'Toggle: unchecking "' + toggleGuest.name + '" removes tick', pass: t9Pass, detail: 'Ticks before: ' + beforeToggle + ', after: ' + afterToggle });
  if (!t9Pass) allPassed = false;
  await fbSetCheckin(toggleGuest.name, true);
  arrivedGuests.add(toggleKey);

  const t2id = chosen100[2].table;
  document.getElementById('searchInput').value = 'Table ' + t2id;
  filterGuests();
  const subtitle = document.getElementById('sidebarSub').textContent;
  const t10Pass = subtitle.includes('checked in');
  results.push({ label: 'Table filter sidebar subtitle shows checked-in count', pass: t10Pass, detail: 'Subtitle: "' + subtitle + '"' });
  if (!t10Pass) allPassed = false;

  document.getElementById('searchInput').value = '';
  selectedTable = null;
  document.querySelectorAll('.table').forEach(el => el.classList.remove('selected'));
  renderGuests();

  const existing = document.getElementById('test-report');
  if (existing) existing.remove();

  const checkedInNames = chosen100.map(g => g.name + ' (T' + g.table + ')');
  const passCount = results.filter(r => r.pass).length;

  const report = document.createElement('div');
  report.id = 'test-report';
  report.className = 'test-report';

  const headerColor = allPassed ? '#0f6e56' : '#a32d2d';
  const headerBg = allPassed ? '#e1f5ee' : '#fcebeb';

  report.innerHTML =
    '<div style="padding:14px 18px 10px;border-bottom:1px solid #f0ede8;display:flex;align-items:center;justify-content:space-between;">' +
      '<div>' +
        '<div style="font-family:Cormorant Garamond,serif;font-size:17px;font-weight:500;color:#2c2c2c;">Test Results</div>' +
        '<div style="font-size:11px;color:#7a7a7a;margin-top:2px;">100 random guests · ' + passCount + '/' + results.length + ' assertions passed</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<div style="font-size:13px;font-weight:500;padding:3px 10px;border-radius:20px;background:' + headerBg + ';color:' + headerColor + ';">' + (allPassed ? 'ALL PASS' : 'FAILURES') + '</div>' +
        '<button onclick="document.getElementById(\'test-report\').remove()" style="border:none;background:none;cursor:pointer;font-size:20px;color:#bbb;line-height:1;padding:0 2px;">×</button>' +
      '</div>' +
    '</div>' +
    '<div style="padding:10px 18px;">' +
      results.map(function(r) {
        const ic = r.pass ? '#0f6e56' : '#a32d2d';
        const ib = r.pass ? '#e1f5ee' : '#fcebeb';
        const svg = r.pass
          ? '<path d="M3 8.5L6.5 12L13 5" stroke="#0f6e56" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
          : '<path d="M4 4L12 12M12 4L4 12" stroke="#a32d2d" stroke-width="2.5" stroke-linecap="round"/>';
        return '<div style="display:flex;gap:9px;align-items:flex-start;padding:6px 0;border-bottom:1px solid #f8f6f3;">' +
          '<div style="width:18px;height:18px;border-radius:50%;background:' + ib + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">' +
            '<svg width="10" height="10" viewBox="0 0 16 16" fill="none">' + svg + '</svg>' +
          '</div>' +
          '<div>' +
            '<div style="color:#2c2c2c;line-height:1.4;">' + r.label + '</div>' +
            '<div style="color:#9a9a9a;font-size:11px;margin-top:1px;">' + r.detail + '</div>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>' +
    '<div style="padding:10px 18px 14px;border-top:1px solid #f0ede8;">' +
      '<div style="font-size:10px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:#7a7a7a;margin-bottom:6px;">Checked-in guests (' + chosen100.length + ')</div>' +
      '<div style="font-size:11px;color:#7a7a7a;line-height:1.8;">' + checkedInNames.join(' · ') + '</div>' +
    '</div>';

  document.body.appendChild(report);
}

// Inject Run Test button
(function() {
  const actions = document.querySelector('.header-actions');
  if (!actions) return;
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = 'Run test';
  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = 'Running…';
    try { await runTest(); } finally { btn.disabled = false; btn.textContent = 'Run test'; }
  };
  actions.insertBefore(btn, actions.firstChild);
})();

// Expose functions called from inline HTML event handlers
window.toggleMissing    = toggleMissing;
window.showQRPanel      = showQRPanel;
window.resetAll         = resetAll;
window.exportData       = exportData;
window.confirmCheckin   = confirmCheckin;
window.clearPending     = clearPending;
window.filterGuests     = filterGuests;
window.selectAdminGuest = (name) => {
  document.getElementById('searchInput').value = name;
  document.getElementById('adminAutocomplete').style.display = 'none';
  filterGuests();
};
window.adminSignOut = () => signOut(auth);

// ─── BOOT ────────────────────────────────────────────────────────────────────
showLoginScreen();

onAuthStateChanged(auth, async user => {
  if (user) {
    document.getElementById('auth-screen')?.remove();
    await bootAdmin();
  } else {
    showLoginScreen();
  }
});
