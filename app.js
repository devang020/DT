/* ============================================================
   DT – Donation Tracker  |  app.js
   ============================================================ */

/* ── Constants ── */
const USERS_STORE = 'dt_users';
const SESSION_KEY = 'dt_session';
const THEME_KEY   = 'dt_theme';

/* ── Per-user store key ── */
function storeKey() {
  const user = currentUser ? currentUser.username : 'guest';
  return 'dt_v1_' + user;
}

/* ── User Store ── */
function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_STORE)) || []; }
  catch { return []; }
}
function saveUsers(arr) { localStorage.setItem(USERS_STORE, JSON.stringify(arr)); }

/* Seed default admin */
(function seedAdmin() {
  const users = loadUsers();
  if (!users.find(u => u.username === 'admin')) {
    users.push({ username: 'admin', password: 'dt2024', name: 'Admin' });
    saveUsers(users);
  }
})();

/* ── Donation Store ── */
function load() {
  try { return JSON.parse(localStorage.getItem(storeKey())) || []; }
  catch { return []; }
}
function save(arr) { localStorage.setItem(storeKey(), JSON.stringify(arr)); }

/* ── Session ── */
let currentUser = null;
function getSession() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; } }
function setSession(u) { currentUser = u; sessionStorage.setItem(SESSION_KEY, JSON.stringify(u)); }
function clearSession() { currentUser = null; sessionStorage.removeItem(SESSION_KEY); }

/* ── Utilities ── */
function todayStr() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth()+1).padStart(2,'0'),
    String(now.getDate()).padStart(2,'0')
  ].join('-');
}
function fmtDate(s) {
  if (!s) return '';
  return new Date(s+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
}
function fmtAmt(n) { return '₹'+Number(n).toLocaleString('en-IN'); }
function mCls(m) { return {Ketto:'m-ketto',UPI:'m-upi',Cash:'m-cash',Other:'m-other'}[m]||'m-other'; }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function initials(n) { return (n||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2800);
}

/* ── Password eye toggle ── */
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.querySelector('.eye-open').style.display = isHidden ? 'none' : '';
  btn.querySelector('.eye-shut').style.display = isHidden ? ''     : 'none';
  input.focus();
}

/* ── Panel switcher ── */
function showPanel(name) {
  document.getElementById('panelLogin').style.display    = name==='login'    ? 'block' : 'none';
  document.getElementById('panelRegister').style.display = name==='register' ? 'block' : 'none';
  ['loginError','regError','regOk'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.display='none'; el.textContent=''; }
  });
}

/* ── Auth ── */
function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const found = loadUsers().find(x => x.username===u && x.password===p);
  if (found) {
    setSession({ username:found.username, name:found.name, isGuest:false });
    enterApp();
  } else {
    const err = document.getElementById('loginError');
    err.textContent = 'Invalid username or password.';
    err.style.display = 'block';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginPass').focus();
  }
}

function doRegister() {
  const name  = document.getElementById('regName').value.trim();
  const user  = document.getElementById('regUser').value.trim();
  const pass  = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;
  const errEl = document.getElementById('regError');
  const okEl  = document.getElementById('regOk');
  errEl.style.display='none'; okEl.style.display='none';
  if (!name||!user||!pass) { errEl.textContent='All fields are required.'; errEl.style.display='block'; return; }
  if (pass!==pass2) { errEl.textContent='Passwords do not match.'; errEl.style.display='block'; return; }
  if (pass.length<4) { errEl.textContent='Password must be at least 4 characters.'; errEl.style.display='block'; return; }
  const users = loadUsers();
  if (users.find(x=>x.username.toLowerCase()===user.toLowerCase())) {
    errEl.textContent='Username already taken.'; errEl.style.display='block'; return;
  }
  users.push({ username:user, password:pass, name });
  saveUsers(users);
  okEl.textContent='Account created! Signing you in…'; okEl.style.display='block';
  setTimeout(()=>{ setSession({username:user,name,isGuest:false}); enterApp(); }, 1000);
}

