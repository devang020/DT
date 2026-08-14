/* ============================================================
   firebase.js  –  Firestore integration for DT App
   ============================================================
   IMPORTANT: Replace the apiKey below with the EXACT key
   from your Firebase console if login fails.
   Go to: Firebase Console → Project Settings → Your apps → SDK setup
   ============================================================ */

import { initializeApp }       from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore,
         collection, doc,
         setDoc, getDoc,
         getDocs, deleteDoc,
         query, orderBy }      from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCRX1gz_jW6CZUlnDxRzG76uGzb1z_nXUs",
  authDomain:        "donation-tracker-974d7.firebaseapp.com",
  projectId:         "donation-tracker-974d7",
  storageBucket:     "donation-tracker-974d7.firebasestorage.app",
  messagingSenderId: "122661165981",
  appId:             "1:122661165981:web:8f38c8cef8edf65f0ded74"
};

const fbApp = initializeApp(firebaseConfig);
const db    = getFirestore(fbApp);

window._db = db; // expose for app.js

/* ══════════════════════════════════════════════
   USER FUNCTIONS
   Firestore path: users/{username}
   ══════════════════════════════════════════════ */

/** Load all users */
window.fbLoadUsers = async function() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => d.data());
  } catch(e) { console.error('fbLoadUsers', e); return []; }
};

/** Save / update one user */
window.fbSaveUser = async function(userObj) {
  try {
    await setDoc(doc(db, 'users', userObj.username), userObj, { merge: true });
  } catch(e) { console.error('fbSaveUser', e); }
};

/** Get a single user by username */
window.fbGetUser = async function(username) {
  try {
    const snap = await getDoc(doc(db, 'users', username));
    return snap.exists() ? snap.data() : null;
  } catch(e) { console.error('fbGetUser', e); return null; }
};

/* ══════════════════════════════════════════════
   DONATION FUNCTIONS
   Firestore path: donations/{username}/entries/{id}
   ══════════════════════════════════════════════ */

/** Load all donations for a user */
window.fbLoadDonations = async function(username) {
  try {
    const col  = collection(db, 'donations', username, 'entries');
    const snap = await getDocs(col);
    return snap.docs.map(d => d.data());
  } catch(e) { console.error('fbLoadDonations', e); return []; }
};

/** Save one donation entry */
window.fbSaveDonation = async function(username, entry) {
  try {
    await setDoc(
      doc(db, 'donations', username, 'entries', String(entry.id)),
      entry
    );
  } catch(e) { console.error('fbSaveDonation', e); }
};

/** Delete one donation entry */
window.fbDeleteDonation = async function(username, id) {
  try {
    await deleteDoc(doc(db, 'donations', username, 'entries', String(id)));
  } catch(e) { console.error('fbDeleteDonation', e); }
};

console.log('[DT] Firebase ready — project: donation-tracker-974d7');
