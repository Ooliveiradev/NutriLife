// Firebase bootstrap (v9 modular) for Shopping List
// - Reads from window.NUTRILIFE_FIREBASE_CONFIG (fallback to window.FIREBASE_CONFIG)
// - Exports: app, auth, db, providers, helpers

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, setPersistence, browserLocalPersistence, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, enableIndexedDbPersistence, collection, doc, getDocs, getDoc, setDoc, updateDoc, addDoc, deleteDoc, query, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const cfg = window.NUTRILIFE_FIREBASE_CONFIG || window.FIREBASE_CONFIG;
if (!cfg) {
  console.warn('[firebase] Config ausente. Defina window.NUTRILIFE_FIREBASE_CONFIG antes de carregar.');
}
export const app = initializeApp(cfg || {});
export const auth = getAuth(app);
export const db = getFirestore(app);

// Persistence Firestore
try {
  await enableIndexedDbPersistence(db);
} catch (e) {
  console.info('[firebase] IndexedDB persistence indisponível, seguindo sem cache offline.', e?.message || e);
}
// Auth persistence local
await setPersistence(auth, browserLocalPersistence).catch(() => {});

export const providers = {
  google: new GoogleAuthProvider()
};

// Auth helpers
export function authOnChange(cb) { return onAuthStateChanged(auth, cb); }
export async function authWithGoogle() { return signInWithPopup(auth, providers.google); }
export async function authWithEmail(email, pass) { return signInWithEmailAndPassword(auth, email, pass); }
export async function authSignup(email, pass) { return createUserWithEmailAndPassword(auth, email, pass); }
export async function logout() { return signOut(auth); }

// Firestore helpers (lists and recipes)
export const fs = {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, addDoc, deleteDoc, query, orderBy, limit, serverTimestamp
};