function doGuest() {
  setSession({ username:'guest', name:'Guest', isGuest:true });
  enterApp();
}

function enterApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appShell').style.display    = 'flex';
  const banner = document.getElementById('guestBanner');
  const logoutBtn = document.querySelector('.btn-logout');
  if (currentUser && currentUser.isGuest) {
    banner.classList.add('show');
    document.body.classList.add('guest-mode');
    if (logoutBtn) logoutBtn.textContent = 'Exit Guest';
  } else {
    banner.classList.remove('show');
    document.body.classList.remove('guest-mode');
    if (logoutBtn) logoutBtn.textContent = 'Logout';
  }
  // Restore theme only after entering app (login page always stays light)
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(savedTheme);
  initApp();
}

function doLogout() {
  clearSession();
  // Force light theme back on login screen
  document.documentElement.setAttribute('data-theme', 'light');
  document.getElementById('appShell').style.display    = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('guestBanner').classList.remove('show');
  document.body.classList.remove('guest-mode');
  showPanel('login');
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
}

/* Enter key support */
['loginUser','loginPass'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
});
['regName','regUser','regPass','regPass2'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('keydown', e => { if(e.key==='Enter') doRegister(); });
});

/* Auto-login */
window.addEventListener('DOMContentLoaded', () => {
  // Always start with light theme on login page
  document.documentElement.setAttribute('data-theme', 'light');
  const s = getSession();
  if (s) { currentUser=s; enterApp(); }
});

/* ── Navigation ── */
const ALL_PAGES = ['home','add','analysis','settings'];

function showPage(name) {
  ALL_PAGES.forEach(p => {
    document.getElementById('page-'+p)?.classList.toggle('active', p===name);
    const nb = document.getElementById('nav-'+p);
    const bb = document.getElementById('bn-'+p);
    if (nb) nb.classList.toggle('active', p===name);
    if (bb) bb.classList.toggle('active', p===name);
  });
  if (name==='home')     renderHome();
  if (name==='analysis') applyFilters();
  if (name==='settings') renderSettings();
  closeAllDrops();
  window.scrollTo(0,0);
}

/* ── Init ── */
function initApp() {
  const today = todayStr();
  const fDate = document.getElementById('fDate');
  fDate.value = today;
  fDate.max   = today;  // disable future dates
  document.getElementById('todayBadge').textContent = fmtDate(today);
  renderHome();
  const el = document.getElementById('aTotalAll');
  if (el) el.textContent = load().length;
}

/* ── Home ── */
function renderHome() {
  const all   = load();
  const today = all.filter(d => d.date===todayStr());
  const total = today.reduce((s,d)=>s+Number(d.amount),0);
  document.getElementById('sCount').textContent = today.length;
  document.getElementById('sTotal').textContent = fmtAmt(total);
  const el = document.getElementById('homeList');
  if (!today.length) {
    el.innerHTML=`<div class="empty-state"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="#BBDEFB"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.53 15.63 0 12.5 0c-1.74 0-3.41.81-4.5 2.09C6.91.81 5.24 0 3.5 0 .37 0-2 2.53-2 4.64c0 .48.11.92.18 1.36H-2c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h9v9c0 .55.45 1 1 1s1-.45 1-1v-9h9c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg></div><p>No donations recorded today yet.<br>Tap <b>Add</b> to record one.</p></div>`;
    return;
  }
  el.innerHTML = [...today].reverse().map(donCard).join('');
}

/* ── Donation Card ── */
function donCard(d) {
  const phone = d.phone ? `<span class="di-phone"> · ${esc(d.phone)}</span>` : '';
  return `<div class="don-item">
    <div class="di-left">
      <div class="di-avatar">${initials(d.name)}</div>
      <div>
        <div class="di-name">${esc(d.name)}${phone}</div>
        <div class="di-meta">${fmtDate(d.date)}${d.notes?' · '+esc(d.notes.slice(0,30)):''}</div>
      </div>
    </div>
    <div class="di-right">
      <div class="di-amount">${fmtAmt(d.amount)}</div>
      <span class="di-method ${mCls(d.method)}">${esc(d.method)}</span>
    </div>
  </div>`;
}

