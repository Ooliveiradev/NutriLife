
// Blog NutriLife - Firestore (leitura privada) + modal de login e modal de post
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// ---- CONFIG ----
const firebaseConfig = window.FIREBASE_CONFIG;
const ADMIN_UIDS = window.NUTRILIFE_ADMIN_UIDS || [];
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ---- DOM utils ----
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
const esc = (s)=>String(s).replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt = (ts)=> ts?.toDate ? ts.toDate().toLocaleString() : "-";

// ---- Elements ----
const listEl = $('#post-list');
const searchEl = $('#filter-search');
const catFilterEl = $('#filter-category');
const sortEl = $('#filter-sort');

// header login button
const openLoginBtn = $('#open-login');
const logoutBtn = $('#logout-btn');
const whoami = $('#whoami');

// login modal
const loginOverlay = $('#login-overlay');
const loginModal = $('#login-modal');
const loginForm = $('#login-form');
const loginClose = $('#login-close');

// post modal
const postOverlay = $('#post-overlay');
const postModal = $('#post-modal');
const postOpenBtn = $('#open-post-modal');
const postCloseBtn = $('#post-close');
const submitBtn = $('#submit-btn');
const cancelEditBtn = $('#cancel-edit');

// post form fields
const idEl = $('#post-id');
const titleEl = $('#post-title');
const contentEl = $('#post-content');
const categoryEl = $('#post-category');
const pinnedEl = $('#post-pinned');

let currentUser = null;
let isAdmin = false;
let postsCache = [];

// ---- UI helpers ----
function toggle(el, state) {
  if (!el) return;
  el.classList[state ? 'add' : 'remove']('active');
}
function openModal(overlay, modal){ toggle(overlay, true); toggle(modal, true); }
function closeModal(overlay, modal){ toggle(modal, false); setTimeout(()=>toggle(overlay,false), 50); }

function resetForm(){
  idEl.value=''; titleEl.value=''; contentEl.value=''; categoryEl.value=''; pinnedEl.checked=false;
  submitBtn.textContent='Publicar'; cancelEditBtn.classList.add('hidden');
}

function updateHeaderState(){
  if (currentUser) {
    whoami.innerHTML = `<span class="badge-green">Logado</span>`;
    openLoginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    postOpenBtn.classList.remove('hidden'); // só deixa visível; permissão validamos no submit
  } else {
    whoami.innerHTML = `<span class="badge-green">Visitante</span>`;
    openLoginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    postOpenBtn.classList.add('hidden');
  }
}

onAuthStateChanged(auth, (user)=>{
  currentUser = user || null;
  isAdmin = !!(user && ADMIN_UIDS.includes(user.uid));
  updateHeaderState();
  // ao logar/deslogar, recarrega a lista (onSnapshot já está ativo)
});

// ---- login modal events ----
openLoginBtn?.addEventListener('click', ()=> openModal(loginOverlay, loginModal));
loginClose?.addEventListener('click', ()=> closeModal(loginOverlay, loginModal));
loginOverlay?.addEventListener('click', (e)=> { if(e.target===loginOverlay) closeModal(loginOverlay, loginModal); });
loginForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = $('#login-email').value.trim();
  const pass = $('#login-pass').value.trim();
  try{
    await signInWithEmailAndPassword(auth, email, pass);
    closeModal(loginOverlay, loginModal);
  } catch(err){
    alert('Falha no login: '+ err.message);
  }
});
logoutBtn?.addEventListener('click', ()=> signOut(auth));

// ---- post modal events ----
postOpenBtn?.addEventListener('click', ()=> {
  if (!currentUser) { alert('Você precisa estar logado.'); return; }
  if (!isAdmin) { alert('Sem permissão para publicar.'); return; }
  resetForm();
  openModal(postOverlay, postModal);
});
postCloseBtn?.addEventListener('click', ()=> closeModal(postOverlay, postModal));
postOverlay?.addEventListener('click', (e)=> { if(e.target===postOverlay) closeModal(postOverlay, postModal); });
cancelEditBtn?.addEventListener('click', ()=> { resetForm(); closeModal(postOverlay, postModal); });

// ---- CRUD ----
function getFormData(){
  return {
    id: idEl.value || null,
    title: titleEl.value.trim(),
    content: contentEl.value.trim(),
    category: categoryEl.value.trim() || 'Sem categoria',
    pinned: pinnedEl.checked
  };
}

