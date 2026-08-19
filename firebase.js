/* ============================================================
   firebase.js  –  Firestore integration for DT App
   Uses Firebase compat SDK (loaded via script tags in index.html)
   ============================================================ */

const firebaseConfig = {
  apiKey:            "AIzaSyCRX1gz_jW6CZUlnDxRzG76uGzb1z_nXUs",
  authDomain:        "donation-tracker-974d7.firebaseapp.com",
  projectId:         "donation-tracker-974d7",
  storageBucket:     "donation-tracker-974d7.firebasestorage.app",
  messagingSenderId: "122661165981",
  appId:             "1:122661165981:web:8f38c8cef8edf65f0ded74"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ══════════════════════════════════════════════
   USER FUNCTIONS  —  path: users/{username}
   ══════════════════════════════════════════════ */

window.fbGetUser = async function(username) {
  try {
    const snap = await db.collection('users').doc(username).get();
    return snap.exists ? snap.data() : null;
  } catch(e) { console.error('fbGetUser', e); return null; }
};

window.fbSaveUser = async function(userObj) {
  try {
    await db.collection('users').doc(userObj.username).set(userObj, { merge: true });
  } catch(e) { console.error('fbSaveUser', e); }
};

/* ══════════════════════════════════════════════
   DONATION FUNCTIONS  —  path: donations/{username}/entries/{id}
   ══════════════════════════════════════════════ */

window.fbLoadDonations = async function(username) {
  try {
    const snap = await db.collection('donations').doc(username).collection('entries').get();
    return snap.docs.map(d => d.data());
  } catch(e) { console.error('fbLoadDonations', e); return []; }
};

window.fbSaveDonation = async function(username, entry) {
  try {
    await db.collection('donations').doc(username).collection('entries').doc(String(entry.id)).set(entry);
  } catch(e) { console.error('fbSaveDonation', e); }
};

window.fbDeleteDonation = async function(username, id) {
  try {
    await db.collection('donations').doc(username).collection('entries').doc(String(id)).delete();
  } catch(e) { console.error('fbDeleteDonation', e); }
};

console.log('[DT] Firebase ready — project: donation-tracker-974d7');