/* ── Add Donation ── */
function submitDonation(e) {
  e.preventDefault();
  const entry = {
    id:     Date.now(),
    name:   document.getElementById('fName').value.trim(),
    phone:  document.getElementById('fPhone').value.trim(),
    amount: Number(document.getElementById('fAmount').value),
    method: document.getElementById('fMethod').value,
    date:   document.getElementById('fDate').value,
    notes:  document.getElementById('fNotes').value.trim(),
  };
  const arr = load(); arr.push(entry); save(arr);
  showToast('Donation saved successfully!');
  e.target.reset();
  document.getElementById('fDate').value = todayStr();
  setTimeout(()=>showPage('home'), 900);
}

/* ════════════════════════════════════
   ANALYSIS FILTERS
   ════════════════════════════════════ */
let curAmt='all', curMth='all', curDate='all';
let pendingAmt='all', pendingMth='all', pendingDate='all', pendingName='';
let filtersApplied=false;
let openDrop=null;

const DROPS = ['date','name','amt','mth'];

/* Position dropdown below its button */
function positionDrop(dropId, btnId) {
  const btn     = document.getElementById(btnId);
  const drop    = document.getElementById('fdrop-'+dropId);
  const pageEl  = document.getElementById('page-analysis');
  const pR      = pageEl.getBoundingClientRect();
  const bR      = btn.getBoundingClientRect();
  const top     = bR.bottom - pR.top + 6;
  const dropW   = 250;
  let left      = bR.left - pR.left;
  if (left+dropW > pR.width-8) left = pR.width-dropW-8;
  if (left<0) left=0;
  drop.style.top  = top+'px';
  drop.style.left = left+'px';
  const mid = bR.left+bR.width/2;
  const tri = Math.max(12, Math.min(mid-(pR.left+left)-7, dropW-26));
  drop.style.setProperty('--tri', tri+'px');
}

function toggleDrop(e, name) {
  e.stopPropagation();
  const isOpen = openDrop===name;
  closeAllDrops();
  if (!isOpen) openDropNow(name);
}

function openDropNow(name) {
  openDrop = name;
  positionDrop(name, 'ftab-'+name);
  document.getElementById('fdrop-'+name).classList.add('show');
  document.getElementById('ftab-'+name).classList.add('open');
  if (name==='name') setTimeout(()=>document.getElementById('flName').focus(), 40);
  if (name==='date') {
    // Set max to today on custom date pickers
    const today = todayStr();
    const calFrom = document.getElementById('calFrom');
    const calTo   = document.getElementById('calTo');
    if (calFrom) calFrom.max = today;
    if (calTo)   calTo.max   = today;
  }
}

function closeAllDrops() {
  DROPS.forEach(p=>{
    document.getElementById('fdrop-'+p)?.classList.remove('show');
    document.getElementById('ftab-'+p)?.classList.remove('open');
  });
  openDrop=null;
  hideSuggestions();
}

document.addEventListener('click', e=>{
  if (!e.target.closest('.fdrop') && !e.target.closest('.ftab')) closeAllDrops();
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeAllDrops(); });

