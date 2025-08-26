// ===== AUTENTICAÇÃO - NutriLife =====
// Sistema de login/logout para páginas secundárias

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// ---- CONFIG ----
const firebaseConfig = window.FIREBASE_CONFIG;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---- DOM utils ----
const $ = (sel, el=document) => el.querySelector(sel);

// ---- Elements ----
const openLoginBtn = $('#open-login');
const logoutBtn = $('#logout-btn');
const whoami = $('#whoami');

// login modal
const loginOverlay = $('#login-overlay');
const loginModal = $('#login-modal');
const loginForm = $('#login-form');
const loginClose = $('#login-close');

// ---- State ----
let currentUser = null;

// ---- Helpers ----
function toggle(el, state) { 
  if (!el) return; 
  el.classList[state ? 'add' : 'remove']('active'); 
}

function openModal(overlay, modal) { 
  toggle(overlay, true); 
  toggle(modal, true); 
}

function closeModal(overlay, modal) { 
  toggle(modal, false); 
  setTimeout(() => toggle(overlay, false), 50); 
}

function updateHeaderState() {
  if (currentUser) {
    whoami.innerHTML = `<span class="badge-green">Logado</span>`;
    openLoginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
  } else {
    whoami.innerHTML = `<span class="badge-green">Visitante</span>`;
    openLoginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
  }
}

// ---- Auth ----
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  updateHeaderState();
});

// ---- Event Listeners ----
openLoginBtn?.addEventListener('click', () => openModal(loginOverlay, loginModal));

logoutBtn?.addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
});

loginClose?.addEventListener('click', () => closeModal(loginOverlay, loginModal));

loginOverlay?.addEventListener('click', (e) => {
  if (e.target === loginOverlay) closeModal(loginOverlay, loginModal);
});

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#login-email').value.trim();
  const pass = $('#login-pass').value.trim();
  
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    closeModal(loginOverlay, loginModal);
    $('#login-email').value = '';
    $('#login-pass').value = '';
  } catch (error) {
    alert('Falha no login: ' + error.message);
  }
}); 