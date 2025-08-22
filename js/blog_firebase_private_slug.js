
// Blog NutriLife - Firestore (leitura privada)
// Modais: login, post (criar/editar), visualizar
// Recursos extra: resumo com "Ler mais", permalink com slug (?p=slug), deep-link e botão de copiar link
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

// view modal (Ler mais)
const viewOverlay = $('#view-overlay');
const viewModal = $('#view-modal');
const viewCloseBtn = $('#view-close');
const viewTitle = $('#view-title');
const viewMeta = $('#view-meta');
const viewContent = $('#view-content');

let currentUser = null;
let isAdmin = false;
let postsCache = [];
let openedSlug = null; // controle de deep-link atual

// ---- Helpers ----
function toggle(el, state) { if (!el) return; el.classList[state ? 'add' : 'remove']('active'); }
function openModal(overlay, modal){ toggle(overlay, true); toggle(modal, true); }
function closeModal(overlay, modal){ toggle(modal, false); setTimeout(()=>toggle(overlay,false), 50); }
function resetForm(){ idEl.value=''; titleEl.value=''; contentEl.value=''; categoryEl.value=''; pinnedEl.checked=false; submitBtn.textContent='Publicar'; cancelEditBtn.classList.add('hidden'); }

function updateHeaderState(){
  if (currentUser) {
    whoami.innerHTML = `<span class="badge-green">Logado</span>`;
    openLoginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    postOpenBtn?.classList.remove('hidden');
  } else {
    whoami.innerHTML = `<span class="badge-green">Visitante</span>`;
    openLoginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    postOpenBtn?.classList.add('hidden');
  }
}

onAuthStateChanged(auth, (user)=>{
  currentUser = user || null;
  isAdmin = !!(user && ADMIN_UIDS.includes(user.uid));
  updateHeaderState();
});

