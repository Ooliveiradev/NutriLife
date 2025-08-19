
// NutriLife Blog - Firebase Firestore (private read)
// - Leitura: apenas usuários autenticados (qualquer logado)
// - Escrita: apenas UIDs de admin (lista em firebase-config.js)
// - Modal de criação/edição que sobrepõe a página
// - Tempo real com onSnapshot

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = window.FIREBASE_CONFIG;
const ADMIN_UIDS = window.NUTRILIFE_ADMIN_UIDS || [];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// utils
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
const escapeHtml = (str='') => String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmtDate = (ts) => { if (!ts) return '-'; const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleString(); };

// elements
const listEl = $('#post-list');
const searchEl = $('#filter-search');
const catFilterEl = $('#filter-category');
const sortEl = $('#filter-sort');
const who = $('#whoami');

// modal elements
const openModalBtn = $('#open-post-modal');      // botão "Criar post"
const modal = $('#post-modal');
const modalBackdrop = $('#post-modal-backdrop');
const closeModalBtns = $$('.modal-close');
const form = $('#blog-form');
const idEl = $('#post-id');
const titleEl = $('#post-title');
const contentEl = $('#post-content');
const categoryEl = $('#post-category');
const pinnedEl = $('#post-pinned');
const submitBtn = $('#submit-btn');

// auth box
const loginBox = $('#blog-login-box');
const loginForm = $('#blog-login-form');
const emailEl = $('#blog-email');
const passEl = $('#blog-pass');
const logoutBtn = $('#blog-logout');

let currentUser = null;
let isAdmin = false;
let unsubPosts = null;
let postsCache = [];

// UI helpers
function show(el){ el?.classList.remove('hidden'); el?.classList.add('show'); }
function hide(el){ el?.classList.add('hidden'); el?.classList.remove('show'); }
function openModal(){ show(modalBackdrop); show(modal); titleEl.focus(); }
function closeModal(){ hide(modalBackdrop); hide(modal); resetForm(); }

closeModalBtns.forEach(b => b.addEventListener('click', closeModal));
modalBackdrop?.addEventListener('click', closeModal);
openModalBtn?.addEventListener('click', () => {
  if (!currentUser) { alert('Faça login para criar um post.'); return; }
  if (!isAdmin) { alert('Apenas administradores podem publicar.'); return; }
  openModal();
});

// auth
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  isAdmin = !!(user && ADMIN_UIDS.includes(user.uid));
  if (who) who.textContent = user ? (isAdmin ? 'Logado como admin' : 'Logado') : 'Não logado';

  if (user) {
    hide(loginBox);
    watchPosts();  // começa observar posts só quando logado
  } else {
    show(loginBox);
    postsCache = [];
    render();
    if (typeof unsubPosts === 'function') { unsubPosts(); unsubPosts = null; }
  }
});

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, emailEl.value.trim(), passEl.value.trim());
    emailEl.value = ''; passEl.value = '';
  } catch (err) {
    alert('Falha no login: ' + err.message);
  }
});

logoutBtn?.addEventListener('click', async () => {
  await signOut(auth);
});

// form
function getFormData(){
  return {
    id: idEl.value || null,
    title: titleEl.value.trim(),
    content: contentEl.value.trim(),
    category: categoryEl.value.trim() || 'Sem categoria',
    pinned: pinnedEl.checked
  };
}
function resetForm(){
  idEl.value = '';
  titleEl.value = '';
  contentEl.value = '';
  categoryEl.value = '';
  pinnedEl.checked = false;
  submitBtn.textContent = 'Publicar';
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) { alert('Faça login.'); return; }
  if (!isAdmin) { alert('Apenas administradores podem publicar.'); return; }
  const data = getFormData();
  if (!data.title || !data.content) { alert('Título e conteúdo são obrigatórios.'); return; }
  try {
    if (data.id) {
      await updateDoc(doc(db, 'posts', data.id), {
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
        authorUid: currentUser.uid
      });
    }
    closeModal();
  } catch (err) {
    alert('Erro ao salvar: ' + err.message);
  }
});

async function handleEdit(id){
  if (!isAdmin) { alert('Apenas administradores podem editar.'); return; }
  const p = postsCache.find(x => x.id === id);
  if (!p) return;
  idEl.value = p.id;
  titleEl.value = p.title;
  contentEl.value = p.content;
  categoryEl.value = p.category;
  pinnedEl.checked = !!p.pinned;
  submitBtn.textContent = 'Salvar edição';
  openModal();
}
async function handleDelete(id){
  if (!isAdmin) { alert('Apenas administradores podem excluir.'); return; }
  if (!confirm('Excluir esta postagem?')) return;
  await deleteDoc(doc(db, 'posts', id));
}
async function handlePin(id){
  if (!isAdmin) { alert('Apenas administradores podem fixar.'); return; }
  const p = postsCache.find(x => x.id === id);
  if (!p) return;
  await updateDoc(doc(db, 'posts', id), {
    pinned: !p.pinned,
    updatedAt: serverTimestamp()
  });
}

// list/filtros
function renderCategoriesIntoSelect(){
  if (!catFilterEl) return;
  const set = new Set(['Dieta Low Carb','Vegetariana','Vegana','Esportiva','Sem categoria']);
  postsCache.forEach(p => set.add(p.category || 'Sem categoria'));
  catFilterEl.innerHTML = '<option value="">Todas as categorias</option>' +
    Array.from(set).map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

function render(){
  if (!listEl) return;
  if (!currentUser) {
    listEl.innerHTML = `<p class="empty">Faça login para ver as postagens.</p>`;
    return;
  }
  renderCategoriesIntoSelect();
  const q = (searchEl?.value || '').trim().toLowerCase();
  const cat = catFilterEl?.value;
  const sort = sortEl?.value || 'newest';

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
      ${isAdmin ? `
      <div class="card-actions">
        <button class="btn btn-secondary" data-action="edit">Editar</button>
        <button class="btn btn-danger" data-action="delete">Excluir</button>
        <button class="btn btn-primary" data-action="pin">${p.pinned ? 'Desafixar' : 'Fixar'}</button>
      </div>` : ``}
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

// realtime
function watchPosts(){
  if (typeof unsubPosts === 'function') { unsubPosts(); unsubPosts = null; }
  const qRef = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  unsubPosts = onSnapshot(qRef, (snap) => {
    postsCache = snap.docs.map(d => {
      const v = d.data();
      const createdAtMs = v.createdAt?.toMillis ? v.createdAt.toMillis() : Date.now();
      return { id: d.id, ...v, createdAtMs };
    });
    render();
  }, (err) => {
    console.error(err);
    listEl.innerHTML = `<p class="empty">Sem permissão para ler. Faça login.</p>`;
  });
}

// filtros
[searchEl, catFilterEl, sortEl].forEach(el => el?.addEventListener('input', render));
render(); // initial
