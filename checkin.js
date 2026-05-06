import { signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { GUEST_PIN } from './config.js';
import {
  auth, tables,
  guestData, guestsByTable, arrivedGuests,
  guestKey, loadGuestData, fbSetCheckin,
} from './firebase.js';

// Hide the admin shell while the guest flow renders its own UI
document.querySelector('header').style.display = 'none';
document.querySelector('.layout').style.display = 'none';

document.body.style.overflow = 'auto';
document.body.style.height = 'auto';
document.body.style.background = '#faf8f4';

let resolvedGuest = null;

const overlay = document.createElement('div');
overlay.id = 'guest-overlay';
overlay.style.cssText = 'min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:0 0 48px;';
document.body.appendChild(overlay);

// ─── FUZZY MATCH ──────────────────────────────────────────────────────────────
function levenshtein(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  const m = a.length, n = b.length;
  const dp = Array.from({length:m+1}, (_,i) => Array.from({length:n+1}, (_,j) => i===0?j:j===0?i:0));
  for (let i=1;i<=m;i++) for (let j=1;j<=n;j++)
    dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}

function findMatches(query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const cleanWord = w => w.replace(/[(),.'"]/g,'');
  const scored = guestData.map(g => {
    const words = g.name.toLowerCase().split(' ').map(cleanWord).filter(Boolean);
    let score;
    if (words.some(w => w.includes(q))) score = 0;
    else score = Math.min(...words.map(w => levenshtein(q, w)));
    return { g, score };
  });
  return scored.filter(({score}) => score < 2).sort((a,b) => a.score-b.score).slice(0,6).map(({g}) => g);
}

const eventHeader = `
  <div style="text-align:center;padding:48px 0 28px;">
    <div style="font-family:'Cormorant Garamond',serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#b8935a;margin-bottom:10px;">Welcome to</div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:400;color:#2c2c2c;line-height:1.2;">Tristan <span style="font-style:italic;color:#b8935a;">&amp;</span> Regina</div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:13px;color:#7a7a7a;margin-top:6px;letter-spacing:0.04em;">Saturday, 2 May 2026</div>
  </div>`;

// ─── SCREEN -1: PIN ───────────────────────────────────────────────────────────
let pinDigits = [];

function renderPin(errorMsg) {
  const boxes = [0,1,2,3].map(i =>
    `<div class="pin-box ${i < pinDigits.length ? 'filled' : ''}">${i < pinDigits.length ? '●' : ''}</div>`
  ).join('');

  overlay.innerHTML = `
    <div style="width:100%;max-width:380px;padding:0 20px;">
      ${eventHeader}
      <div style="background:white;border:1px solid #e8e4de;border-radius:16px;padding:24px;margin-bottom:16px;text-align:center;">
        <div style="font-size:13px;font-weight:500;color:#2c2c2c;margin-bottom:4px;">Enter event PIN</div>
        <div style="font-size:12px;color:#7a7a7a;margin-bottom:20px;">Your PIN is on your invitation.</div>
        <div class="pin-boxes">${boxes}</div>
        ${errorMsg ? `<div style="font-size:12px;color:#c0392b;margin-bottom:16px;padding:8px 12px;background:#fdf0ee;border-radius:8px;">${errorMsg}</div>` : ''}
        <div class="numpad">
          ${['1','2','3','4','5','6','7','8','9','','0','⌫'].map(k =>
            k === '' ? `<div class="numpad-key empty"></div>` :
            `<button class="numpad-key${k==='⌫'?' backspace':''}" onclick="numpadPress('${k}')">${k}</button>`
          ).join('')}
        </div>
      </div>
    </div>`;

  window.numpadPress = function(key) {
    if (key === '⌫') {
      pinDigits.pop();
      renderPin();
      return;
    }
    if (pinDigits.length >= 4) return;
    pinDigits.push(key);
    if (pinDigits.length === 4) {
      const pin = pinDigits.join('');
      pinDigits = [];
      if (pin === GUEST_PIN) {
        loadGuestsThenSearch();
      } else {
        renderPin('Incorrect PIN. Please try again.');
      }
      return;
    }
    renderPin();
  };
}

async function loadGuestsThenSearch() {
  if (guestData.length === 0) {
    overlay.innerHTML = `<div style="padding:80px 20px;text-align:center;color:#7a7a7a;font-size:14px;">Loading guest list…</div>`;
    await signInAnonymously(auth);
    await loadGuestData();
  }
  renderSearch();
}

// ─── SCREEN 0: Name search ────────────────────────────────────────────────────
function renderSearch(prefill) {
  overlay.innerHTML = `
    <div style="width:100%;max-width:420px;padding:0 20px;">
      ${eventHeader}
      <div style="background:white;border:1px solid #e8e4de;border-radius:16px;padding:24px;margin-bottom:16px;">
        <div style="font-size:13px;font-weight:500;color:#2c2c2c;margin-bottom:6px;">Your name</div>
        <div style="font-size:12px;color:#7a7a7a;margin-bottom:16px;">Type your name as it appears on your invitation.</div>
        <input id="nameInput" type="text" autocomplete="off" autocorrect="off" spellcheck="false"
          placeholder="e.g. Tony Siew" value="${prefill||''}"
          style="width:100%;padding:13px 14px;font-family:'DM Sans',sans-serif;font-size:15px;border:1.5px solid #e0dbd4;border-radius:10px;background:#faf8f4;color:#2c2c2c;outline:none;transition:border-color 0.15s;"
          oninput="handleInput()" onkeydown="if(event.key==='Enter')handleSearch()">
        <div id="matchList" style="display:none;"></div>
        <div id="noMatchMsg" style="display:none;font-size:12px;color:#c0392b;margin-top:10px;padding:10px 12px;background:#fdf0ee;border-radius:8px;">
          No guest found. Please check your spelling or ask a member of staff for help.
        </div>
      </div>
      <button onclick="handleSearch()" style="width:100%;padding:16px;background:#7a8c78;border:none;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;color:white;cursor:pointer;">Find my seat →</button>
    </div>`;

  const input = document.getElementById('nameInput');
  input.focus();
  setTimeout(() => { input.setSelectionRange(input.value.length, input.value.length); }, 0);

  window.handleInput = () => {
    const q = input.value.trim();
    document.getElementById('noMatchMsg').style.display = 'none';
    input.style.borderColor = '#e0dbd4';
    if (q.length >= 2) {
      const matches = findMatches(q);
      if (matches.length > 0) showMatchList(matches);
      else document.getElementById('matchList').style.display = 'none';
    } else {
      document.getElementById('matchList').style.display = 'none';
    }
  };

  window.handleSearch = () => {
    const q = input.value.trim();
    if (!q) return;
    const exact = guestData.find(g => g.name.toLowerCase() === q.toLowerCase());
    if (exact) { resolvedGuest = exact; renderConfirm(); return; }
    const matches = findMatches(q);
    if (matches.length > 0) showMatchList(matches);
    else { document.getElementById('noMatchMsg').style.display = 'block'; input.style.borderColor = '#e05858'; }
  };

  window.acceptSuggestion = (name, table) => {
    resolvedGuest = { name, table };
    renderConfirm();
  };
}

function showMatchList(matches) {
  const box = document.getElementById('matchList');
  box.style.cssText = 'display:block;margin-top:14px;border:1.5px solid #c8d4c6;border-radius:12px;overflow:hidden;';
  box.innerHTML = `<div style="background:#eef2ed;padding:8px 14px;font-size:10px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#7a8c78;">Select your name</div>` +
    matches.map(g => {
      const isVip = g.table==='VIP 1';
      const initials = g.name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
      const sn = g.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      const st = g.table.replace(/'/g,"\\'");
      return `<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid #f5f3f0;">
        <div style="width:36px;height:36px;border-radius:50%;background:${isVip?'#e8d5b0':'#c8d4c6'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500;color:${isVip?'#b8935a':'#7a8c78'};flex-shrink:0;">${initials}</div>
        <div style="flex:1;"><div style="font-size:14px;font-weight:500;color:#2c2c2c;">${g.name}</div><div style="font-size:11px;color:#7a7a7a;margin-top:1px;">Table ${g.table}</div></div>
        <button onclick="acceptSuggestion('${sn}','${st}')" style="padding:7px 14px;background:#7a8c78;border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;color:white;cursor:pointer;flex-shrink:0;">That's me</button>
      </div>`;
    }).join('') +
    `<div style="padding:10px 14px;background:#faf9f7;"><button onclick="document.getElementById('matchList').style.display='none';document.getElementById('nameInput').focus();" style="background:none;border:none;font-family:'DM Sans',sans-serif;font-size:12px;color:#7a7a7a;cursor:pointer;padding:0;">None of these — try again</button></div>`;
}

// ─── SCREEN 1: Confirm ────────────────────────────────────────────────────────
function renderConfirm() {
  const { name: guestName, table: tableId } = resolvedGuest;
  const tablemates = guestData.filter(g => g.table===tableId && g.name!==guestName);
  const isVip = tableId==='VIP 1';
  const alreadyIn = arrivedGuests.has(guestKey(resolvedGuest));
  const initials = guestName.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');

  overlay.innerHTML = `
    <div style="width:100%;max-width:420px;padding:0 20px;">
      ${eventHeader}
      <div style="background:white;border:1px solid #e8e4de;border-radius:16px;padding:24px;margin-bottom:16px;text-align:center;">
        <div style="width:56px;height:56px;border-radius:50%;background:${isVip?'#e8d5b0':'#c8d4c6'};display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:18px;font-weight:500;color:${isVip?'#b8935a':'#7a8c78'};">${initials}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:400;color:#2c2c2c;margin-bottom:4px;">${guestName}</div>
        ${isVip?`<div style="display:inline-block;background:#e8d5b0;color:#b8935a;font-size:11px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;padding:3px 10px;border-radius:10px;margin:4px 0 10px;">VIP Table</div>`:''}
        <div style="font-size:13px;color:#7a7a7a;margin-top:10px;">Your seat is at</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:500;color:#2c2c2c;line-height:1.1;">Table ${tableId}</div>
      </div>
      <div style="background:white;border:1px solid #e8e4de;border-radius:16px;padding:20px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#7a7a7a;margin-bottom:14px;">Your tablemates</div>
        ${tablemates.length===0?`<div style="font-size:13px;color:#aaa;text-align:center;">No other guests at this table</div>`:tablemates.map(t=>`
          <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #f5f3f0;">
            <div style="width:28px;height:28px;border-radius:50%;background:#eef2ed;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;color:#7a8c78;flex-shrink:0;">${t.name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('')}</div>
            <div style="font-size:13px;color:#2c2c2c;">${t.name}</div>
          </div>`).join('')}
      </div>
      <button onclick="goBack()" style="width:100%;padding:12px;background:none;border:1.5px solid #e0dbd4;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:13px;color:#7a7a7a;cursor:pointer;margin-bottom:10px;">← Not me, search again</button>
      ${alreadyIn
        ? `<div style="text-align:center;padding:16px;background:#eef2ed;border-radius:12px;color:#7a8c78;font-size:14px;font-weight:500;">You are already checked in ✓</div>
           <button onclick="doShowTableView()" style="margin-top:10px;width:100%;padding:16px;background:white;border:1.5px solid #c8d4c6;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;color:#7a8c78;cursor:pointer;">View your table →</button>`
        : `<button id="checkinBtn" onclick="doCheckin()" style="width:100%;padding:18px;background:#7a8c78;border:none;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:16px;font-weight:500;color:white;cursor:pointer;">Check me in</button>`}
    </div>`;

  window.goBack = () => renderSearch(guestName);
  window.doCheckin = doCheckin;
  window.doShowTableView = () => showTableView(guestName, tableId);
}

// ─── SCREEN 2: Success ────────────────────────────────────────────────────────
async function doCheckin() {
  const { name: guestName, table: tableId } = resolvedGuest;
  const btn = document.getElementById('checkinBtn');
  if (btn) { btn.disabled=true; btn.textContent='Checking in…'; btn.style.opacity='0.7'; }
  await fbSetCheckin(guestName, true);
  // No onValue listener in guest mode — update locally so alreadyIn checks work
  arrivedGuests.add(tableId+'|'+guestName);
  setTimeout(() => renderSuccess(guestName, tableId), 600);
}

function renderSuccess(guestName, tableId) {
  overlay.innerHTML = `
    <div style="width:100%;max-width:420px;padding:0 20px;">
      <div style="text-align:center;padding:80px 0 40px;">
        <div style="width:80px;height:80px;border-radius:50%;background:#eef2ed;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;animation:popIn 0.4s cubic-bezier(0.34,1.56,0.64,1);">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M8 18L15 25L28 11" stroke="#7a8c78" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <animate attributeName="stroke-dashoffset" from="40" to="0" dur="0.5s" begin="0.2s" fill="freeze"/>
            </path>
          </svg>
        </div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:400;color:#2c2c2c;margin-bottom:8px;">You're checked in!</div>
        <div style="font-size:14px;color:#7a7a7a;">Welcome, ${guestName.split(' ')[0]}.</div>
        <div style="font-size:14px;color:#7a7a7a;margin-top:4px;">Enjoy the celebration.</div>
      </div>
      <div style="background:white;border:1px solid #e8e4de;border-radius:16px;padding:20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:12px;color:#7a7a7a;margin-bottom:4px;">Your table</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:500;color:#2c2c2c;">Table ${tableId}</div>
      </div>
      <button onclick="doShowTableView()" style="width:100%;padding:16px;background:white;border:1.5px solid #c8d4c6;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;color:#7a8c78;cursor:pointer;">View your table →</button>
    </div>
    <style>@keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}</style>`;

  window.doShowTableView = () => showTableView(guestName, tableId);
  setTimeout(() => showTableView(guestName, tableId), 2400);
}

// ─── SCREEN 3: Table view ─────────────────────────────────────────────────────
function showTableView(guestName, tableId) {
  const tbl = tables.find(t => t.id===tableId);
  const tablemates = guestData.filter(g => g.table===tableId && g.name!==guestName);
  const isVip = tableId==='VIP 1';

  overlay.innerHTML = `
    <div style="width:100%;max-width:420px;padding:0 20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 0 16px;">
        <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:400;color:#2c2c2c;">Your Table</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:13px;color:#7a7a7a;font-style:italic;">Table ${tableId}</div>
      </div>
      <div style="background:white;border:1px solid #e8e4de;border-radius:16px;overflow:hidden;margin-bottom:16px;padding:12px;">
        <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#7a7a7a;margin-bottom:8px;text-align:center;">Grand Ballroom</div>
        <svg viewBox="0 0 580 860" width="100%" style="display:block;border-radius:8px;background:#f5f3f0;">
          <rect x="16" y="90" width="548" height="732" fill="white" stroke="#c8c2b8" stroke-width="2"/>
          <rect x="190" y="100" width="200" height="36" rx="4" fill="#d4cfc8" stroke="#b0aa9f" stroke-width="1"/>
          <text x="290" y="122" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="11" fill="#6a6560">STAGE</text>
          ${tables.map(t => {
            const hi = t.id===tableId;
            const fill = hi?'#7a8c78':(t.type==='vip'?'#e8b84b':'#4db8a0');
            return `<circle cx="${t.cx}" cy="${t.cy}" r="${hi?28:20}" fill="${fill}" opacity="${hi?1:0.3}"/>
              <text x="${t.cx}" y="${t.cy}" text-anchor="middle" dominant-baseline="central" font-family="DM Sans,sans-serif" font-size="${hi?13:10}" font-weight="500" fill="white">${t.id==='VIP 1'?'VIP':t.id}</text>`;
          }).join('')}
          ${tbl?`<circle cx="${tbl.cx}" cy="${tbl.cy}" r="38" fill="none" stroke="#7a8c78" stroke-width="2">
            <animate attributeName="r" values="32;46;32" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
          </circle>`:''}
        </svg>
      </div>
      <div style="background:white;border:1px solid #e8e4de;border-radius:16px;padding:20px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:12px;padding-bottom:14px;border-bottom:1px solid #f5f3f0;margin-bottom:14px;">
          <div style="width:40px;height:40px;border-radius:50%;background:${isVip?'#e8d5b0':'#c8d4c6'};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;color:${isVip?'#b8935a':'#7a8c78'};flex-shrink:0;">
            ${guestName.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('')}
          </div>
          <div>
            <div style="font-size:14px;font-weight:500;color:#2c2c2c;">${guestName}</div>
            <div style="font-size:11px;color:#7a7a7a;margin-top:2px;">Checked in ✓</div>
          </div>
        </div>
        <div style="font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#7a7a7a;margin-bottom:12px;">Tablemates</div>
        ${tablemates.map(t=>`
          <div style="display:flex;align-items:center;gap:10px;padding:5px 0;border-bottom:1px solid #f5f3f0;">
            <div style="width:26px;height:26px;border-radius:50%;background:#eef2ed;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:500;color:#7a8c78;flex-shrink:0;">${t.name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('')}</div>
            <div style="font-size:13px;color:#2c2c2c;">${t.name}</div>
          </div>`).join('')}
      </div>

      <div id="deregisterSection" style="margin-bottom:16px;">
        <button onclick="expandDeregister()" style="width:100%;padding:13px 16px;background:#fdf5f4;border:1.5px solid #f5c0b8;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:#c0392b;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;"><circle cx="8" cy="8" r="7" stroke="#c0392b" stroke-width="1.5"/><path d="M8 5v3.5" stroke="#c0392b" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11" r="0.75" fill="#c0392b"/></svg>
          Checked in by mistake?
        </button>
      </div>
      <div style="text-align:center;font-size:12px;color:#aaa;padding-bottom:32px;">Enjoy the celebration 🎊</div>
    </div>`;

  window.expandDeregister = function() {
    const sec = document.getElementById('deregisterSection');
    sec.innerHTML = `
      <div style="border:1.5px solid #f5c0b8;border-radius:12px;overflow:hidden;">
        <div style="background:#fdf5f4;padding:14px 16px;border-bottom:1px solid #f5c0b8;">
          <div style="font-size:13px;font-weight:500;color:#c0392b;margin-bottom:4px;">Undo check-in for ${guestName}?</div>
          <div style="font-size:12px;color:#7a7a7a;line-height:1.5;">This will remove your check-in and bring you back to the name search.</div>
        </div>
        <div style="display:flex;">
          <button onclick="expandDeregister()" style="flex:1;padding:12px;background:white;border:none;border-right:1px solid #f5c0b8;font-family:'DM Sans',sans-serif;font-size:13px;color:#7a7a7a;cursor:pointer;">Cancel</button>
          <button onclick="doDeregister('${guestName.replace(/'/g,"\\'")}','${tableId.replace(/'/g,"\\'")}')" style="flex:1;padding:12px;background:#e74c3c;border:none;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:white;cursor:pointer;">Yes, undo check-in</button>
        </div>
      </div>`;
  };

  window.doDeregister = async function(name, table) {
    await fbSetCheckin(name, false);
    arrivedGuests.delete(table+'|'+name);
    resolvedGuest = null;
    renderSearch(name);
  };
}

// Boot — show PIN screen first
renderPin();