// Slug helpers
function slugify(str){
  return String(str || 'post')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'') // remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post';
}
function uniqueSlug(base){
  const taken = new Set(postsCache.map(p=>p.slug).filter(Boolean));
  let s = base, i = 2;
  while (taken.has(s)) { s = `${base}-${i++}`; }
  return s;
}
function postURL(p){
  const url = new URL(window.location.href);
  const slug = p.slug || slugify(p.title);
  url.searchParams.set('p', slug);
  url.searchParams.delete('id');
  return url.toString();
}

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
      // Atualiza sem mexer no slug (mantém permalink estável)
      await updateDoc(doc(db, 'posts', data.id), {
        title: data.title, content: data.content, category: data.category, pinned: data.pinned,
        updatedAt: serverTimestamp()
      });
    } else {
      const base = slugify(data.title);
      const slug = uniqueSlug(base);
      await addDoc(collection(db, 'posts'), {
        title: data.title, content: data.content, category: data.category, pinned: data.pinned,
        slug,
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

// ---- Excerpt / Ler mais ----
function makeExcerpt(text, limit=320) {
  if (!text) return '';
  if (text.includes('<!--more-->')) return text.split('<!--more-->')[0].trim();
  if (text.includes('\n---\n')) return text.split('\n---\n')[0].trim();
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= limit) return clean;
  let cut = clean.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 150) cut = cut.slice(0, lastSpace);
  return cut + '…';
}

function ensureShareUI(){
  // cria área de ações (copiar link / abrir) dentro do modal de leitura, se não existir
  let box = $('#view-share');
  if (box) return box;
  box = document.createElement('div');
  box.className = 'actions';
  box.id = 'view-share';
  box.innerHTML = `
    <button class="btn btn-secondary" id="copy-link">Copiar link</button>
    <a class="btn btn-primary" id="open-link" href="#" target="_blank" rel="noopener">Abrir link</a>
  `;
  viewModal?.querySelector('.body')?.appendChild(box);
  return box;
}

function openView(p, push=true){
  if (!p) return;
  ensureShareUI();
  viewTitle.textContent = p.title;
  viewMeta.innerHTML = `
    <span class="badge">${esc(p.category || 'Sem categoria')}</span>
    <span>Publicado: ${fmt(p.createdAt)}</span>
    ${p.updatedAt ? `<span>Atualizado: ${fmt(p.updatedAt)}</span>` : ''}
    ${p.pinned ? `<span>📌 Fixado</span>` : ''}
  `;
  viewContent.textContent = p.content || '';

  // permalink
  const url = postURL(p);
  const openA = $('#open-link'); if (openA) openA.href = url;
  const copyBtn = $('#copy-link'); 
  if (copyBtn) {
    copyBtn.onclick = async ()=>{
      try { await navigator.clipboard.writeText(url); copyBtn.textContent = 'Copiado!'; setTimeout(()=>copyBtn.textContent='Copiar link',1200); }
      catch { alert('Não foi possível copiar.'); }
    };
  }
  openedSlug = p.slug || slugify(p.title);
  if (push) {
    history.pushState({view:'post', slug: openedSlug}, '', url);
  }
  openModal(viewOverlay, viewModal);
}

function closeView(push=true){
  closeModal(viewOverlay, viewModal);
  if (push) {
    const url = new URL(window.location.href);
    url.searchParams.delete('p');
    url.searchParams.delete('id');
    history.replaceState({}, '', url);
    openedSlug = null;
  }
}

viewCloseBtn?.addEventListener('click', ()=> closeView());
viewOverlay?.addEventListener('click', (e)=> { if(e.target===viewOverlay) closeView(); });

// deep-link via back/forward
window.addEventListener('popstate', (e)=>{
  const params = new URLSearchParams(location.search);
  const slug = params.get('p'); const id = params.get('id');
  if (!slug && !id) {
    // fechar se estava aberto
    if (openedSlug) closeView(false);
    return;
  }
  // abrir o post correspondente
  const p = slug ? postsCache.find(x=> (x.slug || slugify(x.title)) === slug)
                 : postsCache.find(x=> x.id === id);
  if (p) openView(p, false);
});

// ---- List ----
function renderCats(){
  const selected = catFilterEl.value;
  const set = new Set(['Dieta Low Carb','Vegetariana','Vegana','Esportiva','Sem categoria','Hábitos Saudáveis']);
  postsCache.forEach(p=> set.add(p.category||'Sem categoria'));
  catFilterEl.innerHTML = '<option value="">Todas</option>' +
    Array.from(set).map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
  catFilterEl.value = selected;
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

  listEl.innerHTML = arr.map(p=>{
    const excerpt = makeExcerpt(p.content || '');
    const slug = p.slug || slugify(p.title);
    const share = new URL(window.location.href); share.searchParams.set('p', slug);
    return `
    <article class="card" data-id="${p.id}">
      <h3>${esc(p.title)}</h3>
      <div class="meta">
        <span class="badge">${esc(p.category||'Sem categoria')}</span>
        <span>Publicado: ${fmt(p.createdAt)}</span>
        ${p.updatedAt? `<span>Atualizado: ${fmt(p.updatedAt)}</span>`:''}
        ${p.pinned? '<span>📌 Fixado</span>':''}
        <a href="${share.toString()}" class="btn btn-secondary" style="padding:4px 8px; font-size:.85rem;" data-action="share" data-slug="${slug}">🔗 Link</a>
      </div>
      <div class="content excerpt">${esc(excerpt)}</div>
      <div class="card-actions">
        <button class="btn btn-secondary" data-action="view">Ler mais</button>
        ${isAdmin ? `
          <button class="btn btn-secondary" data-action="edit">Editar</button>
          <button class="btn btn-danger" data-action="delete">Excluir</button>
          <button class="btn btn-primary" data-action="pin">${p.pinned? 'Desafixar' : 'Fixar'}</button>
        ` : ''}
      </div>
    </article>`;
  }).join('');
}

function handleListClick(e){
  const a = e.target.closest('a[data-action="share"]');
  if (a) {
    e.preventDefault();
    const slug = a.dataset.slug;
    const p = postsCache.find(x=> (x.slug || slugify(x.title)) === slug);
    if (p) openView(p);
    return;
  }
  const btn = e.target.closest('button[data-action]');
  if(!btn) return;
  const id = btn.closest('.card')?.dataset.id;
  const act = btn.dataset.action;
  const p = postsCache.find(x=>x.id===id);
  if (act==='view') openView(p);
  if (act==='edit') handleEdit(id);
  if (act==='delete') handleDelete(id);
  if (act==='pin') handlePin(id);
}

// ---- realtime + deep-link on load ----
if (listEl) {
  listEl.addEventListener('click', handleListClick);
  (function watch(){
    const qRef = query(collection(db,'posts'), orderBy('createdAt','desc'));
    onSnapshot(qRef, (snap)=>{
      postsCache = snap.docs.map(d=>{
        const v = d.data();
        return { id: d.id, ...v, createdAtMs: v.createdAt?.toMillis ? v.createdAt.toMillis() : 0 };
      });
      render();

      // Deep-link: se tiver ?p=slug ou ?id=...
      const params = new URLSearchParams(location.search);
      const slug = params.get('p'); const id = params.get('id');
      if (slug) {
        const p = postsCache.find(x=> (x.slug || slugify(x.title)) === slug);
        if (p) openView(p, false);
      } else if (id) {
        const p = postsCache.find(x=> x.id === id);
        if (p) openView(p, false);
      }
    });
  })();

  [searchEl, catFilterEl, sortEl].forEach(el=> el?.addEventListener('input', render));
}


// ==== Fechar modais com ESC ====
document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape') {
    if (document.querySelector('#view-modal.active')) closeView();
    if (document.querySelector('#post-modal.active')) closeModal(postOverlay, postModal);
    if (document.querySelector('#login-modal.active')) closeModal(loginOverlay, loginModal);
  }
});