$('#post-form')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if (!currentUser) return alert('Faça login para publicar.');
  if (!isAdmin) return alert('Apenas administradores podem publicar.');
  const data = getFormData();
  if (!data.title || !data.content) return alert('Título e conteúdo são obrigatórios.');
  try{
    if (data.id){
      await updateDoc(doc(db, 'posts', data.id), {
        title: data.title, content: data.content, category: data.category, pinned: data.pinned,
        updatedAt: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, 'posts'), {
        title: data.title, content: data.content, category: data.category, pinned: data.pinned,
        createdAt: serverTimestamp(), updatedAt: null, authorUid: currentUser.uid
      });
    }
    resetForm(); closeModal(postOverlay, postModal);
  }catch(err){ alert('Erro ao salvar: '+err.message); }
});

async function handleEdit(id){
  if (!currentUser) return alert('Faça login.');
  if (!isAdmin) return alert('Sem permissão.');
  const p = postsCache.find(x=>x.id===id); if(!p) return;
  idEl.value = p.id; titleEl.value=p.title; contentEl.value=p.content; categoryEl.value=p.category; pinnedEl.checked=!!p.pinned;
  submitBtn.textContent='Salvar edição'; cancelEditBtn.classList.remove('hidden');
  openModal(postOverlay, postModal);
}
async function handleDelete(id){
  if (!currentUser) return alert('Faça login.');
  if (!isAdmin) return alert('Sem permissão.');
  if (!confirm('Excluir esta postagem?')) return;
  await deleteDoc(doc(db,'posts', id));
}
async function handlePin(id){
  if (!currentUser) return alert('Faça login.');
  if (!isAdmin) return alert('Sem permissão.');
  const p = postsCache.find(x=>x.id===id); if(!p) return;
  await updateDoc(doc(db,'posts', id), { pinned: !p.pinned, updatedAt: serverTimestamp() });
}

// ---- List ----
function renderCats(){
  const set = new Set(['Dieta Low Carb','Vegetariana','Vegana','Esportiva','Sem categoria']);
  postsCache.forEach(p=> set.add(p.category||'Sem categoria'));
  catFilterEl.innerHTML = '<option value="">Todas</option>' + Array.from(set).map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
}
function render(){
  renderCats();
  const q = (searchEl.value||'').toLowerCase().trim();
  const cat = catFilterEl.value;
  const sort = sortEl.value;
  let arr = postsCache.filter(p=>{
    const mq = !q || p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
    const mc = !cat || p.category===cat;
    return mq && mc;
  });
  arr.sort((a,b)=>{
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort==='oldest') return a.createdAtMs - b.createdAtMs;
    if (sort==='title') return a.title.localeCompare(b.title);
    return b.createdAtMs - a.createdAtMs;
  });
  if (!arr.length){ listEl.innerHTML = '<p class="empty">Nenhuma postagem.</p>'; return; }
  listEl.innerHTML = arr.map(p=>`
    <article class="card" data-id="${p.id}">
      <h3>${esc(p.title)}</h3>
      <div class="meta">
        <span class="badge">${esc(p.category||'Sem categoria')}</span>
        <span>Publicado: ${fmt(p.createdAt)}</span>
        ${p.updatedAt? `<span>Atualizado: ${fmt(p.updatedAt)}</span>`:''}
        ${p.pinned? '<span>📌 Fixado</span>':''}
      </div>
      <div class="content">${esc(p.content)}</div>
      ${isAdmin ? `
      <div class="card-actions">
        <button class="btn btn-secondary" data-action="edit">Editar</button>
        <button class="btn btn-danger" data-action="delete">Excluir</button>
        <button class="btn btn-primary" data-action="pin">${p.pinned? 'Desafixar' : 'Fixar'}</button>
      </div>`:''}
    </article>
  `).join('');
  listEl.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-action]'); if(!btn) return;
    const id = btn.closest('.card')?.dataset.id; const act = btn.dataset.action;
    if (act==='edit') handleEdit(id);
    if (act==='delete') handleDelete(id);
    if (act==='pin') handlePin(id);
  }, { once: true });
}

// ---- realtime ----
(function watch(){
  const qRef = query(collection(db,'posts'), orderBy('createdAt','desc'));
  onSnapshot(qRef, (snap)=>{
    postsCache = snap.docs.map(d=>{
      const v = d.data();
      return { id: d.id, ...v, createdAtMs: v.createdAt?.toMillis ? v.createdAt.toMillis() : 0 };
    });
    render();
  });
})();

// ---- filters ----
[searchEl, catFilterEl, sortEl].forEach(el=> el?.addEventListener('input', render));
