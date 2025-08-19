
// NutriLife Blog - Firebase Firestore version
// Reads are public; writes require login with an admin UID (see firebase-config.js).
// Features: CRUD, categorias, busca, fixar post, tempo real via onSnapshot.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, onSnapshot, query, orderBy, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// ---- Configuração ----
// Defina window.FIREBASE_CONFIG e window.NUTRILIFE_ADMIN_UIDS em firebase-config.js
const firebaseConfig = window.FIREBASE_CONFIG;
const ADMIN_UIDS = window.NUTRILIFE_ADMIN_UIDS || [];

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Utils DOM
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
function fmtDate(ts) {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

// Estado
let currentUser = null;
let isAdmin = false;
let postsCache = [];

// Elements
const form = $('#blog-form');
const listEl = $('#post-list');
const cancelBtn = $('#cancel-edit');
const submitBtn = $('#submit-btn');
const titleEl = $('#post-title');
const contentEl = $('#post-content');
const categoryEl = $('#post-category');
const pinnedEl = $('#post-pinned');
const idEl = $('#post-id');

const searchEl = $('#filter-search');
const catFilterEl = $('#filter-category');
const sortEl = $('#filter-sort');

// Autenticação simples (admin)
const loginForm = $('#blog-login-form');
const loginBox = $('#blog-login-box');
const logoutBtn = $('#blog-logout');

function updateAdminUI() {
  // mostra/oculta formulário e botões de ação conforme privilégio
  if (isAdmin) {
    $('#blog-form').classList.remove('hidden');
    loginBox.classList.add('hidden');
  } else {
    $('#blog-form').classList.add('hidden');
    loginBox.classList.remove('hidden');
  }
  render();
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  isAdmin = !!(user && ADMIN_UIDS.includes(user.uid));
  const who = $('#whoami');
  who.textContent = isAdmin ? `Logado como admin` : (user ? `Logado (sem permissão de edição)` : `Não logado`);
  updateAdminUI();
});

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#blog-email').value.trim();
  const pass = $('#blog-pass').value.trim();
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    alert('Falha no login: ' + err.message);
  }
});

logoutBtn?.addEventListener('click', async () => {
  await signOut(auth);
});

// CRUD
function getFormData() {
  return {
    id: idEl.value || null,
    title: titleEl.value.trim(),
    content: contentEl.value.trim(),
    category: categoryEl.value.trim() || 'Sem categoria',
    pinned: pinnedEl.checked
  };
}

function resetForm() {
  idEl.value = '';
  titleEl.value = '';
  contentEl.value = '';
  categoryEl.value = '';
  pinnedEl.checked = false;
  submitBtn.textContent = 'Publicar';
  cancelBtn.classList.add('hidden');
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!isAdmin) { alert('Apenas administradores podem publicar.'); return; }
  const data = getFormData();
  if (!data.title || !data.content) { alert('Título e conteúdo são obrigatórios.'); return; }

  try {
    if (data.id) {
      const ref = doc(db, 'posts', data.id);
      await updateDoc(ref, {
        title: data.title,
        content: data.content,
        category: data.category,
        pinned: data.pinned,
        updatedAt: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, 'posts'), {
        title: data.title,
        content: data.content,
        category: data.category,
        pinned: data.pinned,
        createdAt: serverTimestamp(),
        updatedAt: null,
        authorUid: currentUser ? currentUser.uid : null
      });
    }
    resetForm();
    window.scrollTo({ top: $('#blog').offsetTop - 20, behavior: 'smooth' });
  } catch (err) {
    alert('Erro ao salvar: ' + err.message);
  }
});

cancelBtn?.addEventListener('click', () => resetForm());

async function handleEdit(id) {
  const p = postsCache.find(x => x.id === id);
  if (!p) return;
  idEl.value = p.id;
  titleEl.value = p.title;
  contentEl.value = p.content;
  categoryEl.value = p.category;
  pinnedEl.checked = !!p.pinned;
  submitBtn.textContent = 'Salvar edição';
  cancelBtn.classList.remove('hidden');
  window.scrollTo({ top: $('#blog-form').offsetTop - 12, behavior: 'smooth' });
}
async function handleDelete(id) {
  if (!isAdmin) { alert('Apenas administradores podem excluir.'); return; }
  if (!confirm('Excluir esta postagem?')) return;
  try {
    await deleteDoc(doc(db, 'posts', id));
  } catch (err) {
    alert('Erro ao excluir: ' + err.message);
  }
}
async function handlePin(id) {
  if (!isAdmin) { alert('Apenas administradores podem fixar.'); return; }
  const p = postsCache.find(x => x.id === id);
  if (!p) return;
  try {
    await updateDoc(doc(db, 'posts', id), {
      pinned: !p.pinned,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    alert('Erro ao atualizar: ' + err.message);
  }
}

// Listagem + filtros
function renderCategoriesIntoSelect() {
  const set = new Set(['Dieta Low Carb','Vegetariana','Vegana','Esportiva','Sem categoria']);
  postsCache.forEach(p => set.add(p.category || 'Sem categoria'));
  catFilterEl.innerHTML = '<option value="">Todas as categorias</option>' +
    Array.from(set).map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

function render() {
  if (!listEl) return;
  renderCategoriesIntoSelect();
  const q = (searchEl.value || '').trim().toLowerCase();
  const cat = catFilterEl.value;
  const sort = sortEl.value;

  let filtered = postsCache.filter(p => {
    const matchQ = !q || (p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
    const matchCat = !cat || p.category === cat;
    return matchQ && matchCat;
  });

  filtered.sort((a,b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === 'oldest') return (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0);
    if (sort === 'title') return a.title.localeCompare(b.title);
    return (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0);
  });

  if (!filtered.length) {
    listEl.innerHTML = `<p class="empty">Nenhuma postagem encontrada.</p>`;
    return;
  }

  listEl.innerHTML = filtered.map(p => `
    <article class="card" data-id="${p.id}">
      <h3>${escapeHtml(p.title)}</h3>
      <div class="meta">
        <span class="badge">${escapeHtml(p.category || 'Sem categoria')}</span>
        <span>Publicado: ${fmtDate(p.createdAt)}</span>
        ${p.updatedAt ? `<span>Atualizado: ${fmtDate(p.updatedAt)}</span>` : ''}
        ${p.pinned ? `<span>📌 Fixado</span>` : ''}
      </div>
      <div class="content">${escapeHtml(p.content)}</div>
      <div class="card-actions">
        ${isAdmin ? `
          <button class="btn btn-secondary" data-action="edit">Editar</button>
          <button class="btn btn-danger" data-action="delete">Excluir</button>
          <button class="btn btn-primary" data-action="pin">${p.pinned ? 'Desafixar' : 'Fixar'}</button>
        ` : ''}
      </div>
    </article>
  `).join('');

  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.closest('.card')?.dataset.id;
    if (!id) return;
    if (action === 'edit') handleEdit(id);
    if (action === 'delete') handleDelete(id);
    if (action === 'pin') handlePin(id);
  }, { once: true });
}

// Observa Firestore em tempo real
function watchPosts() {
  const qRef = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  onSnapshot(qRef, (snap) => {
    postsCache = snap.docs.map(d => {
      const v = d.data();
      const createdAtMs = v.createdAt?.toMillis ? v.createdAt.toMillis() : Date.now();
      return { id: d.id, ...v, createdAtMs };
    });
    render();
  });
}

// Filtros
[searchEl, catFilterEl, sortEl].forEach(el => el?.addEventListener('input', render));

// Init
watchPosts();
render();