/* Chip pickers */
function pickDate(el) {
  document.querySelectorAll('#dateChips .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  pendingDate = el.dataset.d;
  document.getElementById('customCal').classList.toggle('show', pendingDate==='custom');
}
function pickAmt(el) {
  document.querySelectorAll('#amtChips .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on'); pendingAmt=el.dataset.r;
}
function pickMth(el) {
  document.querySelectorAll('#mthChips .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on'); pendingMth=el.dataset.m;
}

/* Donor name + phone autocomplete */
function onNameInput() {
  const q    = document.getElementById('flName').value.toLowerCase().trim();
  const list = document.getElementById('suggestList');
  if (!q) { hideSuggestions(); return; }
  const all = load();
  // deduplicate by name+phone
  const seen = new Set();
  const matches = [];
  for (const d of all) {
    const key = d.name+'|'+(d.phone||'');
    if (!seen.has(key) && (d.name.toLowerCase().includes(q) || (d.phone||'').includes(q))) {
      seen.add(key); matches.push(d);
      if (matches.length>=6) break;
    }
  }
  if (!matches.length) { hideSuggestions(); return; }
  list.innerHTML = matches.map(d => {
    const hi = esc(d.name).replace(new RegExp(esc(q),'gi'), m=>`<span class="s-match">${m}</span>`);
    const ph = d.phone ? `<div class="s-sub">${esc(d.phone)}</div>` : '';
    return `<div class="suggest-item" onclick="selectSuggestion('${esc(d.name).replace(/'/g,"\\'")}')">
      <div class="s-avatar">${initials(d.name)}</div>
      <div><div>${hi}</div>${ph}</div>
    </div>`;
  }).join('');
  list.classList.add('show');
}
function onNameKey(e) {
  if (e.key==='Enter'||e.key==='Escape') closeAllDrops();
}
function selectSuggestion(name) {
  document.getElementById('flName').value = name;
  pendingName = name;
  hideSuggestions();
}
function hideSuggestions() {
  const list = document.getElementById('suggestList');
  if (list) { list.classList.remove('show'); list.innerHTML=''; }
}

/* Apply ALL filters */
function applyAllFilters() {
  pendingName = (document.getElementById('flName').value||'').trim();
  curAmt  = pendingAmt;
  curMth  = pendingMth;
  curDate = pendingDate;
  // Set max on custom date inputs to today
  const today = todayStr();
  const calFrom = document.getElementById('calFrom');
  const calTo   = document.getElementById('calTo');
  if (calFrom) calFrom.max = today;
  if (calTo)   calTo.max   = today;
  document.getElementById('ftab-name').classList.toggle('has-filter', !!pendingName);
  document.getElementById('ftab-amt').classList.toggle('has-filter',  curAmt!=='all');
  document.getElementById('ftab-mth').classList.toggle('has-filter',  curMth!=='all');
  document.getElementById('ftab-date').classList.toggle('has-filter', curDate!=='all');
  closeAllDrops();
  filtersApplied=true;
  applyFilters();
}

/* Reset */
function resetFilters() {
  document.getElementById('flName').value='';
  pendingAmt='all'; pendingMth='all'; pendingName=''; pendingDate='all';
  curAmt='all'; curMth='all'; curDate='all'; filtersApplied=false;
  document.querySelectorAll('#amtChips .chip').forEach(c=>c.classList.remove('on'));
  document.querySelector('#amtChips .chip[data-r="all"]').classList.add('on');
  document.querySelectorAll('#mthChips .chip').forEach(c=>c.classList.remove('on'));
  document.querySelector('#mthChips .chip[data-m="all"]').classList.add('on');
  document.querySelectorAll('#dateChips .chip').forEach(c=>c.classList.remove('on'));
  document.querySelector('#dateChips .chip[data-d="all"]').classList.add('on');
  document.getElementById('customCal').classList.remove('show');
  document.getElementById('calFrom').value='';
  document.getElementById('calTo').value='';
  DROPS.forEach(p=>document.getElementById('ftab-'+p)?.classList.remove('has-filter'));
  closeAllDrops();
  applyFilters();
}

/* Date range helper */
function getDateRange() {
  if (curDate==='all') return null;

  // Use local date (not UTC) to avoid timezone shifting
  const now = new Date();
  const todayISO = [
    now.getFullYear(),
    String(now.getMonth()+1).padStart(2,'0'),
    String(now.getDate()).padStart(2,'0')
  ].join('-');

  if (curDate==='7days') {
    const f = new Date(now);
    f.setDate(f.getDate()-6);
    const fromISO = [
      f.getFullYear(),
      String(f.getMonth()+1).padStart(2,'0'),
      String(f.getDate()).padStart(2,'0')
    ].join('-');
    return { from: fromISO, to: todayISO };
  }
  if (curDate==='month') {
    const f = new Date(now);
    f.setDate(f.getDate()-29);
    const fromISO = [
      f.getFullYear(),
      String(f.getMonth()+1).padStart(2,'0'),
      String(f.getDate()).padStart(2,'0')
    ].join('-');
    return { from: fromISO, to: todayISO };
  }
  if (curDate==='custom') {
    const f = document.getElementById('calFrom').value;
    const t = document.getElementById('calTo').value;
    if (f||t) return { from: f||'0000-01-01', to: t||'9999-12-31' };
  }
  return null;
}

/* Main apply */
function applyFilters() {
  const allData=load(); let data=[...allData];
  const nameQ=pendingName.toLowerCase();
  if (nameQ) data=data.filter(d=>d.name.toLowerCase().includes(nameQ)||(d.phone||'').includes(nameQ));
  if (curAmt!=='all') { const[lo,hi]=curAmt.split('-').map(Number); data=data.filter(d=>Number(d.amount)>=lo&&Number(d.amount)<=hi); }
  if (curMth!=='all') data=data.filter(d=>d.method===curMth);
  const range=getDateRange();
  if (range) data=data.filter(d=>d.date>=range.from&&d.date<=range.to);
  const total=data.reduce((s,d)=>s+Number(d.amount),0);
  const allTotal=allData.reduce((s,d)=>s+Number(d.amount),0);
  document.getElementById('aTotalAll').textContent=allData.length;
  document.getElementById('aCnt').textContent=filtersApplied?data.length:allData.length;
  document.getElementById('aTotal').textContent=filtersApplied?fmtAmt(total):fmtAmt(allTotal);

  // Tags
  const tagsEl=document.getElementById('activeTags');
  const tags=[];
  if (pendingName) tags.push({label:`"${pendingName}"`,clear:()=>{document.getElementById('flName').value='';pendingName='';document.getElementById('ftab-name').classList.remove('has-filter');applyFilters();}});
  if (curDate!=='all') {
    const dl=curDate==='7days'?'Last 7 Days':curDate==='month'?'Last Month':`${document.getElementById('calFrom').value}→${document.getElementById('calTo').value}`;
    tags.push({label:dl,clear:()=>{curDate='all';pendingDate='all';document.querySelectorAll('#dateChips .chip').forEach(c=>c.classList.remove('on'));document.querySelector('#dateChips .chip[data-d="all"]').classList.add('on');document.getElementById('customCal').classList.remove('show');document.getElementById('ftab-date').classList.remove('has-filter');applyFilters();}});
  }
  if (curAmt!=='all') {
    const al=curAmt==='20001-9999999'?'Above ₹20K':'₹'+curAmt.replace('-','–');
    tags.push({label:al,clear:()=>{curAmt='all';pendingAmt='all';document.querySelectorAll('#amtChips .chip').forEach(c=>c.classList.remove('on'));document.querySelector('#amtChips .chip[data-r="all"]').classList.add('on');document.getElementById('ftab-amt').classList.remove('has-filter');applyFilters();}});
  }
  if (curMth!=='all') tags.push({label:curMth,clear:()=>{curMth='all';pendingMth='all';document.querySelectorAll('#mthChips .chip').forEach(c=>c.classList.remove('on'));document.querySelector('#mthChips .chip[data-m="all"]').classList.add('on');document.getElementById('ftab-mth').classList.remove('has-filter');applyFilters();}});

  tagsEl.innerHTML=tags.map((t,i)=>`<span class="atag">${esc(t.label)}<span class="atag-close" onclick="clearTag(${i})">×</span></span>`).join('');
  window._tagClears=tags.map(t=>t.clear);

  const anaList=document.getElementById('anaList');
  if (!filtersApplied){anaList.innerHTML='';return;}
  if (!data.length){anaList.innerHTML=`<div class="empty-state"><div class="empty-icon"><svg width="44" height="44" viewBox="0 0 24 24" fill="#BBDEFB"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg></div><p>No donations match your filters.</p></div>`;return;}
  anaList.innerHTML=[...data].sort((a,b)=>b.date.localeCompare(a.date)).map(donCard).join('');
}

function clearTag(i) { if(window._tagClears?.[i]) window._tagClears[i](); }

/* ════════════════════════════════════
   SETTINGS
   ════════════════════════════════════ */

/* Change password */
function changePassword() {
  const old  = document.getElementById('cpOld').value;
  const nw   = document.getElementById('cpNew').value;
  const errEl= document.getElementById('cpErr');
  const okEl = document.getElementById('cpOk');
  errEl.style.display='none'; okEl.style.display='none';

  if (!old||!nw) { errEl.textContent='Fill all fields.'; errEl.style.display='block'; return; }
  if (nw.length<4) { errEl.textContent='New password must be at least 4 characters.'; errEl.style.display='block'; return; }

  const users=loadUsers();
  const idx=users.findIndex(x=>x.username===currentUser.username);
  if (idx===-1||users[idx].password!==old) { errEl.textContent='Current password is incorrect.'; errEl.style.display='block'; return; }

  users[idx].password=nw;
  saveUsers(users);
  document.getElementById('cpOld').value='';
  document.getElementById('cpNew').value='';
  okEl.textContent='Password updated successfully!'; okEl.style.display='block';
}

/* Theme */
function setTheme(theme) {
  applyTheme(theme);
  localStorage.setItem(THEME_KEY, theme);
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-light')?.classList.toggle('active', theme==='light');
  document.getElementById('theme-dark')?.classList.toggle('active', theme==='dark');
}

/* Manage donations - render list */
function renderSettings() {
  // Profile
  if (currentUser) {
    const el=document.getElementById('spcAvatar');
    const nm=document.getElementById('spcName');
    const us=document.getElementById('spcUser');
    if (el) el.textContent=initials(currentUser.name||currentUser.username);
    if (nm) nm.textContent=currentUser.name||currentUser.username;
    if (us) us.textContent='@'+currentUser.username;
  }

  // Disable change password for guests
  const cpSection = document.getElementById('cpSection');
  if (cpSection) {
    if (currentUser && currentUser.isGuest) {
      cpSection.style.opacity = '0.45';
      cpSection.style.pointerEvents = 'none';
      cpSection.title = 'Not available in Guest mode';
    } else {
      cpSection.style.opacity = '';
      cpSection.style.pointerEvents = '';
      cpSection.title = '';
    }
  }
  // Manage list
  const arr=load();
  const ml=document.getElementById('manageList');
  if (!arr.length) { ml.innerHTML=`<div class="empty-state" style="padding:24px"><p>No donations yet.</p></div>`; return; }
  ml.innerHTML=[...arr].sort((a,b)=>b.date.localeCompare(a.date)).map(d=>`
    <div class="manage-item">
      <div class="mi-info">
        <div class="mi-name">${esc(d.name)}${d.phone?' · '+esc(d.phone):''}</div>
        <div class="mi-sub">${fmtDate(d.date)} · ${fmtAmt(d.amount)} · ${esc(d.method)}</div>
      </div>
      <button class="mi-del" onclick="deleteEntry(${d.id})">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        Delete
      </button>
    </div>`).join('');
}

function deleteEntry(id) {
  if (!confirm('Delete this donation entry?')) return;
  const arr=load().filter(d=>d.id!==id);
  save(arr);
  showToast('Entry deleted.');
  renderSettings();
  // update analysis total
  const el=document.getElementById('aTotalAll');
  if (el) el.textContent=arr.length;
}
