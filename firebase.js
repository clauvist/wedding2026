import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { firebaseConfig } from './config.js';

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getDatabase(app);

export const tables = [
  {id:'1',     cx:75,  cy:175, type:'teal'},
  {id:'VIP 1', cx:170, cy:175, type:'vip'},
  {id:'26',    cx:410, cy:175, type:'teal'},
  {id:'25',    cx:505, cy:175, type:'teal'},
  {id:'2',     cx:75,  cy:270, type:'teal'},
  {id:'12',    cx:170, cy:270, type:'teal'},
  {id:'13',    cx:410, cy:270, type:'teal'},
  {id:'23',    cx:505, cy:270, type:'teal'},
  {id:'3',     cx:75,  cy:365, type:'teal'},
  {id:'11',    cx:170, cy:365, type:'teal'},
  {id:'15',    cx:410, cy:365, type:'teal'},
  {id:'22',    cx:505, cy:365, type:'teal'},
  {id:'5',     cx:75,  cy:460, type:'teal'},
  {id:'10',    cx:170, cy:460, type:'teal'},
  {id:'16',    cx:410, cy:460, type:'teal'},
  {id:'21',    cx:505, cy:460, type:'teal'},
  {id:'6',     cx:75,  cy:555, type:'teal'},
  {id:'9',     cx:170, cy:555, type:'teal'},
  {id:'17',    cx:410, cy:555, type:'teal'},
  {id:'20',    cx:505, cy:555, type:'teal'},
  {id:'7',     cx:75,  cy:650, type:'teal'},
  {id:'8',     cx:170, cy:650, type:'teal'},
  {id:'18',    cx:410, cy:650, type:'teal'},
  {id:'19',    cx:505, cy:650, type:'teal'},
];

// Shared mutable state — exported as live bindings so importers always see the latest value.
// Only code in this module may reassign these variables; importers mutate via the helper functions below.
export let guestData     = [];
export let guestsByTable = {};
export let arrivedGuests = new Set();

export function toKey(name) {
  return encodeURIComponent(name).replace(/\./g, '%2E');
}

export function fromKey(key) {
  return decodeURIComponent(key);
}

export function guestKey(g) {
  return g.table + '|' + g.name;
}

export function sortTableIds(a, b) {
  if (a === 'VIP 1') return -1;
  if (b === 'VIP 1') return 1;
  return parseInt(a) - parseInt(b);
}

export async function loadGuestData() {
  const snap = await get(ref(db, 'guests'));
  if (snap.exists()) {
    guestData = Object.values(snap.val());
    guestsByTable = {};
    guestData.forEach(g => {
      if (!guestsByTable[g.table]) guestsByTable[g.table] = [];
      guestsByTable[g.table].push(g);
    });
  }
}

export function rebuildArrivedSet(snap) {
  arrivedGuests = new Set();
  if (snap.exists()) {
    Object.entries(snap.val()).forEach(([key, val]) => {
      if (val === true) {
        const name = fromKey(key);
        const g = guestData.find(g => g.name === name);
        if (g) arrivedGuests.add(guestKey(g));
      }
    });
  }
}

export async function fbSetCheckin(guestName, value) {
  await set(ref(db, `checkins/${toKey(guestName)}`), value);
}
